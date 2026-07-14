from django.db import models
from django.utils.translation import gettext_lazy as _

from services.models import Service
from users.models import CustomUser


class BookingSlot(models.Model):
    date = models.DateField(_("تاریخ"))
    start_time = models.TimeField(_("ساعت شروع"))
    is_booked = models.BooleanField(_("رزرو شده"), default=False)

    class Meta:
        verbose_name = _("اسلات زمانی")
        verbose_name_plural = _("اسلات‌های زمانی")
        unique_together = ["date", "start_time"]
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.date} {self.start_time}"


class BypassCode(models.Model):
    code = models.CharField(_("کد"), max_length=50, unique=True)
    description = models.CharField(_("توضیحات"), max_length=200)
    is_active = models.BooleanField(_("فعال"), default=True)

    class Meta:
        verbose_name = _("کد عبور از پیش‌پرداخت")
        verbose_name_plural = _("کدهای عبور از پیش‌پرداخت")

    def __str__(self):
        return self.code


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", _("در انتظار")
        CONFIRMED = "Confirmed", _("تایید شده")
        CANCELLED = "Cancelled", _("لغو شده")

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="bookings", verbose_name=_("کاربر")
    )
    service = models.ForeignKey(
        Service, on_delete=models.PROTECT, related_name="bookings", verbose_name=_("خدمت")
    )
    slot = models.OneToOneField(
        BookingSlot, on_delete=models.PROTECT, related_name="booking", verbose_name=_("اسلات")
    )
    deposit_paid = models.BooleanField(_("پیش‌پرداخت شده"), default=False)
    bypass_code_used = models.ForeignKey(
        BypassCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings",
        verbose_name=_("کد عبور استفاده شده"),
    )
    status = models.CharField(
        _("وضعیت"), max_length=20, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(_("زمان ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("رزرو")
        verbose_name_plural = _("رزروها")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.slot}"
