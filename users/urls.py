from django.urls import path

from .views import (
    sign_in_page, sign_up_page,
    SignUpView, VerifyOTPView, 
    LoginRequestOTPView,  # 1. Changed import
    LogoutView
)

app_name = "users"

urlpatterns = [
    path('login/', sign_in_page, name='login-page'),
    path('register/', sign_up_page, name='register-page'),

    path("signup/", SignUpView.as_view(), name="signup"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("login-request-otp/", LoginRequestOTPView.as_view(), name="login-request-otp"),  # 2. Updated API endpoint
    path("logout/", LogoutView.as_view(), name="logout"),
] 