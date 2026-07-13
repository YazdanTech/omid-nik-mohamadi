from django.urls import path

from .views import ServiceListView

app_name = "services_api"

urlpatterns = [
    path("", ServiceListView.as_view(), name="service-list"),
]
