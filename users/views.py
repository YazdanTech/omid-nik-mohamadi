import random
from .serializers import RequestOTPLoginSerializer
from .utils import send_otp_sms  # Wherever you put your Kavenegar logic
from .models import SMSVerification

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    SignUpSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)



def sign_in_page(request):
    if request.user.is_authenticated:
        return redirect('services:home')
    return render(request, 'sign-in.html')

def sign_up_page(request):
    if request.user.is_authenticated:
        return redirect('services:home')
    return render(request, 'sign-up.html')

class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate, save, and dispatch OTP via Kavenegar
        code = str(random.randint(100000, 999999))
        SMSVerification.objects.create(user=user, code=code)
        send_otp_sms(user.phone_number, code)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        verification = serializer.validated_data["verification"]

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        user.is_verified = True
        user.save(update_fields=["is_verified"])

        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class LoginRequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPLoginSerializer(data=request.data)
        if not serializer.is_valid():
            # This prints the exact validation error in your terminal
            print("❌ Serializer Validation Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        user = serializer.validated_data["user"]

        # Generate, save, and dispatch OTP via Kavenegar
        code = str(random.randint(100000, 999999))
        SMSVerification.objects.create(user=user, code=code)
        print(f'\n\n\n\n{code}\n\n\n\n')
        send_otp_sms(user.phone_number, code)

        return Response({"detail": "کد تایید ارسال شد"}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
