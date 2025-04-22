from flask import Blueprint, request, jsonify
from app.services.ghostguard_service import GhostGuardService
from app.utils.security import token_required
from app.services.appwrite_service import AppwriteService
import datetime

community_bp = Blueprint('community', __name__)
ghostguard_service = GhostGuardService()
appwrite_service = AppwriteService()

@community_bp.route('/posts', methods=['GET'])
@token_required
def get_posts(current_user_id):
    """Get all community posts with pagination"""
    try:
        # Get query parameters for pagination
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=20, type=int)
        category = request.args.get('category', default=None, type=str)
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Create filters
        filters = []
        if category:
            filters.append(f"category={category}")
        
        # Get posts from database
        posts_result = appwrite_service.database.list_documents(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.community_posts_collection_id,
            queries=filters,
            limit=limit,
            offset=offset
        )
        
        posts = posts_result.get('documents', [])
        
        # Fetch author info for each post
        for post in posts:
            author_id = post.get('authorId')
            if author_id:
                author = appwrite_service.get_user_document(author_id)
                if author:
                    post['authorName'] = author.get('username', 'Unknown')
                    post['authorAvatar'] = author.get('avatar')
        
        return jsonify({
            'success': True,
            'posts': posts,
            'total': posts_result.get('total', 0),
            'page': page,
            'limit': limit
        }), 200
    except Exception as e:
        print(f"Error getting posts: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@community_bp.route('/post', methods=['POST'])
@token_required
def create_post(current_user_id):
    """Create a new community post with content moderation"""
    try:
        data = request.get_json()
        
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        title = data.get('title')
        content = data.get('content')
        category = data.get('category', 'General')
        
        # Check combined content with GhostGuard
        combined_text = f"{title} {content}"
        is_inappropriate, confidence = ghostguard_service.contains_inappropriate_content(combined_text)
        
        # If inappropriate content is detected, reject the post
        if is_inappropriate:
            return jsonify({
                'success': False, 
                'message': 'Your post contains inappropriate content that violates our community guidelines',
                'confidence': float(confidence)
            }), 403
        
        # Create the post in database
        post_data = {
            'title': title,
            'content': content,
            'category': category,
            'authorId': current_user_id,
            'createdAt': datetime.datetime.utcnow().isoformat(),
            'updatedAt': datetime.datetime.utcnow().isoformat(),
            'likes': 0,
            'comments': 0
        }
        
        # Create post document
        post = appwrite_service.database.create_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.community_posts_collection_id,
            document_id='unique()',
            data=post_data
        )
        
        return jsonify({
            'success': True,
            'message': 'Post created successfully',
            'post': post
        }), 201
    except Exception as e:
        print(f"Error creating post: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@community_bp.route('/post/<string:post_id>', methods=['GET'])
@token_required
def get_post(current_user_id, post_id):
    """Get a specific community post"""
    try:
        # Get post from database
        post = appwrite_service.database.get_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.community_posts_collection_id,
            document_id=post_id
        )
        
        # Get author info
        author_id = post.get('authorId')
        if author_id:
            author = appwrite_service.get_user_document(author_id)
            if author:
                post['authorName'] = author.get('username', 'Unknown')
                post['authorAvatar'] = author.get('avatar')
        
        return jsonify({
            'success': True,
            'post': post
        }), 200
    except Exception as e:
        print(f"Error getting post: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@community_bp.route('/check-content', methods=['POST'])
@token_required
def check_content(current_user_id):
    """Check if content is appropriate using GhostGuard"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'success': False, 'message': 'Missing content'}), 400
    
    text = data.get('text')
    is_inappropriate, confidence = ghostguard_service.contains_inappropriate_content(text)
    
    return jsonify({
        'success': True, 
        'isAppropriate': not is_inappropriate,
        'confidence': float(confidence)
    })

@community_bp.route('/comment', methods=['POST'])
@token_required
def add_comment(current_user_id):
    """Add a comment to a community post with content moderation"""
    try:
        data = request.get_json()
        
        if not data or 'postId' not in data or 'content' not in data:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        post_id = data.get('postId')
        content = data.get('content')
        
        # Check content with GhostGuard
        is_inappropriate, confidence = ghostguard_service.contains_inappropriate_content(content)
        
        # If inappropriate content is detected, reject the comment
        if is_inappropriate:
            return jsonify({
                'success': False, 
                'message': 'Your comment contains inappropriate content',
                'confidence': float(confidence)
            }), 403
        
        # Create comment data
        comment_data = {
            'postId': post_id,
            'content': content,
            'authorId': current_user_id,
            'createdAt': datetime.datetime.utcnow().isoformat(),
            'likes': 0
        }
        
        # Create comment document
        comment = appwrite_service.database.create_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.comments_collection_id,
            document_id='unique()',
            data=comment_data
        )
        
        # Update comment count on the post
        post = appwrite_service.database.get_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.community_posts_collection_id,
            document_id=post_id
        )
        
        comments_count = post.get('comments', 0) + 1
        
        appwrite_service.database.update_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.community_posts_collection_id,
            document_id=post_id,
            data={'comments': comments_count}
        )
        
        return jsonify({
            'success': True,
            'message': 'Comment added successfully',
            'comment': comment
        }), 201
    except Exception as e:
        print(f"Error adding comment: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500