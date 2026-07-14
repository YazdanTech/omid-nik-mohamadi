from .models import Service

def booking_services(request):
    return {
        'global_normal_services': Service.objects.filter(is_active=True, category=Service.Category.NORMAL),
        'global_grooming_services': Service.objects.filter(is_active=True, category=Service.Category.GROOMING),
    }