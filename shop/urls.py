from django.urls import path

from .views import CheckoutView, OrderPaymentVerifyView, ProductCatalogView, product_page

app_name = "shop"

urlpatterns = [
    path("products/", product_page, name="product_page"),
    
    path("api/product/list", ProductCatalogView.as_view(), name="product-list"),
    path("api/checkout/", CheckoutView.as_view(), name="checkout"),
    path("api/product/payment-verify/", OrderPaymentVerifyView.as_view(), name="payment-verify"),
]
