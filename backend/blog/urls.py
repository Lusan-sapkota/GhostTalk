from django.urls import path
from . import views
from .views import (
    AllSaveView,
    post_list,
    PostDetailView,
    post_create,
    post_update,
    post_delete,
    SaveView,
    user_posts,
    LikeView,
    LikeCommentView,
    posts_of_following_profiles,
    AllLikeView,
)

urlpatterns = [
    path('', views.first, name='firsthome'),
    path('home/', post_list, name='blog-home'),
    path('feed/', posts_of_following_profiles, name='posts-follow-view'),
    path('post/user/<str:username>/', user_posts, name='user-posts'),
    path('post/<int:pk>/', PostDetailView, name='post-detail'),
    path('post/<int:pk>/update/', post_update, name='post-update'),
    path('post/<int:pk>/delete/', post_delete, name='post-delete'),
    path('post/new/', post_create, name='post-create'),
    path('post/like/', LikeView, name='post-like'),
    path('liked-posts/', AllLikeView, name='all-like'),
    path('post/save/', SaveView, name='post-save'),
    path('saved-posts/', AllSaveView, name='all-save'),
    path('post/comment/like/', LikeCommentView, name='comment-like'),
    path('about/', views.about, name='blog-about'),
    path('search/', views.search, name='search'),
]