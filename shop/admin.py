from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "price", "stock", "image"]
    list_filter = ["stock"]
    search_fields = ["title"]
    list_editable = ["price", "stock"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "quantity", "price_at_purchase"]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status_badge", "total_amount", "is_paid", "created_at"]
    list_filter = ["status", "is_paid", "created_at"]
    search_fields = ["user__phone_number", "user__full_name", "shipping_phone"]
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
    readonly_fields = ["total_amount", "created_at"]

    STATUS_COLORS = {
        "Pending": "#f0ad4e",
        "Paid": "#5bc0de",
        "Delivered": "#5cb85c",
        "Cancelled": "#d9534f",
    }

    def status_badge(self, obj):
        color = self.STATUS_COLORS.get(obj.status, "#777")
        return format_html(
            '<span style="background-color:{};color:#fff;padding:3px 10px;'
            'border-radius:10px;font-size:12px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "وضعیت"
