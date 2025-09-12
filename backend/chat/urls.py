from django.urls import path
from . import views

urlpatterns = [
    path('', views.room_enroll, name='room-enroll'),
    path('chat/<int:friend_id>', views.room_choice, name='room-choice'),
    path('room/<int:room_name>-<int:friend_id>', views.room, name='room'),
    path('send/<int:room_name>', views.send_message, name='send-message'),
    path('mark-delivered/<int:room_name>', views.mark_messages_delivered, name='mark-delivered'),
    path('mark-read/<int:room_name>', views.mark_messages_read, name='mark-read'),
    path('delete-message/<int:message_id>', views.delete_message, name='delete-message'),
]