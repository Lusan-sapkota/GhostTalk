import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Comment } from '../app/api';

interface CommentItemProps {
  comment: Comment;
  onLike: (id: number, pid: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike }) => {
  const authorName = comment?.user?.username || 'Unknown User';
  
  return (
    <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontWeight: 'bold' }}>{authorName}</Text>
      <Text>{comment.body}</Text>
      <TouchableOpacity onPress={() => onLike(comment.id, comment.post_id)}>
        <Text>Like ({comment.likes_count})</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CommentItem;
