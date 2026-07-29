import requests

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404, redirect, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Payment
from shop.models import Order
# Ensure you import Booking from your respective app (e.g. from bookings.models import Booking)


def get_zarinpal_urls():
    if getattr(settings, 'ZARINPAL_SANDBOX', False):
        return {
            "request": "https://sandbox.zarinpal.com/pg/v4/payment/request.json",
            "startpay": "https://sandbox.zarinpal.com/pg/StartPay/",
            "verify": "https://sandbox.zarinpal.com/pg/v4/payment/verify.json",
        }
    return {
        "request": "https://api.zarinpal.com/pg/v4/payment/request.json",
        "startpay": "https://www.zarinpal.com/pg/StartPay/",
        "verify": "https://api.zarinpal.com/pg/v4/payment/verify.json",
    }


def payment_success(request):
    return render(request, "payment-status.html", {
        "state": "success",
        "type": request.GET.get("type", "booking"),
        "ref_id": request.GET.get("ref_id"),
    })


def payment_failed(request):
    return render(request, "payment-status.html", {
        "state": "failed",
        "type": request.GET.get("type", "booking"),
        "reason": request.GET.get("reason"),
    })


class PaymentRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        order_id = request.data.get("order_id")
        booking_id = request.data.get("booking_id")

        if payment_id:
            payment = get_object_or_404(Payment, id=payment_id, status=Payment.Status.PENDING)

        elif order_id:
            order = get_object_or_404(Order, id=order_id, user=request.user)
            content_type = ContentType.objects.get_for_model(Order)
            
            payment, _ = Payment.objects.get_or_create(
                content_type=content_type,
                object_id=str(order.id),
                status=Payment.Status.PENDING,
                defaults={"amount": order.total_amount}
            )

        elif booking_id:
            # Assuming Booking model exists and links to user
            booking = get_object_or_404(Booking, id=booking_id, user=request.user)
            content_type = ContentType.objects.get_for_model(Booking)

            payment, _ = Payment.objects.get_or_create(
                content_type=content_type,
                object_id=str(booking.id),
                status=Payment.Status.PENDING,
                defaults={"amount": booking.service.price}
            )
        else:
            return Response(
                {"detail": "شناسه پرداخت، سفارش یا رزرو ارسال نشده است."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        urls = get_zarinpal_urls()
        user_phone = getattr(request.user, "phone_number", None) or getattr(request.user, "phone", "")

        payload = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": int(payment.amount),
            "description": f"پرداخت {payment.content_type.model} #{payment.object_id}",
            "callback_url": settings.ZARINPAL_CALLBACK_URL,
            "metadata": {"mobile": str(user_phone)}
        }

        try:
            response = requests.post(urls["request"], json=payload, timeout=10)
            res_data = response.json()
        except Exception as e:
            return Response(
                {"detail": "خطا در ارتباط با درگاه پرداخت", "error": str(e)}, 
                status=status.HTTP_502_BAD_GATEWAY
            )

        if res_data.get("data") and res_data["data"].get("code") == 100:
            authority = res_data["data"]["authority"]
            payment.authority = authority
            payment.save(update_fields=["authority"])
            
            return Response({"payment_url": f"{urls['startpay']}{authority}"}, status=status.HTTP_200_OK)
        
        return Response(
            {
                "detail": "خطا در ایجاد تراکنش درگاه",
                "zarinpal_errors": res_data.get("errors", res_data)
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )


class PaymentVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        status_param = request.GET.get("Status")
        authority = request.GET.get("Authority")

        if not authority:
            return redirect("/api/payment/failed/?reason=missing_authority")

        payment = get_object_or_404(Payment, authority=authority)
        pay_type = payment.content_type.model 
        content_obj = payment.content_object

        # 1. Handle Cancelled Payment
        if status_param != "OK":
            payment.status = Payment.Status.CANCELED
            payment.save(update_fields=["status"])
            
            if content_obj and hasattr(content_obj, 'mark_as_failed'):
                content_obj.mark_as_failed()
                
            return redirect(f"/api/payment/failed/?type={pay_type}&payment_id={payment.id}&reason=canceled")

        urls = get_zarinpal_urls()
        payload = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": int(payment.amount),
            "authority": authority
        }

        try:
            response = requests.post(urls["verify"], json=payload, timeout=10)
            res_data = response.json()
        except (requests.RequestException, ValueError):
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            
            if content_obj and hasattr(content_obj, 'mark_as_failed'):
                content_obj.mark_as_failed()
                
            return redirect(f"/api/payment/failed/?type={pay_type}&payment_id={payment.id}&reason=invalid_gateway_response")

        # 2. Handle Successful Verification (100 = New success, 101 = Already verified)
        if res_data.get("data") and res_data["data"].get("code") in [100, 101]:
            payment.status = Payment.Status.SUCCESS
            payment.ref_id = str(res_data["data"].get("ref_id", ""))
            payment.save(update_fields=["status", "ref_id"])

            if content_obj and hasattr(content_obj, 'mark_as_paid'):
                content_obj.mark_as_paid()

            return redirect(f"/api/payment/success/?type={pay_type}&ref_id={payment.ref_id}")

        # 3. Handle Failed Verification
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"])
        
        if content_obj and hasattr(content_obj, 'mark_as_failed'):
            content_obj.mark_as_failed()
            
        return redirect(f"/api/payment/failed/?type={pay_type}&payment_id={payment.id}&reason=verification_failed")