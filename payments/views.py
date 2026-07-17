import requests

from django.conf import settings
from django.shortcuts import get_object_or_404, redirect, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Payment


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
        "type": request.GET.get("type", "booking"),  # Fallback to booking
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
        payment = get_object_or_404(Payment, id=payment_id, status=Payment.Status.PENDING)

        urls = get_zarinpal_urls()
        payload = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": payment.amount,
            "description": f"پرداخت سفارش/رزرو {payment.id}",
            "callback_url": settings.ZARINPAL_CALLBACK_URL,
            "metadata": {"mobile": request.user.phone_number} # Adjust to your user model
        }

        response = requests.post(urls["request"], json=payload)
        res_data = response.json()

        if res_data.get("data") and res_data["data"].get("code") == 100:
            authority = res_data["data"]["authority"]
            payment.authority = authority
            payment.save(update_fields=["authority"])
            
            return Response({"payment_url": f"{urls['startpay']}{authority}"}, status=status.HTTP_200_OK)
        
        return Response({"detail": "خطا در اتصال به درگاه"}, status=status.HTTP_400_BAD_REQUEST)


class PaymentVerifyView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        status_param = request.GET.get("Status")
        authority = request.GET.get("Authority")

        payment = get_object_or_404(Payment, authority=authority)
        pay_type = payment.content_type.model 
        content_obj = payment.content_object

        # 1. Handle Cancelled Payment
        if status_param != "OK":
            payment.status = Payment.Status.CANCELED
            payment.save(update_fields=["status"])
            
            # Hook for failure/cancellation
            if hasattr(content_obj, 'mark_as_failed'):
                content_obj.mark_as_failed()
                
            return redirect(f"/api/payment/failed/?type={pay_type}&payment_id={payment.id}&reason=canceled")

        urls = get_zarinpal_urls()
        payload = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": int(payment.amount),
            "authority": authority
        }

        response = requests.post(urls["verify"], json=payload)
        
        try:
            res_data = response.json()
        except ValueError:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            
            if hasattr(content_obj, 'mark_as_failed'):
                content_obj.mark_as_failed()
                
            return redirect(f"/api/payment/failed/?type={pay_type}&payment_id={payment.id}&reason=invalid_gateway_response")

        # 2. Handle Successful Verification
        if res_data.get("data") and res_data["data"].get("code") in [100, 101]:
            payment.status = Payment.Status.SUCCESS
            payment.ref_id = res_data["data"]["ref_id"]
            payment.save(update_fields=["status", "ref_id"])

            # Hook for success
            if hasattr(content_obj, 'mark_as_paid'):
                content_obj.mark_as_paid()

            return redirect(f"/api/payment/success/?type={pay_type}&ref_id={payment.ref_id}")

        # 3. Handle Failed Verification
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"])
        
        if hasattr(content_obj, 'mark_as_failed'):
            content_obj.mark_as_failed()
            
        return redirect(f"/api/payment/failed/?type={pay_type}&payment_id={payment.id}&reason=verification_failed")