import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Comment, createComment, likeComment } from '../app/api';
import { useAuth } from './AuthContext';

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
}

interface CommentItemProps {
  comment: CommentWithReplies;
  onLike: (id: number) => void;
  onReply: (commentId: number, authorName: string) => void;
  depth?: number;
  postId: number;
  onRefresh: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  depth = 0,
  postId,
  onRefresh
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const authorDisplay = comment?.user?.first_name || comment?.user?.username || 'Unknown User';
  const maxDepth = 3; // Limit nesting depth

  const handleLike = async () => {
    try {
      const response = await likeComment(comment.id);
      // Update the comment's like count based on the response
      if (response.data) {
        // Assuming the response contains updated like information
        onRefresh(); // Refresh to get updated data
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await createComment(postId, replyText.trim(), comment.id);
      setReplyText('');
      setIsReplying(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to reply');
    }
  };

  return (
    <View style={{ marginLeft: depth * 20, marginTop: 8 }}>
      {/* Comment Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.tint + '55',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8
        }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>
            {(authorDisplay[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>
          {authorDisplay}
        </Text>
        <Text style={{ color: colors.tabIconDefault, fontSize: 12, marginLeft: 8 }}>
          {new Date(comment.date_added).toLocaleDateString()}
        </Text>
      </View>

      {/* Comment Body */}
      <Text style={{ color: colors.text, fontSize: 14, lineHeight: 18, marginBottom: 8 }}>
        {comment.body}
      </Text>

      {/* Comment Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={handleLike}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons
            name={comment.likes_count > 0 ? 'heart' : 'heart-outline'}
            size={14}
            color={comment.likes_count > 0 ? colors.tint : colors.tabIconDefault}
          />
          <Text style={{ color: colors.tabIconDefault, fontSize: 12 }}>
            {comment.likes_count > 0 ? comment.likes_count : 'Like'}
          </Text>
        </TouchableOpacity>

        {depth < maxDepth && (
          <TouchableOpacity
            onPress={() => {
              setIsReplying(true);
              onReply(comment.id, authorDisplay);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="return-up-forward-outline" size={14} color={colors.tabIconDefault} />
            <Text style={{ color: colors.tabIconDefault, fontSize: 12 }}>Reply</Text>
          </TouchableOpacity>
        )}

        {/* Show replies toggle if there are replies */}
        {comment.replies && comment.replies.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowReplies(!showReplies)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons
              name={showReplies ? "chevron-up-outline" : "chevron-down-outline"}
              size={14}
              color={colors.tabIconDefault}
            />
            <Text style={{ color: colors.tabIconDefault, fontSize: 12 }}>
              {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reply Input */}
      {isReplying && (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            placeholder={`Reply to ${authorDisplay}...`}
            value={replyText}
            onChangeText={setReplyText}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.tabIconDefault + '40',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
              color: colors.text,
              backgroundColor: colors.background
            }}
            multiline
          />
          <TouchableOpacity
            onPress={handleReply}
            style={{
              backgroundColor: colors.tint,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIsReplying(false);
              setReplyText('');
            }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 8
            }}
          >
            <Ionicons name="close" size={16} color={colors.tabIconDefault} />
          </TouchableOpacity>
        </View>
      )}

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              depth={depth + 1}
              postId={postId}
              onRefresh={onRefresh}
            />
          ))}
        </View>
      )}
    </View>
  );
};

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  onRefresh: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments, onRefresh }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);

  // Organize comments into nested structure
  const organizeComments = (comments: Comment[]): CommentWithReplies[] => {
    const commentMap = new Map<number, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create all comment objects
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.reply_id) {
        const parent = commentMap.get(comment.reply_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const organizedComments = organizeComments(comments);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment(postId, newComment.trim(), replyingTo?.id);
      setNewComment('');
      setReplyingTo(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleLikeComment = async (id: number) => {
    try {
      await likeComment(id);
      onRefresh();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  const handleReply = (commentId: number, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  return (
    <View style={{ marginTop: 12 }}>
      {/* Comment Input */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <TextInput
            placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
            value={newComment}
            onChangeText={setNewComment}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.tabIconDefault + '40',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.text,
              backgroundColor: colors.background,
              minHeight: 40,
              maxHeight: 100
            }}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!newComment.trim()}
            style={{
              backgroundColor: newComment.trim() ? colors.tint : colors.tabIconDefault + '40',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              justifyContent: 'center'
            }}
          >
            <Ionicons
              name="send"
              size={16}
              color={newComment.trim() ? 'white' : colors.tabIconDefault}
            />
          </TouchableOpacity>
        </View>

        {replyingTo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: colors.tabIconDefault, fontSize: 12, flex: 1 }}>
              Replying to {replyingTo.name}
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Comments List */}
      {organizedComments && organizedComments.length > 0 ? (
        <FlatList
          data={organizedComments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onLike={handleLikeComment}
              onReply={handleReply}
              postId={postId}
              onRefresh={onRefresh}
            />
          )}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ color: colors.tabIconDefault, fontSize: 14 }}>
            No comments yet. Be the first to comment!
          </Text>
        </View>
      )}
    </View>
  );
};

export default CommentSection;
