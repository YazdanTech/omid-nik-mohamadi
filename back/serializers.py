from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import CustomUser, SMSVerification


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "phone_number", "birth_date", "email", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.username = validated_data["phone_number"]
        user.set_password(password)
        user.save()
        return user


class VerifyOTPSerializer(serializers.Serializer):
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
            raise serializers.ValidationError("کد تایید نامعتبر است")

        attrs["user"] = user
        attrs["verification"] = verification
        return attrs


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["phone_number"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("نام کاربری یا رمز عبور اشتباه است")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "phone_number", "email", "birth_date", "is_verified"]
