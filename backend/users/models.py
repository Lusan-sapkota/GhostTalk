from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import random
import string

""" Model for User Profile """

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_online = models.BooleanField(default=False)
    following = models.ManyToManyField('self', related_name="followers", blank=True, symmetrical=False)
    friends = models.ManyToManyField('self', related_name='my_friends', blank=True, symmetrical=False)
    bio = models.CharField(default="",blank=True,null=True,max_length=350)
    date_of_birth = models.CharField(blank=True,max_length=150)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='profile_pics', blank=True, null=True)

    def profile_posts(self):
        return self.user.post_set.all()

    def get_friends(self):
        return self.friends.all()

    def get_friends_no(self):
        return self.friends.all().count()

    def __str__(self):
        return f'{self.user.username} Profile'



STATUS_CHOICES = (
    ('send','send'),
    ('accepted','accepted')
)

class Relationship(models.Model):
    from_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='friend_sender')
    to_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='friend_receiver')
    status = models.CharField(max_length=8, choices=STATUS_CHOICES)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_profile', 'to_profile')

    def __str__(self):
        return f"{self.from_profile}-{self.to_profile}-{self.status}"


class OTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now)
    is_verified = models.BooleanField(default=False)

    def generate_otp(self):
        """Generate a 6-digit OTP"""
        self.otp_code = ''.join(random.choices(string.digits, k=6))
        self.expires_at = timezone.now() + timezone.timedelta(minutes=10)  # OTP expires in 10 minutes
        self.save()
        return self.otp_code

    def is_expired(self):
        """Check if OTP is expired"""
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.email}"

