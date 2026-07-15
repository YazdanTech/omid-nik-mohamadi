from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    # Columns shown in the admin list view
    list_display = (
        'id',
        'get_user',
        'get_related_object',
        'amount_formatted',
        'status_badge',
        'ref_id',
        'authority',
        'created_at',
    )
    
    list_filter = ('status', 'content_type', 'created_at')
    search_fields = ('id', 'authority', 'ref_id', 'object_id')
    readonly_fields = ('id', 'created_at', 'updated_at')

    # 1. Format amount with thousands separator
    def amount_formatted(self, obj):
        # Format the integer to a string with commas first
        formatted_value = f"{obj.amount:,}"
        return format_html("<span style='font-family: monospace;'>{} تومان</span>", formatted_value)
    amount_formatted.short_description = "مبلغ"
    amount_formatted.admin_order_field = "amount"

    # 2. Dynamic status badge with color coding
    def status_badge(self, obj):
        colors = {
            'SUCCESS': '#2dbe60',  # Green
            'PENDING': '#f1c40f',  # Yellow
            'FAILED': '#e74c3c',   # Red
            'CANCELED': '#7f8c8d'  # Grey
        }
        labels = {
            'SUCCESS': 'موفق',
            'PENDING': 'در انتظار',
            'FAILED': 'ناموفق',
            'CANCELED': 'لغو شده'
        }
        color = colors.get(obj.status, '#000000')
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">{}</span>',
            color, label
        )
    status_badge.short_description = "وضعیت"
    status_badge.admin_order_field = "status"

    # 3. Resolve and link the paying User (via the content object)
    def get_user(self, obj):
        if not obj.content_object:
            return "—"
        
        # Check if the related model (e.g. Booking) has a 'user' or 'customer' field
        user = getattr(obj.content_object, 'user', None) or getattr(obj.content_object, 'customer', None)
        if user:
            # Displays phone number or fallback string
            user_display = getattr(user, 'phone_number', None) or getattr(user, 'username', None) or str(user)
            try:
                # Direct link to the user's admin change page
                url = reverse(f"admin:{user._meta.app_label}_{user._meta.model_name}_change", args=[user.pk])
                return format_html('<a href="{}" style="font-weight: bold;">{}</a>', url, user_display)
            except Exception:
                return user_display
        return "بدون کاربر"
    get_user.short_description = "کاربر پرداخت‌کننده"

    # 4. Link directly to the related Booking or Order
    def get_related_object(self, obj):
        if not obj.content_object:
            return "—"
        
        try:
            # Find the admin page URL for the content type
            url = reverse(
                f"admin:{obj.content_type.app_label}_{obj.content_type.model}_change",
                args=[obj.object_id]
            )
            return format_html(
                '<a href="{}">{} <span style="color: #777;">(شناسه: {})</span></a>',
                url, obj.content_type.name.capitalize(), obj.object_id
            )
        except Exception:
            return f"{obj.content_type.name.capitalize()} ({obj.object_id})"
    get_related_object.short_description = "سند مربوطه"