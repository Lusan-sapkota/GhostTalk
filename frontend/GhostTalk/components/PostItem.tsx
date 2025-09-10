import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Post } from '../app/api';

interface PostItemProps {
  post: Post;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onPress: (post: Post) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onSave, onPress }) => {
  const scheme = useColorScheme();
  const initials = (post?.author?.first_name?.[0] || post?.author?.username?.[0] || 'U').toUpperCase();
  const tint = Colors[scheme ?? 'light'].tint;
  const iconColor = Colors[scheme ?? 'light'].icon;
  const subtle = scheme === 'dark' ? '#aaa' : '#666';

  // Handle case where author might be undefined
  const authorName = post?.author?.username || 'Unknown User';
  const authorDisplay = post?.author?.first_name || post?.author?.username || 'Unknown User';

  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#222' : '#eee' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tint + '55', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ color: 'white', fontWeight: '800' }}>{initials}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '700', color: Colors[scheme ?? 'light'].text }}>{authorName}</Text>
            <Text style={{ fontSize: 11, color: subtle }}>{new Date(post.date_posted).toLocaleDateString()}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityLabel="Post options">
          <Ionicons name="settings-outline" size={18} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <TouchableOpacity onPress={() => onPress(post)}>
        {!!post.title && <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 8 }}>{post.title}</Text>}
        {!!post.content && <Text style={{ marginTop: 6 }}>{post.content}</Text>}
      </TouchableOpacity>

      {/* Footer actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 }}>
        <TouchableOpacity onPress={() => onLike(post.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? tint : iconColor} />
          <Text>{post.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSave(post.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={18} color={post.saved ? tint : iconColor} />
          <Text>{post.saves_count}</Text>
        </TouchableOpacity>
        {typeof post.comments_count === 'number' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={iconColor} />
            <Text>{post.comments_count}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default PostItem;
