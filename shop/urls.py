from django.urls import path

from .views import CheckoutView, OrderPaymentVerifyView, ProductCatalogView

app_name = "shop_api"

urlpatterns = [
    path("products/", ProductCatalogView.as_view(), name="product-list"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("payment-verify/", OrderPaymentVerifyView.as_view(), name="payment-verify"),
]
