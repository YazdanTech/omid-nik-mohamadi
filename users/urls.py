from django.urls import path

from .views import (
    sign_in_page, sign_up_page,
    SignUpView, VerifyOTPView, 
    LoginView, LogoutView
)

app_name = "users_api"

urlpatterns = [
    path('login/', sign_in_page, name='login-page'),
    path('register/', sign_up_page, name='register-page'),

    path("api/signup/", SignUpView.as_view(), name="signup"),
    path("api/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/logout/", LogoutView.as_view(), name="logout"),
]
