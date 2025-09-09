from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Room, Chat
from django.db.models import Q
from friend.models import FriendList
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@login_required
@require_http_methods(["GET"])
def room_enroll(request):
    friends = FriendList.objects.filter(user=request.user)[0].friends.all()
    all_rooms = Room.objects.filter(
        Q(author=request.user) | Q(friend=request.user)
    ).order_by('-created')

    return JsonResponse({
        'all_rooms': [
            {
                'room_id': r.room_id,
                'author_id': r.author_id,
                'friend_id': r.friend_id,
                'created': r.created.isoformat(),
            } for r in all_rooms
        ],
        'all_friends': [
            {
                'id': f.id,
                'username': f.username,
            } for f in friends
        ]
    })



@csrf_exempt
@login_required
@require_http_methods(["POST"])
def room_choice(request, friend_id):
    friend = User.objects.filter(pk=friend_id)
    if not friend:
        messages.error(request, 'Invalid User ID')
        return redirect('room-enroll') 
    if not FriendList.objects.filter(user=request.user, friends=friend[0]):
        messages.error(request, 'You need to be friends to chat')
        return redirect('room-enroll') 

    room = Room.objects.filter(
        Q(author=request.user, friend=friend[0]) | Q(author=friend[0], friend=request.user)
    )
    if not room:
        create_room = Room(author=request.user, friend=friend[0])
        create_room.save()
        room = create_room.room_id
        return redirect('room', room, friend_id)

    return JsonResponse({'room_id': room[0].room_id, 'friend_id': friend_id})


""" Chatroom between users """
@login_required
@require_http_methods(["GET"])
def room(request, room_name, friend_id):
    all_rooms = Room.objects.filter(room_id=room_name)
    if not all_rooms:  
        messages.error(request, 'Invalid Room ID')
        return redirect('room-enroll')

    chats = Chat.objects.filter(
        room_id=room_name
    ).order_by('date')

    return JsonResponse({
        'room_name': room_name,
        'friend': {'id': friend_id, 'username': User.objects.get(pk=friend_id).username},
        'me': {'id': request.user.id, 'username': request.user.username},
        'old_chats': [
            {
                'user': c.user.username,
                'message': c.message,
                'date': c.date.isoformat(),
            } for c in chats
        ]
    })
