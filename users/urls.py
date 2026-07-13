from django.urls import path

from .views import LoginView, LogoutView, SignUpView, VerifyOTPView

app_name = "users_api"

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
