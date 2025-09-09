"""myproject URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token



urlpatterns = [
    path('admin/', admin.site.urls),
    # Note: template-based auth views removed for API-only backend
    path('accounts/', include('allauth.urls')),
    
    path('', include('blog.urls')),
    path('user/', include('users.urls')),
    path('notifications/', include('notification.urls')),
    path('chats/', include('chat.urls')),
    path('vc/', include('videocall.urls')),
    path('friend/', include('friend.urls', namespace='friend')),
    path('api/auth/token/', obtain_auth_token, name='api-token'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

