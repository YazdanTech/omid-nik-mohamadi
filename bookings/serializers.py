from rest_framework import serializers

from services.models import Service

from .models import Booking, BypassCode


class CreateBookingSerializer(serializers.Serializer):
    service_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )
    date = serializers.DateField()
    start_time = serializers.TimeField()
    bypass_code = serializers.CharField(required=False, allow_blank=True)

def validate_service_ids(self, value):
    existing_count = Service.objects.filter(id__in=value, is_active=True).count()
    if existing_count != len(set(value)):
        raise serializers.ValidationError("یک یا چند خدمت یافت نشد یا غیرفعال است")
    return value

    def validate(self, attrs):
        bypass_code = attrs.get("bypass_code")
        if bypass_code:
            code = BypassCode.objects.filter(code=bypass_code, is_active=True).first()
            if not code:
                raise serializers.ValidationError("کد عبور نامعتبر است")
            attrs["bypass_code_obj"] = code
        return attrs


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "services", "slot", "deposit_paid", "status", "created_at"]
