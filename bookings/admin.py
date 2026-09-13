from django.contrib import admin
from django.utils.translation import gettext_lazy as _

import jdatetime
from .models import Booking, BookingSlot, BypassCode

from django import forms
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from django_jalali.forms import jDateField
from django_jalali.admin.widgets import AdminjDateWidget

import datetime
from django.forms.widgets import MultiWidget, Select
from django.forms.fields import MultiValueField, ChoiceField


HOURS = [(h, f"{h:02d}") for h in range(24)]
MINUTES = [(m, f"{m:02d}") for m in range(0, 60, 5)]  # change step to 30 if you only want :00/:30


class SelectTimeWidget(MultiWidget):
    def __init__(self, attrs=None):
        widgets = [Select(attrs=attrs, choices=HOURS), Select(attrs=attrs, choices=MINUTES)]
        super().__init__(widgets, attrs)

    def decompress(self, value):
        if isinstance(value, datetime.time):
            return [value.hour, value.minute]
        return [None, None]


class SelectTimeField(MultiValueField):
    widget = SelectTimeWidget

    def __init__(self, **kwargs):
        fields = (ChoiceField(choices=HOURS), ChoiceField(choices=MINUTES))
        super().__init__(fields=fields, require_all_fields=True, **kwargs)

    def compress(self, data_list):
        if data_list and data_list[0] not in (None, "") and data_list[1] not in (None, ""):
            return datetime.time(int(data_list[0]), int(data_list[1]))
        return None


@admin.action(description=_("علامت‌گذاری به عنوان رزروشده"))
def mark_booked(modeladmin, request, queryset):
    queryset.update(is_booked=True)


@admin.action(description=_("علامت‌گذاری به عنوان آزاد"))
def mark_available(modeladmin, request, queryset):
    queryset.update(is_booked=False)
    
    
class BlockTimeRangeForm(forms.Form):
    date = jDateField(label="تاریخ", widget=AdminjDateWidget)
    start_time = SelectTimeField(label="از ساعت")
    end_time = SelectTimeField(label="تا ساعت")
    slot_duration = forms.IntegerField(initial=30, label="مدت هر اسلات (دقیقه)")


@admin.register(BookingSlot)
class BookingSlotAdmin(admin.ModelAdmin):
    list_display = ["date", "start_time", "is_booked"]
    list_filter = ["date", "is_booked"]
    date_hierarchy = "date"
    list_editable = ["is_booked"]
    ordering = ["date", "start_time"]
    actions = [mark_booked, mark_available]
    change_list_template = "admin/booking/bookingslot/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "block-range/",
                self.admin_site.admin_view(self.block_range_view),
                name="bookingslot-block-range",
            ),
        ]
        return custom + urls

    def block_range_view(self, request):
        if request.method == "POST":
            form = BlockTimeRangeForm(request.POST)
            if form.is_valid():
                date = form.cleaned_data["date"]
                start = form.cleaned_data["start_time"]
                end = form.cleaned_data["end_time"]
                duration = form.cleaned_data["slot_duration"]

                current = datetime.datetime.combine(datetime.date.today(), start)
                end_dt = datetime.datetime.combine(datetime.date.today(), end)
                count = 0
                while current < end_dt:
                    slot, created = BookingSlot.objects.get_or_create(
                        date=date,
                        start_time=current.time(),
                        defaults={"is_booked": True},
                    )
                    if not created:
                        slot.is_booked = True
                        slot.save()
                    count += 1
                    current += datetime.timedelta(minutes=duration)

                messages.success(request, f"{count} اسلات مسدود شد.")
                return redirect("..")
        else:
            form = BlockTimeRangeForm()

        return render(
            request,
            "admin/booking/bookingslot/block_range.html",
            {"form": form},
        )

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
