from rest_framework import serializers

from .models import Order, OrderItem, Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "title", "description", "price", "stock", "image"]


class CheckoutSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    shipping_name = serializers.CharField(max_length=150)
    shipping_phone = serializers.CharField(max_length=15)
    shipping_address = serializers.CharField()


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "price_at_purchase"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "total_amount",
            "created_at",
            "is_paid",
            "status",
            "shipping_name",
            "shipping_phone",
            "shipping_address",
            "items",
        ]
