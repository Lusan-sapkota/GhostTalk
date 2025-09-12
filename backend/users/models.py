from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import random
import string

""" Model for User Profile """

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    show_online_status = models.BooleanField(default=True)  # Whether to show online status to others
    following = models.ManyToManyField('self', related_name="followers", blank=True, symmetrical=False)
    friends = models.ManyToManyField('self', related_name='my_friends', blank=True, symmetrical=False)
    bio = models.CharField(default="",blank=True,null=True,max_length=350)
    date_of_birth = models.CharField(blank=True,max_length=150)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='profile_pics', blank=True, null=True)
    complete_profile = models.BooleanField(default=False)

    def profile_posts(self):
        return self.user.post_set.all()

    def get_friends(self):
        return self.friends.all()

    def get_friends_no(self):
        return self.friends.all().count()

    def get_followers_no(self):
        return self.followers.all().count()

    def get_following_no(self):
        return self.following.all().count()

    def update_online_status(self, is_online=True):
        """Update online status and last seen timestamp"""
        self.is_online = is_online
        if is_online:
            self.last_seen = timezone.now()
        self.save()

    def get_online_status_display(self, viewer_profile=None):
        """
        Get online status display text for a specific viewer
        Returns None if user doesn't want to show online status
        """
        if not self.show_online_status:
            return None

        if self.is_online:
            return "Online"
        else:
            # Calculate time since last seen
            now = timezone.now()
            time_diff = now - self.last_seen

            if time_diff.days > 0:
                if time_diff.days == 1:
                    return "Last seen yesterday"
                elif time_diff.days < 7:
                    return f"Last seen {time_diff.days} days ago"
                else:
                    return f"Last seen {self.last_seen.strftime('%b %d')}"
            elif time_diff.seconds < 60:
                return "Last seen just now"
            elif time_diff.seconds < 3600:
                minutes = time_diff.seconds // 60
                return f"Last seen {minutes} minute{'s' if minutes != 1 else ''} ago"
            else:
                hours = time_diff.seconds // 3600
                return f"Last seen {hours} hour{'s' if hours != 1 else ''} ago"

    def __str__(self):
        return f'{self.user.username} Profile'


class PrivacySettings(models.Model):
    """User privacy settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    show_online_status = models.BooleanField(default=True, help_text="Show when you're online to other users")
    show_last_seen = models.BooleanField(default=True, help_text="Show when you were last seen")
    allow_messages_from = models.CharField(
        max_length=20,
        choices=[
            ('everyone', 'Everyone'),
            ('friends', 'Friends only'),
            ('none', 'No one')
        ],
        default='everyone',
        help_text="Who can send you messages"
    )
    allow_friend_requests = models.BooleanField(default=True, help_text="Allow others to send you friend requests")
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('friends', 'Friends only'),
            ('private', 'Private')
        ],
        default='public',
        help_text="Who can see your profile"
    )
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} Privacy Settings'


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

