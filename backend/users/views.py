from friend.models import FriendList, FriendRequest
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from .models import Profile
from django.contrib.auth.models import User
from django.dispatch import receiver 
from django.contrib.auth.signals import user_logged_in, user_logged_out
from notification.models import Notification
import requests
from django.conf import settings
from friend.utils import get_friend_request_or_false
from friend.friend_request_status import FriendRequestStatus
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@receiver(user_logged_in)
def got_online(sender, user, request, **kwargs):    
    user.profile.is_online = True
    user.profile.save()

@receiver(user_logged_out)
def got_offline(sender, user, request, **kwargs):   
    user.profile.is_online = False
    user.profile.save()



""" Following and Unfollowing users """
@csrf_exempt
@login_required
@require_http_methods(["POST"])
def follow_unfollow_profile(request):
    if request.method == 'POST':
        my_profile = Profile.objects.get(user = request.user)
        pk = request.POST.get('profile_pk')
        obj = Profile.objects.get(pk=pk)

        if obj.user in my_profile.following.all():
            my_profile.following.remove(obj.user)
            notify = Notification.objects.filter(sender=request.user, notification_type=2)
            notify.delete()
        else:
            my_profile.following.add(obj.user)
            notify = Notification(sender=request.user, user=obj.user, notification_type=2)
            notify.save()
        return JsonResponse({'following': obj.user.username, 'now_following': obj.user in my_profile.following.all()})
    return JsonResponse({'error': 'invalid method'}, status=405)


""" User account creation """
@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            # reCAPTCHA V2 - DISABLED
            # recaptcha_response = request.POST.get('g-recaptcha-response')
            # data = {
            #     'secret': settings.GOOGLE_RECAPTCHA_SECRET_KEY,
            #     'response': recaptcha_response
            # }
            # r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
            # result = r.json()

            # if result['success']:
                form.save()
                username = form.cleaned_data.get('username')
                return JsonResponse({'status': 'created', 'username': username}, status=201)
            # else:
            #     messages.error(request, 'Invalid reCAPTCHA. Please try again.')            
            
    return JsonResponse({'error': 'invalid data'}, status=400)


""" User profile """
@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def profile(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)

        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            return JsonResponse({'status': 'updated'})
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)
    
    # GET or invalid POST -> return current profile info
    p = request.user.profile
    return JsonResponse({
        'user': {'id': request.user.id, 'username': request.user.username, 'email': request.user.email},
        'profile': {
            'id': p.id,
            'image': p.image.url if p.image else None,
            'bio': getattr(p, 'bio', ''),
            'is_online': getattr(p, 'is_online', False),
        }
    })


""" Creating a public profile view """
@require_http_methods(["GET"])
def public_profile(request, username):
    user = User.objects.get(username=username)
    return JsonResponse({'user': {'id': user.id, 'username': user.username}})


""" All user profiles """
@login_required
@require_http_methods(["GET"])
def profile_list(request):
    profiles = Profile.objects.all().exclude(user=request.user)
    return JsonResponse({'profiles': [
        {
            'id': p.id,
            'user': {'id': p.user.id, 'username': p.user.username},
            'is_online': getattr(p, 'is_online', False)
        } for p in profiles
    ]})

""" User profile details view """
@login_required
@require_http_methods(["GET"])
def profile_detail(request, pk):
    view_profile = Profile.objects.get(pk=pk)
    my_profile = Profile.objects.get(user=request.user)
    follow = view_profile.user in my_profile.following.all()

    account = view_profile.user
    try:
        friend_list = FriendList.objects.get(user=account)
    except FriendList.DoesNotExist:
        friend_list = FriendList(user=account)
        friend_list.save()
    friends = friend_list.friends.all()

    is_self = request.user == account
    is_friend = bool(friends.filter(pk=request.user.id))
    request_sent = FriendRequestStatus.NO_REQUEST_SENT.value
    pending_friend_request_id = None
    if request.user.is_authenticated and request.user != account:
        if get_friend_request_or_false(sender=account, receiver=request.user) != False:
            request_sent = FriendRequestStatus.THEM_SENT_TO_YOU.value
            pending_friend_request_id = get_friend_request_or_false(sender=account, receiver=request.user).pk
        elif get_friend_request_or_false(sender=request.user, receiver=account) != False:
            request_sent = FriendRequestStatus.YOU_SENT_TO_THEM.value

    friend_requests = None
    if request.user.is_authenticated and is_self:
        try:
            friend_requests = FriendRequest.objects.filter(receiver=request.user, is_active=True)
        except:
            pass

    return JsonResponse({
        'profile': {
            'id': view_profile.id,
            'user': {'id': account.id, 'username': account.username},
            'follow': follow,
        },
        'friends': [{'id': f.id, 'username': f.username} for f in friends],
        'is_self': is_self,
        'is_friend': is_friend,
        'request_sent': request_sent,
        'pending_friend_request_id': pending_friend_request_id,
        'friend_requests': [
            {'id': fr.id, 'sender': fr.sender.username, 'receiver': fr.receiver.username}
            for fr in friend_requests
        ] if friend_requests is not None else []
    })

