from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('me/', views.profile, name='profile'),
    path('all/', views.profile_list, name='profile-list-view'),
    path('follow/', views.follow_unfollow_profile, name='follow-unfollow-view'),
    path('<int:pk>/', views.profile_detail, name='profile-detail-view'),
    path('public-profile/<str:username>/', views.public_profile, name='public-profile'),
]