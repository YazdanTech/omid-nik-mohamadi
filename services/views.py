from django.shortcuts import render  # <-- ADD THIS IMPORT
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .models import Service
from .serializers import ServiceSerializer


def home_page(request):
    services = Service.objects.filter(is_active=True)
    return render(request, 'index.html', {'services': services})

def grooming_page(request):
    grooming_services = Service.objects.filter(is_active=True) 
    return render(request, 'grooming.html', {'services': grooming_services})

class ServiceListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ServiceSerializer
    queryset = Service.objects.filter(is_active=True)