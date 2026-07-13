from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, SMSVerification


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ["phone_number", "full_name", "email", "is_verified", "is_active", "date_joined"]
    list_filter = ["is_verified", "is_active", "is_staff"]
    search_fields = ["phone_number", "full_name", "email"]
    ordering = ["-date_joined"]
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("اطلاعات شخصی", {"fields": ("full_name", "phone_number", "birth_date", "email")}),
        ("دسترسی‌ها", {"fields": ("is_active", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("تاریخ‌ها", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "phone_number", "full_name", "password1", "password2"),
        }),
    )


@admin.register(SMSVerification)
class SMSVerificationAdmin(admin.ModelAdmin):
    list_display = ["user", "code", "created_at", "is_used"]
    list_filter = ["is_used", "created_at"]
    search_fields = ["user__phone_number", "code"]
