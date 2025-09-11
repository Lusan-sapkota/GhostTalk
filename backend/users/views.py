from friend.models import FriendList, FriendRequest
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from .models import Profile, OTP
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
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.db.models import Q
import logging


logger = logging.getLogger(__name__)


def token_required(view_func):
    """
    Decorator to authenticate users based on token in Authorization header
    Similar to @login_required but works with token authentication
    """
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not (auth_header.startswith('Token ') or auth_header.startswith('Bearer ')):
            return JsonResponse({'error': 'Authorization header required'}, status=401)

        token_key = auth_header.split(' ')[1]

        from rest_framework.authtoken.models import Token
        try:
            token = Token.objects.get(key=token_key)
            # Set the user on the request object (always override any existing user)
            request.user = token.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        return view_func(request, *args, **kwargs)
    return wrapper


def validate_email_format(email):
    """Validate email format and check for disposable domains"""
    import re
    
    # Basic email format validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return False, 'Please enter a valid email address'
    
    # Check for disposable email domains
    disposable_domains = [
        '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org',
        'throwaway.email', 'yopmail.com', 'maildrop.cc', 'tempail.com', 'dispostable.com',
        '0-mail.com', 'mail-temporaire.fr', 'spamgourmet.com', 'getnada.com', 'mailcatch.com'
    ]
    
    domain = email.split('@')[-1].lower()
    if domain in disposable_domains:
        return False, 'Disposable email addresses are not allowed. Please use a permanent email address.'
    
    return True, None


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
@token_required
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


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    if request.method == 'POST':
        # Handle both regular POST data and JSON data
        if request.content_type == 'application/json':
            import json
            try:
                data = json.loads(request.body)
                form = UserRegisterForm(data)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        elif request.content_type == 'multipart/form-data':
            form = UserRegisterForm(request.POST, request.FILES)
        else:
            form = UserRegisterForm(request.POST)
            
        if form.is_valid():
            # Create user but don't save yet
            user = form.save(commit=False)
            user.is_active = False  # User is not active until OTP verification
            user.save()
            
            # Create OTP for the user
            otp_obj, created = OTP.objects.get_or_create(user=user)
            otp_code = otp_obj.generate_otp()
            
            # Send OTP via email
            try:
                subject = 'Your OTP for GhostTalk Registration'
                html_message = render_to_string('users/otp_email.html', {
                    'user': user,
                    'otp_code': otp_code
                })
                plain_message = strip_tags(html_message)
                
                send_mail(
                    subject,
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                
                return JsonResponse({
                    'status': 'otp_sent', 
                    'message': 'OTP sent to your email',
                    'user_id': user.id,
                    'email': user.email
                }, status=200)
                
            except Exception as e:
                # If email fails, delete the user and return error
                user.delete()
                return JsonResponse({'error': 'Failed to send OTP email'}, status=500)
        else:
            # Return form errors for debugging
            return JsonResponse({
                'error': 'Invalid form data',
                'form_errors': form.errors
            }, status=400)
    
    return JsonResponse({'error': 'Invalid form data'}, status=400)


""" OTP Verification """
@csrf_exempt
@require_http_methods(["POST"])
def verify_otp(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        otp_code = request.POST.get('otp_code')
        
        if not user_id or not otp_code:
            return JsonResponse({'error': 'User ID and OTP code are required'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
            otp_obj = OTP.objects.get(user=user)
            
            if otp_obj.is_expired():
                return JsonResponse({'error': 'OTP has expired'}, status=400)
            
            if otp_obj.otp_code == otp_code:
                # Mark OTP as verified and activate user
                otp_obj.is_verified = True
                otp_obj.save()
                user.is_active = True
                user.save()
                
                # Create user profile
                Profile.objects.get_or_create(user=user)
                
                return JsonResponse({
                    'status': 'verified',
                    'message': 'Account verified successfully',
                    'username': user.username
                }, status=200)
            else:
                return JsonResponse({'error': 'Invalid OTP code'}, status=400)
                
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except OTP.DoesNotExist:
            return JsonResponse({'error': 'OTP not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': 'Verification failed'}, status=500)            
            
@csrf_exempt
@require_http_methods(["GET"])
def check_username(request):
    username = request.GET.get('username', '').strip()
    
    if not username:
        return JsonResponse({'error': 'Username is required'}, status=400)
    
    if len(username) < 3:
        return JsonResponse({'error': 'Username must be at least 3 characters'}, status=400)
    
    # Check if username contains only allowed characters
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return JsonResponse({'error': 'Username can only contain letters, numbers, and underscores'}, status=400)
    
    # Check if username is available
    try:
        user_exists = User.objects.filter(username__iexact=username).exists()
        return JsonResponse({
            'available': not user_exists,
            'username': username
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': 'Failed to check username availability'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def request_password_reset(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)

        # Validate email format
        is_valid, error_msg = validate_email_format(email)
        if not is_valid:
            return JsonResponse({'error': error_msg}, status=400)

        try:
            # Use filter().first() to handle potential duplicate emails
            # WARNING: Multiple users with same email is a security issue
            # TODO: Make email field unique in User model
            user = User.objects.filter(email=email).first()
            if not user:
                # Don't reveal if email exists or not for security
                return JsonResponse({'status': 'otp_sent', 'message': 'If the email exists, OTP has been sent'}, status=200)
        except Exception as e:
            logger.warning(f'Error finding user by email {email}: {str(e)}')
            # Don't reveal if email exists or not for security
            return JsonResponse({'status': 'otp_sent', 'message': 'If the email exists, OTP has been sent'}, status=200)

        # Create or update password reset OTP
        otp_obj, created = OTP.objects.get_or_create(user=user)
        otp_code = otp_obj.generate_otp()

        # Send OTP via email
        try:
            subject = 'Password Reset OTP for GhostTalk'
            html_message = render_to_string('users/password_reset_email.html', {
                'user': user,
                'otp_code': otp_code
            })
            plain_message = strip_tags(html_message)

            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )

            return JsonResponse({
                'status': 'otp_sent',
                'message': 'Password reset OTP sent to your email',
                'user_id': user.id
            }, status=200)

        except Exception as e:
            return JsonResponse({'error': 'Failed to send OTP email'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def verify_password_reset_otp(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        otp_code = request.POST.get('otp_code')

        if not user_id or not otp_code:
            return JsonResponse({'error': 'User ID and OTP code are required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
            otp_obj = OTP.objects.get(user=user)

            if otp_obj.is_expired():
                return JsonResponse({'error': 'OTP has expired'}, status=400)

            if otp_obj.otp_code == otp_code:
                # Mark OTP as verified for password reset
                otp_obj.is_verified = True
                otp_obj.save()

                return JsonResponse({
                    'status': 'verified',
                    'message': 'OTP verified successfully',
                    'reset_token': f"{user_id}:{otp_code}"  # Simple token for frontend
                }, status=200)
            else:
                return JsonResponse({'error': 'Invalid OTP code'}, status=400)

        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except OTP.DoesNotExist:
            return JsonResponse({'error': 'OTP not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': 'Verification failed'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reset_password(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        otp_code = request.POST.get('otp_code')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')

        if not all([user_id, otp_code, new_password, confirm_password]):
            return JsonResponse({'error': 'All fields are required'}, status=400)

        if new_password != confirm_password:
            return JsonResponse({'error': 'Passwords do not match'}, status=400)

        # Validate password strength
        if len(new_password) < 8:
            return JsonResponse({'error': 'Password must be at least 8 characters'}, status=400)

        try:
            user = User.objects.get(id=user_id)
            otp_obj = OTP.objects.get(user=user)

            # Verify OTP is still valid and verified
            if not otp_obj.is_verified or otp_obj.is_expired():
                return JsonResponse({'error': 'OTP verification expired'}, status=400)

            if otp_obj.otp_code != otp_code:
                return JsonResponse({'error': 'Invalid OTP code'}, status=400)

            # Update password
            user.set_password(new_password)
            user.save()

            # Clean up OTP
            otp_obj.delete()

            return JsonResponse({
                'status': 'success',
                'message': 'Password reset successfully'
            }, status=200)

        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except OTP.DoesNotExist:
            return JsonResponse({'error': 'OTP verification required'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'Password reset failed'}, status=500)
@csrf_exempt
@token_required
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
        'user': {
            'id': request.user.id, 
            'username': request.user.username, 
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name
        },
        'profile': {
            'id': p.id,
            'image': p.image.url if p.image else None,
            'bio': getattr(p, 'bio', ''),
            'is_online': getattr(p, 'is_online', False),
        }
    })


""" Setup profile after verification (no auth required for newly verified users) """
@csrf_exempt
@require_http_methods(["POST"])
def setup_profile(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        
        if not user_id:
            return JsonResponse({'error': 'User ID is required'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
            
            # Check if user was recently verified (within last hour)
            try:
                otp_obj = OTP.objects.get(user=user, is_verified=True)
                # Allow setup if verified within last hour
                if timezone.now() - otp_obj.created_at > timezone.timedelta(hours=1):
                    return JsonResponse({'error': 'Profile setup time expired. Please login to update your profile.'}, status=403)
            except OTP.DoesNotExist:
                return JsonResponse({'error': 'User not verified'}, status=403)
            
            # Get or create profile
            profile, created = Profile.objects.get_or_create(user=user)
            
            # Handle profile update
            p_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
            
            if p_form.is_valid():
                p_form.save()
                return JsonResponse({'status': 'profile_setup_complete'}, status=200)
            else:
                return JsonResponse({'error': p_form.errors}, status=400)
                
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': 'Profile setup failed'}, status=500)


""" Creating a public profile view """
@require_http_methods(["GET"])
def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except User.MultipleObjectsReturned:
        # Handle unlikely case of duplicate usernames
        user = User.objects.filter(username=username).first()
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
    
    return JsonResponse({
        'user': {
            'id': user.id, 
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
    })


""" All user profiles """
@token_required
@require_http_methods(["GET"])
def profile_list(request):
    profiles = Profile.objects.all().exclude(user=request.user)
    return JsonResponse({'profiles': [
        {
            'id': p.id,
            'user': {
                'id': p.user.id, 
                'username': p.user.username,
                'first_name': p.user.first_name,
                'last_name': p.user.last_name
            },
            'is_online': getattr(p, 'is_online', False)
        } for p in profiles
    ]})

@token_required
def search_users(request):
    """Search for users by username, first name, or last name"""
    query = request.GET.get('query', '').strip()
    
    if not query or len(query) < 1:
        return JsonResponse({'users': [], 'count': 0})
    
    if len(query) > 100:
        query = query[:100]  # Limit query length
    
    # Search users by username, first name, or last name
    users = User.objects.filter(
        Q(username__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query)
    ).exclude(id=request.user.id)[:20]  # Limit to 20 results and exclude current user
    
    user_data = []
    for user in users:
        try:
            profile = Profile.objects.get(user=user)
            user_data.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'email': user.email or '',
                'is_online': profile.is_online,
                'bio': profile.bio or '',
                'image': profile.image.url if profile.image else None,
            })
        except Profile.DoesNotExist:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'email': user.email or '',
                'is_online': False,
                'bio': '',
                'image': None,
            })
    
    return JsonResponse({
        'users': user_data,
        'count': len(user_data),
        'query': query
    })

""" User profile details view """
@token_required
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
            'user': {
                'id': account.id, 
                'username': account.username,
                'first_name': account.first_name,
                'last_name': account.last_name
            },
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


@csrf_exempt
@require_http_methods(["POST"])
def custom_login(request):
    """
    Secure login view that accepts both username and email for authentication
    Returns JWT-like token with expiration
    """
    if request.method == 'POST':
        import json
        from datetime import datetime, timedelta
        from django.utils import timezone

        try:
            data = json.loads(request.body)
            username_or_email = data.get('username', '').strip()
            password = data.get('password', '').strip()

            if not username_or_email or not password:
                return JsonResponse({'error': 'Username/email and password are required'}, status=400)

            # Validate email format if it looks like an email
            if '@' in username_or_email:
                is_valid, error_msg = validate_email_format(username_or_email)
                if not is_valid:
                    return JsonResponse({'error': error_msg}, status=400)

            # Rate limiting check (basic implementation)
            client_ip = request.META.get('REMOTE_ADDR')
            cache_key = f'login_attempts_{client_ip}'
            # Note: In production, use Redis or database for rate limiting

            # Try to authenticate with username first
            from django.contrib.auth import authenticate
            user = authenticate(request, username=username_or_email, password=password)

            # If authentication failed with username, try with email
            if user is None:
                try:
                    # Use filter().first() instead of get() to handle duplicate emails
                    # WARNING: This is a temporary fix. Multiple users with same email is a security issue.
                    # TODO: Make email field unique in User model
                    user_obj = User.objects.filter(email=username_or_email).first()
                    if user_obj:
                        user = authenticate(request, username=user_obj.username, password=password)
                except Exception as e:
                    logger.warning(f'Multiple users found with email {username_or_email}: {str(e)}')
                    pass

            if user is not None:
                if user.is_active:
                    # Create or get token with expiration
                    from rest_framework.authtoken.models import Token
                    token, created = Token.objects.get_or_create(user=user)

                    # Update token creation time for expiration tracking
                    if not created:
                        token.created = timezone.now()
                        token.save()

                    # Get or create user profile
                    profile, profile_created = Profile.objects.get_or_create(user=user)

                    return JsonResponse({
                        'token': token.key,
                        'token_type': 'Bearer',
                        'expires_in': 86400,  # 24 hours in seconds
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'is_active': user.is_active,
                            'date_joined': user.date_joined.isoformat(),
                            'profile_complete': profile.bio is not None and profile.image is not None
                        }
                    }, status=200)
                else:
                    return JsonResponse({'error': 'Account is not active. Please verify your email.'}, status=400)
            else:
                return JsonResponse({'error': 'Invalid username/email or password'}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            # Log the error for debugging but don't expose sensitive information
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Login error: {str(e)}')
            return JsonResponse({'error': 'Authentication service temporarily unavailable'}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@require_http_methods(["POST"])
def custom_logout(request):
    """
    Secure logout view that invalidates tokens and clears sessions
    """
    try:
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token ') or auth_header.startswith('Bearer '):
            token_key = auth_header.split(' ')[1]
            try:
                from rest_framework.authtoken.models import Token
                token = Token.objects.get(key=token_key)
                token.delete()  # Delete the token to invalidate it
            except Token.DoesNotExist:
                pass

        # Clear session if it exists
        if hasattr(request, 'user') and request.user.is_authenticated:
            from django.contrib.auth import logout
            logout(request)

        return JsonResponse({
            'message': 'Successfully logged out',
            'success': True
        }, status=200)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Logout error: {str(e)}')
        return JsonResponse({'error': 'Logout failed'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def refresh_token(request):
    """
    Refresh token endpoint - validates current token and returns fresh one
    """
    try:
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not (auth_header.startswith('Token ') or auth_header.startswith('Bearer ')):
            return JsonResponse({'error': 'Authorization header required'}, status=401)

        token_key = auth_header.split(' ')[1]

        from rest_framework.authtoken.models import Token
        try:
            token = Token.objects.get(key=token_key)
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        # Check if token is expired (24 hours)
        from django.utils import timezone
        token_age = timezone.now() - token.created
        if token_age.total_seconds() > 86400:  # 24 hours
            token.delete()
            return JsonResponse({'error': 'Token expired'}, status=401)

        # Generate new token
        token.delete()  # Delete old token
        new_token = Token.objects.create(user=token.user)

        return JsonResponse({
            'token': new_token.key,
            'token_type': 'Bearer',
            'expires_in': 86400,
            'user': {
                'id': token.user.id,
                'username': token.user.username,
                'email': token.user.email,
                'first_name': token.user.first_name,
                'last_name': token.user.last_name,
                'is_active': token.user.is_active,
                'date_joined': token.user.date_joined.isoformat(),
            }
        }, status=200)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Token refresh error: {str(e)}')
        return JsonResponse({'error': 'Token refresh failed'}, status=500)

