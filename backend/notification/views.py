from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from notification.models import Notification
from users.views import token_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

# Create your views here.

""" All notifications """
@token_required
def ShowNotifications(request):
    user = request.user
    notifications = Notification.objects.filter(user=user).order_by('-date')

    notification_data = []
    for n in notifications:
        data = {
            'id': n.id,
            'sender': n.sender.username if n.sender else None,
            'sender_id': n.sender.id if n.sender else None,
            'sender_first_name': n.sender.first_name if n.sender else None,
            'sender_last_name': n.sender.last_name if n.sender else None,
            'notification_type': n.notification_type,
            'text_preview': n.text_preview,
            'date': n.date.isoformat(),
            'post_id': n.post_id,
            'is_seen': n.is_seen,
        }
        notification_data.append(data)

    return JsonResponse({
        'notifications': notification_data
    })

""" Mark notification as read """
@csrf_exempt
@token_required
def MarkNotificationRead(request, notification_id):
    if request.method == 'POST':
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_seen = True
            notification.save()
            return JsonResponse({'success': True, 'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Notification not found'}, status=404)
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

""" Mark all notifications as read """
@csrf_exempt
@token_required
def MarkAllNotificationsRead(request):
    if request.method == 'POST':
        Notification.objects.filter(user=request.user, is_seen=False).update(is_seen=True)
        return JsonResponse({'success': True, 'message': 'All notifications marked as read'})
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)