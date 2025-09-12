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
import json

# Import token authentication decorator
from users.views import token_required


@token_required
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
@token_required
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
@token_required
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
                'id': c.id,
                'user': c.author.username,
                'message': c.text,
                'date': c.date.isoformat(),
                'status': c.status,
                'delivered_at': c.delivered_at.isoformat() if c.delivered_at else None,
                'read_at': c.read_at.isoformat() if c.read_at else None,
                'is_deleted': c.is_deleted,
            } for c in chats if not c.is_deleted
        ]
    })


@csrf_exempt
@token_required
@require_http_methods(["POST"])
def send_message(request, room_name):
    try:
        data = json.loads(request.body)
        message_text = data.get('message', '').strip()
        
        if not message_text:
            return JsonResponse({'error': 'Message cannot be empty'}, status=400)
        
        # Get the room
        room = Room.objects.get(room_id=room_name)
        
        # Determine who the friend is
        friend = room.friend if room.author == request.user else room.author
        
        # Create the chat message
        chat = Chat.objects.create(
            room_id=room,
            author=request.user,
            friend=friend,
            text=message_text
        )
        
        return JsonResponse({
            'id': chat.id,
            'user': chat.author.username,
            'message': chat.text,
            'date': chat.date.isoformat(),
            'status': chat.status,
            'delivered_at': chat.delivered_at.isoformat() if chat.delivered_at else None,
            'read_at': chat.read_at.isoformat() if chat.read_at else None,
            'is_deleted': chat.is_deleted,
        })
        
    except Room.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@token_required
@require_http_methods(["POST"])
def mark_messages_delivered(request, room_name):
    """Mark messages as delivered when recipient fetches them"""
    try:
        room = Room.objects.get(room_id=room_name)
        
        # Determine who the friend is (the recipient)
        friend = room.friend if room.author == request.user else room.author
        
        # Mark all undelivered messages from friend to current user as delivered
        undelivered_messages = Chat.objects.filter(
            room_id=room,
            author=friend,
            friend=request.user,
            status='sent',
            is_deleted=False
        )
        
        updated_count = 0
        for message in undelivered_messages:
            message.mark_as_delivered()
            updated_count += 1
        
        return JsonResponse({
            'success': True,
            'updated_count': updated_count
        })
        
    except Room.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@token_required
@require_http_methods(["POST"])
def mark_messages_read(request, room_name):
    """Mark messages as read when recipient views them"""
    try:
        room = Room.objects.get(room_id=room_name)
        
        # Determine who the friend is (the recipient)
        friend = room.friend if room.author == request.user else room.author
        
        # Mark all unread messages from friend to current user as read
        unread_messages = Chat.objects.filter(
            room_id=room,
            author=friend,
            friend=request.user,
            status__in=['sent', 'delivered'],
            is_deleted=False
        )
        
        updated_count = 0
        for message in unread_messages:
            message.mark_as_read()
            updated_count += 1
        
        return JsonResponse({
            'success': True,
            'updated_count': updated_count
        })
        
    except Room.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@token_required
@require_http_methods(["POST"])
def delete_message(request, message_id):
    """Delete a message (unsend for everyone or delete for self)"""
    try:
        data = json.loads(request.body)
        delete_type = data.get('delete_type', 'for_everyone')  # 'for_everyone' or 'for_me'
        
        message = Chat.objects.get(id=message_id, is_deleted=False)
        
        # Check if user can delete this message
        if message.author != request.user:
            return JsonResponse({'error': 'You can only delete your own messages'}, status=403)
        
        if delete_type == 'for_everyone':
            # Unsend for everyone (soft delete)
            message.delete_message(request.user)
            return JsonResponse({
                'success': True,
                'message': 'Message unsent for everyone'
            })
        elif delete_type == 'for_me':
            # This would require a separate table for per-user message visibility
            # For now, we'll implement it as unsend for everyone
            message.delete_message(request.user)
            return JsonResponse({
                'success': True,
                'message': 'Message deleted'
            })
        else:
            return JsonResponse({'error': 'Invalid delete type'}, status=400)
            
    except Chat.DoesNotExist:
        return JsonResponse({'error': 'Message not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
