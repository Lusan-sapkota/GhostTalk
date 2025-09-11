// Created by: Lusan-sapkota
// Date: September 11, 2025
// Description: Individual comment item component with theme support

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Comment } from '../app/api';

interface CommentItemProps {
  comment: Comment;
  onLike: (id: number, pid: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const authorName = comment?.user?.username || 'Unknown User';
  const authorDisplay = comment?.user?.first_name || comment?.user?.username || 'Unknown User';

  return (
    <View style={{
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: scheme === 'dark' ? '#333' : '#eee',
      backgroundColor: colors.background
    }}>
      <Text style={{
        fontWeight: 'bold',
        color: colors.text,
        fontSize: 14
      }}>
        {authorDisplay}
      </Text>
      <Text style={{
        color: colors.text,
        fontSize: 14,
        lineHeight: 18,
        marginTop: 4
      }}>
        {comment.body}
      </Text>
      <TouchableOpacity
        onPress={() => onLike(comment.id, comment.post_id)}
        style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
      >
        <Ionicons
          name={comment.likes_count > 0 ? 'heart' : 'heart-outline'}
          size={16}
          color={comment.likes_count > 0 ? colors.tint : colors.tabIconDefault}
        />
        <Text style={{
          color: colors.tabIconDefault,
          fontSize: 12
        }}>
          {comment.likes_count > 0 ? `Like (${comment.likes_count})` : 'Like'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CommentItem;
