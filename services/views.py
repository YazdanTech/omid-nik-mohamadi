from django.shortcuts import render  # <-- ADD THIS IMPORT
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .models import Service
from .serializers import ServiceSerializer

# services/views.py
def home_page(request):
    return render(request, 'index.html') 

def grooming_page(request):
    return render(request, 'grooming.html')

class ServiceListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ServiceSerializer
    queryset = Service.objects.filter(is_active=True)