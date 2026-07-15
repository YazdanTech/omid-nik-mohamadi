from rest_framework import serializers
from .models import CustomUser, SMSVerification


class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Excluded password entirely
        fields = ["id", "full_name", "phone_number", "birth_date", "email"]

    def create(self, validated_data):
        user = CustomUser(**validated_data)
        user.username = validated_data["phone_number"]
        user.set_unusable_password()  # Tells Django this user has no password set
        user.save()
        return user


class RequestOTPLoginSerializer(serializers.Serializer):
    """
    Validates the phone number to trigger the OTP SMS during login.
    """
    phone_number = serializers.CharField()

    def validate(self, attrs):
        try:
            user = CustomUser.objects.get(phone_number=attrs["phone_number"])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("کاربر با این شماره تلفن یافت نشد")
        attrs["user"] = user
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    """
    Used for both Registration and Login completion.
    """
    phone_number = serializers.CharField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = CustomUser.objects.get(phone_number=attrs["phone_number"])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("کاربر یافت نشد")

        verification = (
            SMSVerification.objects.filter(user=user, code=attrs["code"], is_used=False)
            .order_by("-created_at")
            .first()
        )
        if not verification:
            raise serializers.ValidationError("کد تایید نامعتبر یا منقضی شده است")

        attrs["user"] = user
        attrs["verification"] = verification
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "phone_number", "email", "birth_date", "is_verified"]