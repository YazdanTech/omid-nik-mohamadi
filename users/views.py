from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    LoginSerializer,
    SignUpSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)



def sign_in_page(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'sign-in.html')

def sign_up_page(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'sign-up.html')

class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
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


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
