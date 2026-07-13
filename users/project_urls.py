from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/services/", include("services.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/shop/", include("shop.urls")),
]
