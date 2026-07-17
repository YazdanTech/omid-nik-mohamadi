from django.urls import path
from .views import PaymentRequestView, PaymentVerifyView, payment_success, payment_failed

app_name = "payments"

urlpatterns = [
    path("request/", PaymentRequestView.as_view(), name="payment-request"),
    path("verify/", PaymentVerifyView.as_view(), name="payment-verify"),
    path("success/", payment_success, name="payment-success"),
    path("failed/", payment_failed, name="payment-failed"),
    
]