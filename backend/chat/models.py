from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

# Create your models here.

class Room(models.Model):
    # room_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_id = models.AutoField(primary_key=True)
    author = models.ForeignKey(User, related_name='author_room', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friend_room', on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.room_id}-{self.author}-{self.friend}"


class Chat(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
    ]
    
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='chats')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='author_msg')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_msg')
    text = models.CharField(max_length=300)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='deleted_messages')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return '%s - %s' %(self.id, self.date)

    def mark_as_delivered(self):
        """Mark message as delivered"""
        if self.status == 'sent':
            self.status = 'delivered'
            self.delivered_at = timezone.now()
            self.save()

    def mark_as_read(self):
        """Mark message as read"""
        if self.status in ['sent', 'delivered']:
            self.status = 'read'
            self.read_at = timezone.now()
            self.save()

    def delete_message(self, deleted_by_user):
        """Soft delete the message"""
        self.is_deleted = True
        self.deleted_by = deleted_by_user
        self.deleted_at = timezone.now()
        self.save()


