from django.urls import path
from notification.views import ShowNotifications, MarkNotificationRead, MarkAllNotificationsRead

urlpatterns = [
    path('', ShowNotifications, name='show-notifications'),
    path('<int:notification_id>/read/', MarkNotificationRead, name='mark-notification-read'),
    path('mark-all-read/', MarkAllNotificationsRead, name='mark-all-notifications-read'),
]