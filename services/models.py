from django.db import models
from django.utils.translation import gettext_lazy as _


class Service(models.Model):
    # Choice subclass to restrict the types of service categories
    class Category(models.TextChoices):
        NORMAL = 'normal', _('عادی')
        GROOMING = 'grooming', _('داماد')

    title = models.CharField(_("عنوان"), max_length=200)
    
    category = models.CharField(
        _("دسته‌بندی"),
        max_length=20,
        choices=Category.choices,
        default=Category.NORMAL,
        db_index=True
    )
    
    price = models.DecimalField(_("قیمت"), max_digits=10, decimal_places=2)
    duration_minutes = models.PositiveIntegerField(_("مدت زمان (دقیقه)"))
    is_active = models.BooleanField(_("فعال"), default=True)

    # Added Visual Display Fields
    description = models.TextField(
        _("توضیحات کوتاه"), 
        blank=True, 
        null=True,
        help_text=_("یک جمله کوتاه برای کارت خدمت.")
    )
    features = models.CharField(
        _("ویژگی‌ها (با کاما جدا کنید)"), 
        max_length=500, 
        blank=True, 
        null=True,
        help_text=_("مثال: کاشت دقیق, خط‌کشی ریش, پایان‌کاری حوله‌ی گرم")
    )
    
    # New Image Field
    image = models.ImageField(
        _("تصویر"),
        upload_to="services/",
        blank=True,
        null=True,
        help_text=_("تصویر پس‌زمینه کارت خدمت. در صورت عدم انتخاب، از تصویر پیش‌فرض استفاده می‌شود.")
    )

    class Meta:
        verbose_name = _("خدمت")
        verbose_name_plural = _("خدمات")

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"