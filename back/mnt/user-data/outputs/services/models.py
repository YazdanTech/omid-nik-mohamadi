from django.db import models
from django.utils.translation import gettext_lazy as _


class Service(models.Model):
    title = models.CharField(_("عنوان"), max_length=200)
    price = models.DecimalField(_("قیمت"), max_digits=10, decimal_places=2)
    duration_minutes = models.PositiveIntegerField(_("مدت زمان (دقیقه)"))
    is_active = models.BooleanField(_("فعال"), default=True)

    class Meta:
        verbose_name = _("خدمت")
        verbose_name_plural = _("خدمات")

    def __str__(self):
        return self.title
