from django.contrib.auth.models import AbstractUser, UserManager, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_jalali.db import models as jmodels

class CustomUserManager(jmodels.jManager, BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError(_("شماره موبایل الزامی است."))
        
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        # Set username to phone_number to satisfy AbstractUser's underlying field
        user = self.model(phone_number=phone_number, username=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(phone_number, password, **extra_fields)


class CustomUser(AbstractUser):
    objects = CustomUserManager()

    full_name = models.CharField(_("نام کامل"), max_length=150)
    phone_number = models.CharField(_("شماره موبایل"), max_length=15, unique=True)
    birth_date = jmodels.jDateField(_("تاریخ تولد"), null=True, blank=True)
    email = models.EmailField(_("ایمیل"), null=True, blank=True)
    is_verified = models.BooleanField(_("تایید شده"), default=False)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = []

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
    created_at = models.DateTimeField(_("زمان ایجاد"), auto_now_add=True, db_index=True)  # Standard system timestamp
    is_used = models.BooleanField(_("استفاده شده"), default=False, db_index=True)

    class Meta:
        verbose_name = _("کد تایید پیامکی")
        verbose_name_plural = _("کدهای تایید پیامکی")

    def __str__(self):
        return f"{self.user} - {self.code}"