from django.shortcuts import redirect
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.models import User
from friend.models import FriendList, FriendRequest
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
from django.db.models import Q
import sys
import os

# Add the parent directory to the path to import from users app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from users.views import token_required
from users.models import Profile
from notification.models import Notification


@token_required
def friends_list_view(request, *args, **kwargs):
    user = request.user
    user_id = kwargs.get("user_id")
    
    if not user_id:
        return JsonResponse({'error': 'User ID required'}, status=400)
    
    try:
        this_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)
    
    try:
        friend_list = FriendList.objects.get(user=this_user)
    except FriendList.DoesNotExist:
        return JsonResponse({'error': f'Could not find a friends list for {this_user.username}'}, status=404)
    
    # Must be friends to view a friends list (unless it's your own)
    if user != this_user:
        if not user in friend_list.friends.all():
            return JsonResponse({'error': 'You must be friends to view their friends list'}, status=403)
    
    # Get friends with mutual status
    friends = []
    try:
        auth_user_friend_list = FriendList.objects.get(user=user)
        for friend in friend_list.friends.all():
            is_mutual = auth_user_friend_list.is_mutual_friend(friend)
            friends.append({
                'id': friend.id,
                'username': friend.username,
                'first_name': friend.first_name or '',
                'last_name': friend.last_name or '',
                'email': friend.email,
                'is_mutual': is_mutual
            })
    except FriendList.DoesNotExist:
        # If auth user has no friend list, just return friends without mutual status
        for friend in friend_list.friends.all():
            friends.append({
                'id': friend.id,
                'username': friend.username,
                'first_name': friend.first_name or '',
                'last_name': friend.last_name or '',
                'email': friend.email,
                'is_mutual': False
            })
    
    return JsonResponse({
        'this_user': {
            'id': this_user.id, 
            'username': this_user.username,
            'first_name': this_user.first_name or '',
            'last_name': this_user.last_name or ''
        },
        'friends': friends,
        'count': len(friends)
    })



@token_required
def friend_requests(request, *args, **kwargs):
    user = request.user
    user_id = kwargs.get("user_id")
    
    if not user_id:
        return JsonResponse({'error': 'User ID required'}, status=400)
    
    try:
        account = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)
    
    # Only allow users to view their own friend requests
    if account != user:
        return JsonResponse({'error': 'You can only view your own friend requests'}, status=403)
    
    friend_requests = FriendRequest.objects.filter(receiver=account, is_active=True)
    
    requests_data = []
    for fr in friend_requests:
        requests_data.append({
            'id': fr.id,
            'sender': {
                'id': fr.sender.id,
                'username': fr.sender.username,
                'first_name': fr.sender.first_name or '',
                'last_name': fr.sender.last_name or '',
                'email': fr.sender.email
            },
            'receiver': {
                'id': fr.receiver.id,
                'username': fr.receiver.username,
                'first_name': fr.receiver.first_name or '',
                'last_name': fr.receiver.last_name or ''
            },
            'created_at': fr.created_at.isoformat() if fr.created_at else None
        })
    
    return JsonResponse({
        'requests': requests_data,
        'count': len(requests_data)
    })



@csrf_exempt
@token_required
def send_friend_request(request, *args, **kwargs):
    user = request.user
    
    if request.method != "POST":
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    # Try to get receiver_user_id from POST data first, then from JSON body
    receiver_user_id = request.POST.get("receiver_user_id")
    if not receiver_user_id:
        try:
            import json
            data = json.loads(request.body)
            receiver_user_id = data.get("receiver_user_id")
        except:
            pass
    
    if not receiver_user_id:
        return JsonResponse({'error': 'receiver_user_id required'}, status=400)
    
    try:
        receiver = User.objects.get(pk=receiver_user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Receiver does not exist'}, status=404)
    
    if receiver == user:
        return JsonResponse({'error': 'Cannot send friend request to yourself'}, status=400)
    
    try:
        # Check if there's already an active friend request
        existing_requests = FriendRequest.objects.filter(
            sender=user, 
            receiver=receiver, 
            is_active=True
        )
        
        if existing_requests.exists():
            return JsonResponse({'error': 'Friend request already sent'}, status=400)
        
        # Check if they're already friends
        try:
            user_friend_list = FriendList.objects.get(user=user)
            if user_friend_list.is_mutual_friend(receiver):
                return JsonResponse({'error': 'Already friends'}, status=400)
        except FriendList.DoesNotExist:
            pass
        
        # Create the friend request
        friend_request = FriendRequest(sender=user, receiver=receiver)
        friend_request.save()
        
        # Create notification for the receiver
        notification = Notification.objects.create(
            sender=user,
            user=receiver,
            notification_type=7,  # Friend Request
            text_preview=f'{user.username} sent you a friend request',
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Friend request sent successfully',
            'request_id': friend_request.id
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@token_required
def friend_suggestions(request):
    """Get intelligent friend suggestions based on mutual friends, online status, and other criteria"""
    user = request.user

    try:
        # Get user's friend list
        user_friend_list = FriendList.objects.get(user=user)
        user_friends = set(user_friend_list.friends.all())

        # Dictionary to store potential suggestions with their scores
        suggestions_dict = {}

        # Find users who are friends with user's friends but not with the user
        for friend in user_friends:
            try:
                friend_friend_list = FriendList.objects.get(user=friend)
                friend_friends = friend_friend_list.friends.all()

                for potential_friend in friend_friends:
                    if (potential_friend != user and
                        potential_friend not in user_friends and
                        not FriendRequest.objects.filter(
                            sender=user,
                            receiver=potential_friend,
                            is_active=True
                        ).exists() and
                        not FriendRequest.objects.filter(
                            sender=potential_friend,
                            receiver=user,
                            is_active=True
                        ).exists()):

                        # Calculate mutual friends count
                        mutual_friends_count = 0
                        try:
                            potential_friend_list = FriendList.objects.get(user=potential_friend)
                            for mutual_friend in potential_friend_list.friends.all():
                                if mutual_friend in user_friends:
                                    mutual_friends_count += 1
                        except FriendList.DoesNotExist:
                            pass

                        # Initialize or update suggestion score
                        if potential_friend.id not in suggestions_dict:
                            suggestions_dict[potential_friend.id] = {
                                'user': potential_friend,
                                'mutual_friends_count': mutual_friends_count,
                                'score': 0
                            }

                        # Update mutual friends count if higher
                        if mutual_friends_count > suggestions_dict[potential_friend.id]['mutual_friends_count']:
                            suggestions_dict[potential_friend.id]['mutual_friends_count'] = mutual_friends_count

            except FriendList.DoesNotExist:
                continue

        # Calculate scores for each suggestion
        for suggestion_id, suggestion_data in suggestions_dict.items():
            score = 0

            # Base score from mutual friends (higher mutual friends = higher score)
            score += suggestion_data['mutual_friends_count'] * 10

            # Bonus for online status
            try:
                profile = Profile.objects.get(user=suggestion_data['user'])
                if profile.is_online:
                    score += 5  # Online users get priority

                # Bonus for profile completeness
                if profile.bio and profile.bio.strip():
                    score += 2
                if profile.image:
                    score += 2

                # Store profile data
                suggestion_data['profile'] = profile
                suggestion_data['is_online'] = profile.is_online
                suggestion_data['bio'] = profile.bio or ''
                suggestion_data['image'] = profile.image.url if profile.image else None

            except Profile.DoesNotExist:
                suggestion_data['profile'] = None
                suggestion_data['is_online'] = False
                suggestion_data['bio'] = ''
                suggestion_data['image'] = None

            # Add some randomization to avoid always showing same suggestions
            import random
            score += random.uniform(0, 3)

            suggestion_data['score'] = score

        # Sort by score (highest first) and take top 15
        sorted_suggestions = sorted(
            suggestions_dict.values(),
            key=lambda x: x['score'],
            reverse=True
        )[:15]

        # If we don't have enough suggestions, add some users with no mutual friends
        if len(sorted_suggestions) < 10:
            # Get all users except current user and their friends
            excluded_users = {user.id}
            excluded_users.update(friend.id for friend in user_friends)
            excluded_users.update(suggestion['user'].id for suggestion in sorted_suggestions)

            # Get users who haven't sent/received friend requests
            potential_new_users = User.objects.exclude(id__in=excluded_users)

            # Filter out users with active friend requests
            available_users = []
            for potential_user in potential_new_users:
                has_request = FriendRequest.objects.filter(
                    (Q(sender=user) & Q(receiver=potential_user)) |
                    (Q(sender=potential_user) & Q(receiver=user)),
                    is_active=True
                ).exists()

                if not has_request:
                    available_users.append(potential_user)

            # Add up to 5 more users with lower priority
            for new_user in available_users[:5]:
                try:
                    profile = Profile.objects.get(user=new_user)
                    sorted_suggestions.append({
                        'user': new_user,
                        'mutual_friends_count': 0,
                        'score': random.uniform(1, 3),  # Low score for new users
                        'profile': profile,
                        'is_online': profile.is_online,
                        'bio': profile.bio or '',
                        'image': profile.image.url if profile.image else None,
                    })
                except Profile.DoesNotExist:
                    sorted_suggestions.append({
                        'user': new_user,
                        'mutual_friends_count': 0,
                        'score': random.uniform(1, 3),
                        'profile': None,
                        'is_online': False,
                        'bio': '',
                        'image': None,
                    })

        # Sort again by score and take top 15
        sorted_suggestions = sorted(
            sorted_suggestions,
            key=lambda x: x['score'],
            reverse=True
        )[:15]

        # Format the response
        suggestions_data = []
        for suggestion in sorted_suggestions:
            user_obj = suggestion['user']
            suggestions_data.append({
                'id': user_obj.id,
                'username': user_obj.username,
                'first_name': user_obj.first_name or '',
                'last_name': user_obj.last_name or '',
                'email': user_obj.email or '',
                'is_online': suggestion.get('is_online', False),
                'bio': suggestion.get('bio', ''),
                'image': suggestion.get('image', None),
                'mutual_friends_count': suggestion.get('mutual_friends_count', 0),
                'score': round(suggestion.get('score', 0), 2)  # For debugging
            })

        return JsonResponse({
            'success': True,
            'suggestions': suggestions_data,
            'count': len(suggestions_data)
        })

    except FriendList.DoesNotExist:
        return JsonResponse({
            'success': True,
            'suggestions': [],
            'count': 0
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@token_required
def accept_friend_request(request, *args, **kwargs):
    user = request.user
    friend_request_id = kwargs.get("friend_request_id")
    
    if not friend_request_id:
        return JsonResponse({'error': 'Friend request ID required'}, status=400)
    
    try:
        friend_request = FriendRequest.objects.get(pk=friend_request_id)
    except FriendRequest.DoesNotExist:
        return JsonResponse({'error': 'Friend request does not exist'}, status=404)
    
    # Confirm that this is the correct request for this user
    if friend_request.receiver != user:
        return JsonResponse({'error': 'This is not your friend request to accept'}, status=403)
    
    if not friend_request.is_active:
        return JsonResponse({'error': 'Friend request is not active'}, status=400)
    
    try:
        friend_request.accept()
        return JsonResponse({
            'success': True,
            'message': 'Friend request accepted successfully'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@token_required
def remove_friend(request, *args, **kwargs):
    user = request.user
    
    if request.method != "POST":
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    # Try to get receiver_user_id from POST data first, then from JSON body
    user_id = request.POST.get("receiver_user_id")
    if not user_id:
        try:
            import json
            data = json.loads(request.body)
            user_id = data.get("receiver_user_id")
        except:
            pass
    
    if not user_id:
        return JsonResponse({'error': 'receiver_user_id required'}, status=400)
    
    try:
        removee = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)
    
    try:
        friend_list = FriendList.objects.get(user=user)
        friend_list.unfriend(removee)
        return JsonResponse({
            'success': True,
            'message': 'Friend removed successfully'
        })
    except FriendList.DoesNotExist:
        return JsonResponse({'error': 'Friend list not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@token_required
def decline_friend_request(request, *args, **kwargs):
    user = request.user
    friend_request_id = kwargs.get("friend_request_id")
    
    if not friend_request_id:
        return JsonResponse({'error': 'Friend request ID required'}, status=400)
    
    try:
        friend_request = FriendRequest.objects.get(pk=friend_request_id)
    except FriendRequest.DoesNotExist:
        return JsonResponse({'error': 'Friend request does not exist'}, status=404)
    
    # Confirm that this is the correct request for this user
    if friend_request.receiver != user:
        return JsonResponse({'error': 'This is not your friend request to decline'}, status=403)
    
    if not friend_request.is_active:
        return JsonResponse({'error': 'Friend request is not active'}, status=400)
    
    try:
        friend_request.decline()
        return JsonResponse({
            'success': True,
            'message': 'Friend request declined successfully'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)




@csrf_exempt
@token_required
def cancel_friend_request(request, *args, **kwargs):
    user = request.user
    
    if request.method != "POST":
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    # Try to get receiver_user_id from POST data first, then from JSON body
    user_id = request.POST.get("receiver_user_id")
    if not user_id:
        try:
            import json
            data = json.loads(request.body)
            user_id = data.get("receiver_user_id")
        except:
            pass
    
    if not user_id:
        return JsonResponse({'error': 'receiver_user_id required'}, status=400)
    
    try:
        receiver = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)
    
    try:
        friend_requests = FriendRequest.objects.filter(
            sender=user, 
            receiver=receiver, 
            is_active=True
        )
        
        if not friend_requests.exists():
            return JsonResponse({'error': 'No active friend request found'}, status=404)
        
        # Cancel all active friend requests (there should only be one, but just in case)
        cancelled_count = 0
        for friend_request in friend_requests:
            friend_request.cancel()
            cancelled_count += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Friend request cancelled successfully',
            'cancelled_count': cancelled_count
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)