from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.custom_login, name='custom-login'),
    path('logout/', views.custom_logout, name='custom-logout'),
    path('refresh-token/', views.refresh_token, name='refresh-token'),
    path('register/', views.register, name='register'),
    path('verify-otp/', views.verify_otp, name='verify-otp'),
    path('setup-profile/', views.setup_profile, name='setup-profile'),
    path('check-username/', views.check_username, name='check-username'),
    path('request-password-reset/', views.request_password_reset, name='request-password-reset'),
    path('verify-password-reset-otp/', views.verify_password_reset_otp, name='verify-password-reset-otp'),
    path('reset-password/', views.reset_password, name='reset-password'),
    path('me/', views.profile, name='profile'),
    path('all/', views.profile_list, name='profile-list-view'),
    path('search/', views.search_users, name='search-users'),
    path('follow/', views.follow_unfollow_profile, name='follow-unfollow-view'),
    path('followers/<int:user_id>/', views.get_followers, name='get-followers'),
    path('<int:pk>/', views.profile_detail, name='profile-detail-view'),
    path('public-profile/<str:username>/', views.public_profile, name='public-profile'),
]