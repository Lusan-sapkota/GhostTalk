from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from notification.models import Notification
from users.views import token_required

# Create your views here.

""" All notifications """
@token_required
def ShowNotifications(request):
    user = request.user
    notifications = Notification.objects.filter(user=user).order_by('-date')
    return JsonResponse({
        'notifications': [
            {
                'id': n.id,
                'sender': n.sender.username if n.sender else None,
                'notification_type': n.notification_type,
                'text_preview': n.text_preview,
                'date': n.date.isoformat(),
                'post_id': n.post_id,
            } for n in notifications
        ]
    })