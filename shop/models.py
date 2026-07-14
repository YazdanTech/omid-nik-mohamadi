from django.db import models
from django.utils.translation import gettext_lazy as _

from users.models import CustomUser


class Product(models.Model):
    title = models.CharField(_("عنوان"), max_length=200)
    description = models.TextField(_("توضیحات"))
    price = models.IntegerField(_("قیمت"))
    stock = models.PositiveIntegerField(_("موجودی"))
    image = models.ImageField(_("تصویر"), upload_to="products/")

    class Meta:
        verbose_name = _("محصول")
        verbose_name_plural = _("محصولات")

    def __str__(self):
        return self.title


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", _("در انتظار")
        PAID = "Paid", _("پرداخت شده")
        DELIVERED = "Delivered", _("تحویل داده شده")
        CANCELLED = "Cancelled", _("لغو شده")

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="orders", verbose_name=_("کاربر")
    )
    total_amount = models.DecimalField(_("مبلغ کل"), max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(_("زمان ایجاد"), auto_now_add=True)
    is_paid = models.BooleanField(_("پرداخت شده"), default=False)
    status = models.CharField(
        _("وضعیت"), max_length=20, choices=Status.choices, default=Status.PENDING
    )
    shipping_name = models.CharField(_("نام گیرنده"), max_length=150)
    shipping_phone = models.CharField(_("شماره تماس گیرنده"), max_length=15)
    shipping_address = models.TextField(_("آدرس"))

    class Meta:
        verbose_name = _("سفارش")
        verbose_name_plural = _("سفارش‌ها")
        ordering = ["-created_at"]

    def __str__(self):
        return f"سفارش #{self.id} - {self.user}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name=_("سفارش")
    )
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="order_items", verbose_name=_("محصول")
    )
    quantity = models.PositiveIntegerField(_("تعداد"), default=1)
    price_at_purchase = models.DecimalField(_("قیمت زمان خرید"), max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("آیتم سفارش")
        verbose_name_plural = _("آیتم‌های سفارش")

    def __str__(self):
        return f"{self.product} x{self.quantity}"
