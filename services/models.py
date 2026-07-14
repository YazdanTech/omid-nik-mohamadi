from django.db import models
from django.utils.translation import gettext_lazy as _


class Service(models.Model):
    # Choice subclass to restrict the types of service categories
    class Category(models.TextChoices):
        NORMAL = 'normal', _('عادی')
        GROOMING = 'grooming', _('داماد')

    title = models.CharField(_("عنوان"), max_length=200)
    
    # New category classification field
    category = models.CharField(
        _("دسته‌بندی"),
        max_length=20,
        choices=Category.choices,
        default=Category.NORMAL,
        db_index=True  # Added index to make filtering by category highly performant
    )
    
    price = models.IntegerField(_("قیمت"))
    duration_minutes = models.PositiveIntegerField(_("مدت زمان (دقیقه)"))
    is_active = models.BooleanField(_("فعال"), default=True)

    class Meta:
        verbose_name = _("خدمت")
        verbose_name_plural = _("خدمات")

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"