from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, OrderItem, Product
from .serializers import CheckoutSerializer, OrderSerializer, ProductSerializer


class ProductCatalogView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(stock__gt=0)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            product = get_object_or_404(Product.objects.select_for_update(), id=data["product_id"])

            if product.stock < data["quantity"]:
                return Response({"detail": "موجودی کافی نیست"}, status=status.HTTP_409_CONFLICT)

            product.stock -= data["quantity"]
            product.save(update_fields=["stock"])

            total_amount = product.price * data["quantity"]

            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                status=Order.Status.PENDING,
                shipping_name=data["shipping_name"],
                shipping_phone=data["shipping_phone"],
                shipping_address=data["shipping_address"],
            )

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=data["quantity"],
                price_at_purchase=product.price,
            )

        return Response(
            {
                "order": OrderSerializer(order).data,
                "payment_payload": {"order_id": order.id, "amount": str(total_amount)},
            },
            status=status.HTTP_201_CREATED,
        )


class OrderPaymentVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return self._verify(request)

    def post(self, request):
        return self._verify(request)

    def _verify(self, request):
        order_id = request.data.get("order_id") or request.query_params.get("order_id")
        payment_success = request.data.get("success") or request.query_params.get("success")

        order = get_object_or_404(Order, id=order_id)

        with transaction.atomic():
            if str(payment_success).lower() in ("1", "true"):
                order.is_paid = True
                order.status = Order.Status.PAID
                order.save(update_fields=["is_paid", "status"])
            else:
                order.status = Order.Status.CANCELLED
                order.save(update_fields=["status"])
                for item in order.items.select_related("product"):
                    item.product.stock += item.quantity
                    item.product.save(update_fields=["stock"])

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
