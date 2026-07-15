from django.urls import path

from .views import ServiceListView, home_page, grooming_page

app_name = "services"

urlpatterns = [
    path('', home_page, name='home'),
    path('services/grooming/', grooming_page, name='grooming'),
    path("services/api/list/", ServiceListView.as_view(), name="service-list"),
]
