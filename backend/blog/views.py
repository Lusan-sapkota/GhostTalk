from notification.models import Notification
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
from .models import Comment, Post
from .forms import CommentForm
from django.http import JsonResponse
from users.models import Profile
from itertools import chain
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import random
from django.views.decorators.csrf import csrf_exempt
import re

try:
    import bleach
except Exception:
    bleach = None

try:
    from better_profanity import profanity as better_profanity
    better_profanity.load_censor_words()
except Exception:
    better_profanity = None


def _strip_tags(text: str) -> str:
    if not text:
        return ""
    if bleach:
        return bleach.clean(text, tags=[], attributes={}, strip=True)
    # Fallback: naive strip tags
    return re.sub(r'<[^>]+>', '', text)


def _mask_profanity(text: str) -> str:
    if not text:
        return ""
    if better_profanity:
        return better_profanity.censor(text)
    # Minimal fallback list (extend as needed)
    bad_words = [r"shit", r"shitty", r"asshole", r"bitch", r"bastard"]
    def repl(m):
        return m.group(0)[0] + "*" * (len(m.group(0)) - 1)
    pattern = re.compile(r"\\b(" + "|".join(bad_words) + r")\\b", re.IGNORECASE)
    return pattern.sub(repl, text)


def _safe_text(text: str, max_len: int = 5000) -> str:
    txt = _strip_tags(text)
    txt = _mask_profanity(txt)
    if len(txt) > max_len:
        txt = txt[:max_len] + "…"
    return txt


def _serialize_user(u: User):
    return {"id": u.id, "username": u.username, "first_name": u.first_name, "last_name": u.last_name}


def _serialize_post(p: Post, user=None):
    liked = False
    saved = False
    if user is not None and getattr(user, 'is_authenticated', False):
        try:
            liked = p.likes.filter(id=user.id).exists()
            saved = p.saves.filter(id=user.id).exists()
        except Exception:
            liked = False
            saved = False
    return {
        "id": p.id,
        "title": p.title,
    "content": _safe_text(p.content or ""),
        "date_posted": p.date_posted.isoformat(),
        "date_updated": p.date_updated.isoformat(),
        "author": _serialize_user(p.author),
        "likes_count": p.total_likes(),
        "saves_count": p.total_saves(),
        "liked": liked,
        "saved": saved,
        "comments_count": p.comments.filter(reply=None).count(),
    }


def _serialize_comment(c: Comment):
    return {
        "id": c.id,
        "post_id": c.post_id,
        "user": _serialize_user(c.name),
    "body": _safe_text(c.body or "", max_len=2000),
        "date_added": c.date_added.isoformat(),
        "likes_count": c.total_clikes(),
        "reply_id": c.reply_id,
    }


@require_http_methods(["GET"])
def first(request):
    posts = Post.objects.all().order_by("-date_posted")
    user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
    return JsonResponse({"posts": [_serialize_post(p, user) for p in posts]}, status=200)

""" Posts of following user profiles """
@login_required
@require_http_methods(["GET"])
def posts_of_following_profiles(request):

    profile = Profile.objects.get(user = request.user)
    users = [user for user in profile.following.all()]
    posts = []
    qs = None
    for u in users:
        p = Profile.objects.get(user=u)
        p_posts = p.user.post_set.all()
        posts.append(p_posts)
    my_posts = profile.profile_posts()
    posts.append(my_posts)
    if len(posts)>0:
        qs = sorted(chain(*posts), reverse=True, key=lambda obj:obj.date_posted)

    paginator = Paginator(qs, 5)
    page = request.GET.get('page')
    try:
        posts_list = paginator.page(page)
    except PageNotAnInteger:
        posts_list = paginator.page(1)
    except EmptyPage:
        posts_list = paginator.page(paginator.num_pages)
  
    return JsonResponse({
        'profile': _serialize_user(request.user),
        'page': posts_list.number,
        'num_pages': paginator.num_pages,
        'posts': [_serialize_post(p, request.user) for p in posts_list.object_list],
    })


""" Post Like """
@csrf_exempt
@login_required
@require_http_methods(["POST"])
def LikeView(request):

    post = get_object_or_404(Post, id=request.POST.get('id'))
    liked = False
    if post.likes.filter(id=request.user.id).exists():
        post.likes.remove(request.user)
        liked = False
        notify = Notification.objects.filter(post=post, sender=request.user, notification_type=1)
        notify.delete()
    else:
        post.likes.add(request.user)
        liked = True
        notify = Notification(post=post, sender=request.user, user=post.author, notification_type=1)
        notify.save()

    context = {
        'post':post,
        'total_likes':post.total_likes(),
        'liked':liked,
    }

    return JsonResponse({
        'post_id': post.id,
        'total_likes': post.total_likes(),
        'liked': liked,
    })


""" Post save """
@csrf_exempt
@login_required
@require_http_methods(["POST"])
def SaveView(request):

    post = get_object_or_404(Post, id=request.POST.get('id'))
    saved = False
    if post.saves.filter(id=request.user.id).exists():
        post.saves.remove(request.user)
        saved = False
    else:
        post.saves.add(request.user)
        saved = True
    
    context = {
        'post':post,
        'total_saves':post.total_saves(),
        'saved':saved,
    }

    return JsonResponse({
        'post_id': post.id,
        'total_saves': post.total_saves(),
        'saved': saved,
    })


""" Like post comments """
@csrf_exempt
@login_required
@require_http_methods(["POST"])
def LikeCommentView(request): # , id1, id2              id1=post.pk id2=reply.pk
    post = get_object_or_404(Comment, id=request.POST.get('id'))
    cliked = False
    if post.likes.filter(id=request.user.id).exists():
        post.likes.remove(request.user)
        cliked = False
    else:
        post.likes.add(request.user)
        cliked = True

    cpost = get_object_or_404(Post, id=request.POST.get('pid'))
    total_comments2 = cpost.comments.all().order_by('-id')
    total_comments = cpost.comments.all().filter(reply=None).order_by('-id')
    tcl={}
    for cmt in total_comments2:
        total_clikes = cmt.total_clikes()
        cliked = False
        if cmt.likes.filter(id=request.user.id).exists():
            cliked = True

        tcl[cmt.id] = cliked


    context = {
        'comment_form':CommentForm(),
        'post':cpost,
        'comments':total_comments,
        'total_clikes':post.total_clikes(),
        'clikes':tcl
    }

    return JsonResponse({
        'comment_id': post.id,
        'post_id': cpost.id,
        'total_clikes': post.total_clikes(),
        'clikes': tcl,
    })


""" Home page with all posts """
@login_required
@require_http_methods(["GET"])
def post_list(request):
    qs = Post.objects.all().order_by('-date_posted')
    paginator = Paginator(qs, 5)
    page = request.GET.get('page')
    try:
        posts_list = paginator.page(page)
    except PageNotAnInteger:
        posts_list = paginator.page(1)
    except EmptyPage:
        posts_list = paginator.page(paginator.num_pages)

    # suggest up to 3 random users to follow (excluding self)
    users = list(User.objects.exclude(pk=request.user.pk))
    cnt = min(3, len(users))
    random_users = random.sample(users, cnt) if cnt else []

    return JsonResponse({
        'page': posts_list.number,
        'num_pages': paginator.num_pages,
        'posts': [_serialize_post(p, request.user) for p in posts_list.object_list],
        'suggested_users': [_serialize_user(u) for u in random_users],
    })


""" All the posts of the user """
@login_required
@require_http_methods(["GET"])
def user_posts(request, username):
    user = get_object_or_404(User, username=username)
    qs = Post.objects.filter(author=user).order_by('-date_posted')
    paginator = Paginator(qs, 5)
    page = request.GET.get('page')
    try:
        posts_list = paginator.page(page)
    except PageNotAnInteger:
        posts_list = paginator.page(1)
    except EmptyPage:
        posts_list = paginator.page(paginator.num_pages)
    return JsonResponse({
        'author': _serialize_user(user),
        'page': posts_list.number,
        'num_pages': paginator.num_pages,
        'posts': [_serialize_post(p, request.user) for p in posts_list.object_list],
    })



""" Post detail view """
@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def PostDetailView(request,pk):

    stuff = get_object_or_404(Post, id=pk)
    total_likes = stuff.total_likes()
    total_saves = stuff.total_saves()
    total_comments = stuff.comments.all().filter(reply=None).order_by('-id')
    total_comments2 = stuff.comments.all().order_by('-id')

    context = {}

    if request.method == "POST":
        comment_qs = None
        comment_form = CommentForm(request.POST or None)
        if comment_form.is_valid():
            form = request.POST.get('body')
            reply_id = request.POST.get('comment_id')
            if reply_id:
                comment_qs = Comment.objects.get(id=reply_id)
            
            safe_form = _safe_text(form, max_len=2000)
            comment = Comment.objects.create(name=request.user,post=stuff,body=safe_form, reply=comment_qs)
            comment.save()
            if reply_id:
                notify = Notification(post=stuff, sender=request.user, user=stuff.author, text_preview=form, notification_type=4)
                notify.save()
            else:
                notify = Notification(post=stuff, sender=request.user, user=stuff.author, text_preview=form, notification_type=3)
                notify.save()
            total_comments = stuff.comments.all().filter(reply=None).order_by('-id')
            total_comments2 = stuff.comments.all().order_by('-id')
    else:
        comment_form = CommentForm()
             

    tcl={}
    for cmt in total_comments2:
        total_clikes = cmt.total_clikes()
        cliked = False
        if cmt.likes.filter(id=request.user.id).exists():
            cliked = True

        tcl[cmt.id] = cliked
    context["clikes"]=tcl


    liked = False
    if stuff.likes.filter(id=request.user.id).exists():
        liked = True
    context["total_likes"]=total_likes
    context["liked"]=liked


    saved = False
    if stuff.saves.filter(id=request.user.id).exists():
        saved = True
    context["total_saves"]=total_saves
    context["saved"]=saved
    

    context['comment_form'] = comment_form

    context['post']=stuff
    context['comments']=total_comments

    # return full JSON detail
    return JsonResponse({
        'post': _serialize_post(stuff, request.user),
        'total_likes': context["total_likes"],
        'liked': context["liked"],
        'total_saves': context["total_saves"],
        'saved': context["saved"],
        'comments': [_serialize_comment(c) for c in total_comments],
        'clikes': context["clikes"],
    })


""" Create post """
@csrf_exempt
@login_required
@require_http_methods(["POST"])
def post_create(request):
    title = request.POST.get('title')
    content = request.POST.get('content')
    if not title:
        return JsonResponse({'error': 'title is required'}, status=400)
    post = Post.objects.create(title=_safe_text(title, max_len=200), content=_safe_text(content or ""), author=request.user)
    return JsonResponse({'post': _serialize_post(post, request.user)}, status=201)



""" Update post """
@csrf_exempt
@login_required
@require_http_methods(["PUT", "PATCH"])
def post_update(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.user != post.author:
        return JsonResponse({'error': 'forbidden'}, status=403)
    # accept form-encoded or JSON
    if request.content_type == 'application/json':
        import json
        data = json.loads(request.body or '{}')
        title = data.get('title')
        content = data.get('content')
    else:
        title = request.POST.get('title')
        content = request.POST.get('content')
    if title is not None:
        post.title = _safe_text(title, max_len=200)
    if content is not None:
        post.content = _safe_text(content)
    post.save()
    return JsonResponse({'post': _serialize_post(post, request.user)})


""" Delete post """
@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def post_delete(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.user != post.author:
        return JsonResponse({'error': 'forbidden'}, status=403)
    post.delete()
    return JsonResponse({}, status=204)


""" About page """
@require_http_methods(["GET"])
def about(request):
    return JsonResponse({'name': 'Django Social API', 'version': '1.0'})


""" Search by post title or username """
@require_http_methods(["GET"])
def search(request):
    query = request.GET['query']
    if len(query) >= 150 or len(query) < 1:
        allposts = Post.objects.none()
    elif len(query.strip()) == 0:
        allposts = Post.objects.none()
    else:
        allpostsTitle = Post.objects.filter(title__icontains=query)
        allpostsAuthor = Post.objects.filter(author__username = query)
        allposts = allpostsAuthor.union(allpostsTitle)
    
    user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
    return JsonResponse({'results': [_serialize_post(p, user) for p in allposts]})


""" Liked posts """
@login_required
@require_http_methods(["GET"])
def AllLikeView(request):
    user = request.user
    liked_posts = user.blogpost.all()
    context = {
        'liked_posts':liked_posts
    }
    return JsonResponse({'liked_posts': [_serialize_post(p, request.user) for p in liked_posts]})


""" Saved posts """
@login_required
@require_http_methods(["GET"])
def AllSaveView(request):
    user = request.user
    saved_posts = user.blogsave.all()
    context = {
        'saved_posts':saved_posts
    }
    return JsonResponse({'saved_posts': [_serialize_post(p, request.user) for p in saved_posts]})

