import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
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
    permission_classes = [AllowAny] # Gateway will ping this, user might not send auth headers

    def get(self, request):
        status_param = request.GET.get("Status")
        authority = request.GET.get("Authority")

        payment = get_object_or_404(Payment, authority=authority)

        if status_param != "OK":
            payment.status = Payment.Status.CANCELED
            payment.save(update_fields=["status"])
            # Redirect frontend to a failure page:
            # return HttpResponseRedirect(f"http://your-frontend.com/payment/failed?id={payment.id}")
            return Response({"detail": "پرداخت لغو شد"}, status=status.HTTP_400_BAD_REQUEST)

        urls = get_zarinpal_urls()
        payload = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": payment.amount,
            "authority": authority
        }

        response = requests.post(urls["verify"], json=payload)
        res_data = response.json()

        if res_data.get("data") and res_data["data"].get("code") in [100, 101]:
            payment.status = Payment.Status.SUCCESS
            payment.ref_id = res_data["data"]["ref_id"]
            payment.save(update_fields=["status", "ref_id"])

            # MAGIC HAPPENS HERE: Trigger the related object's custom logic
            if hasattr(payment.content_object, 'mark_as_paid'):
                payment.content_object.mark_as_paid()

            # Redirect frontend to a success page:
            # return HttpResponseRedirect(f"http://your-frontend.com/payment/success?ref={payment.ref_id}")
            return Response({"detail": "پرداخت موفق", "ref_id": payment.ref_id})

        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"])
        return Response({"detail": "پرداخت ناموفق بود"}, status=status.HTTP_400_BAD_REQUEST)