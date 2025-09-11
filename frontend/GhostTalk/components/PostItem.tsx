import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Post } from '../app/api';
import { useAuth } from './AuthContext';

interface PostItemProps {
  post: Post;
  onLike: (id: number) => void;
  onSave?: (id: number) => void;
  onPress: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onPrivacy?: (post: Post) => void;
  showSaveButton?: boolean; // If true, show save button instead of menu
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onSave, onPress, onEdit, onShare, onDelete, onPrivacy, showSaveButton = false }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const initials = (post?.author?.first_name?.[0] || post?.author?.username?.[0] || 'U').toUpperCase();

  // Handle case where author might be undefined
  const authorName = post?.author?.username || 'Unknown User';
  const authorDisplay = post?.author?.first_name || post?.author?.username || 'Unknown User';

  // Check if current user owns this post
  const isOwner = user && post?.author?.id === user.id;

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setShowMenu(false);
            if (onDelete) {
              onDelete(post);
            }
          }
        }
      ]
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave(post.id);
    }
  };

  const handlePrivacy = () => {
    setShowMenu(false);
    if (onPrivacy) {
      onPrivacy(post);
    }
  };

  const renderFormattedText = (text: string) => {
    // Basic markdown-like formatting
    let formattedText = text;

    // Bold: **text** -> bold text
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, (_, content) => content);

    // Italic: *text* -> italic text
    formattedText = formattedText.replace(/\*(.*?)\*/g, (_, content) => content);

    // Underline: <u>text</u> -> underlined text
    formattedText = formattedText.replace(/<u>(.*?)<\/u>/g, (_, content) => content);

    // Links: [text](url) -> text
    formattedText = formattedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Lists: - item -> • item
    formattedText = formattedText.replace(/^- /gm, '• ');

    return formattedText;
  };

  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#222' : '#eee', backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tint + '55', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ color: 'white', fontWeight: '800' }}>{initials}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '700', color: colors.text }}>{authorName}</Text>
            <Text style={{ fontSize: 11, color: colors.tabIconDefault }}>{new Date(post.date_posted).toLocaleDateString()}</Text>
          </View>
        </View>
        {/* Show save button or menu based on showSaveButton prop */}
        {showSaveButton ? (
          <TouchableOpacity 
            onPress={handleSave}
            accessibilityLabel="Save post"
            style={{ padding: 8, borderRadius: 20, backgroundColor: colors.tabIconDefault + '20' }}
          >
            <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={18} color={post.saved ? colors.tint : colors.icon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => setShowMenu(true)}
            accessibilityLabel="Post options"
            style={{ padding: 8, borderRadius: 20, backgroundColor: colors.tabIconDefault + '20' }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <TouchableOpacity onPress={() => onPress(post)}>
        {!!post.title && <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 8, color: colors.text }}>{post.title}</Text>}
        {!!post.content && <Text style={{ marginTop: 6, color: colors.text }}>{renderFormattedText(post.content)}</Text>}
        {!!post.image && (
          <Image
            source={{ uri: post.image }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              marginTop: 10,
              backgroundColor: scheme === 'dark' ? '#222' : '#f0f0f0'
            }}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Footer actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 }}>
        <TouchableOpacity onPress={() => onLike(post.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? colors.tint : colors.icon} />
          <Text style={{ color: colors.text }}>{post.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onShare && onShare(post)} 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="share-outline" size={18} color={colors.icon} />
          <Text style={{ color: colors.text }}>Share</Text>
        </TouchableOpacity>
        {typeof post.comments_count === 'number' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.icon} />
            <Text style={{ color: colors.text }}>{post.comments_count}</Text>
          </View>
        )}
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowMenu(false)}
        >
          <View style={{
            position: 'absolute',
            top: '50%',
            right: 20,
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 8,
            minWidth: 180,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            {/* Save Option */}
            {onSave && (
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  handleSave();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.icon} />
                <Text style={{ marginLeft: 12, color: colors.text, fontSize: 16 }}>
                  {post.saved ? 'Unsave Post' : 'Save Post'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Share Option */}
            {onShare && (
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  onShare(post);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="share-outline" size={20} color={colors.icon} />
                <Text style={{ marginLeft: 12, color: colors.text, fontSize: 16 }}>Share Post</Text>
              </TouchableOpacity>
            )}

            {/* Privacy Option - Only for post owner */}
            {isOwner && onPrivacy && (
              <TouchableOpacity
                onPress={handlePrivacy}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon} />
                <Text style={{ marginLeft: 12, color: colors.text, fontSize: 16 }}>Privacy</Text>
              </TouchableOpacity>
            )}

            {/* Edit Option - Only for post owner */}
            {isOwner && onEdit && (
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  onEdit(post);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.icon} />
                <Text style={{ marginLeft: 12, color: colors.text, fontSize: 16 }}>Edit Post</Text>
              </TouchableOpacity>
            )}

            {/* Delete Option - Only for post owner */}
            {isOwner && (
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.icon} />
                <Text style={{ marginLeft: 12, color: colors.text, fontSize: 16 }}>Delete Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default PostItem;
