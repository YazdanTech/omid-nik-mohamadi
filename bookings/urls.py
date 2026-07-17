from django.urls import path

from .views import (
       AvailableSlotsView, 
       CreateBookingView,
       PaymentVerifyView, 
)


app_name = "bookings_api"

urlpatterns = [
    path("available-slots/", AvailableSlotsView.as_view(), name="available-slots"),
    path("create/", CreateBookingView.as_view(), name="create-booking"),
    path("payment-verify/", PaymentVerifyView.as_view(), name="payment-verify"),
]
