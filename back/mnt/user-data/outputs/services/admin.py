from django.contrib import admin

from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "price", "duration_minutes", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title"]
    list_editable = ["price", "is_active"]
