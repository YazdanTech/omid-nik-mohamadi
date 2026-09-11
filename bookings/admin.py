from django.contrib import admin
from django.utils.translation import gettext_lazy as _

import jdatetime
from .models import Booking, BookingSlot, BypassCode


@admin.action(description=_("علامت‌گذاری به عنوان رزروشده"))
def mark_booked(modeladmin, request, queryset):
    queryset.update(is_booked=True)


@admin.action(description=_("علامت‌گذاری به عنوان آزاد"))
def mark_available(modeladmin, request, queryset):
    queryset.update(is_booked=False)


@admin.register(BookingSlot)
class BookingSlotAdmin(admin.ModelAdmin):
    list_display = ["date", "start_time", "is_booked"]
    list_filter = ["date", "is_booked"]
    date_hierarchy = "date"
    list_editable = ["is_booked"]
    ordering = ["date", "start_time"]
    actions = [mark_booked, mark_available]


@admin.register(BypassCode)
class BypassCodeAdmin(admin.ModelAdmin):
    list_display = ["code", "description", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["code"]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["user", "get_services", "status", "deposit_paid", "get_created_at_jalali"]
    list_filter = ["status", "deposit_paid", "services"]
    search_fields = ["user__phone_number", "user__full_name"]
    autocomplete_fields = ["user", "services"]
    date_hierarchy = "created_at"

    @admin.display(description=_("خدمات"))
    def get_services(self, obj):
        return ", ".join([str(s) for s in obj.services.all()])

    @admin.display(description=_("زمان ایجاد"))
    def get_created_at_jalali(self, obj):
        return jdatetime.datetime.fromgregorian(datetime=obj.created_at).strftime("%Y/%m/%d %H:%M")
