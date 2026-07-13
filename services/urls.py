from django.urls import path

from .views import ServiceListView, home_page, grooming_page

app_name = "services_api"

urlpatterns = [
    path('', home_page, name='home'),
    path('grooming/', grooming_page, name='grooming'),
    path("api/list/", ServiceListView.as_view(), name="service-list"),
]
