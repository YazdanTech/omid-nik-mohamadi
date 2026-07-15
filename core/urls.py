from django.contrib import admin
from django.urls import include, path
from django.conf import settings

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("services.urls")),
    path("api/auth/", include("users.urls")),
    path("api/booking/", include("bookings.urls")),
    path("shop/", include("shop.urls")),
]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)