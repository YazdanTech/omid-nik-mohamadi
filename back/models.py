from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    full_name = models.CharField(_("نام کامل"), max_length=150)
    phone_number = models.CharField(_("شماره موبایل"), max_length=15, unique=True)
    birth_date = models.DateField(_("تاریخ تولد"), null=True, blank=True)
    email = models.EmailField(_("ایمیل"), null=True, blank=True)
    is_verified = models.BooleanField(_("تایید شده"), default=False)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = _("کاربر")
        verbose_name_plural = _("کاربران")

    def __str__(self):
        return self.full_name or self.phone_number


class SMSVerification(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="sms_verifications",
        verbose_name=_("کاربر"),
    )
    code = models.CharField(_("کد"), max_length=6)
    created_at = models.DateTimeField(_("زمان ایجاد"), auto_now_add=True)
    is_used = models.BooleanField(_("استفاده شده"), default=False)

    class Meta:
        verbose_name = _("کد تایید پیامکی")
        verbose_name_plural = _("کدهای تایید پیامکی")

    def __str__(self):
        return f"{self.user} - {self.code}"
