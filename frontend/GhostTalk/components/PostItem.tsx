import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Post } from '../app/api';

interface PostItemProps {
  post: Post;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onPress: (post: Post) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onSave, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(post)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <Image source={{ uri: 'https://via.placeholder.com/40' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
        <Text style={{ fontWeight: 'bold' }}>{post.author.username}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>{post.title}</Text>
      <Text style={{ marginBottom: 10 }}>{post.content}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => onLike(post.id)}>
          <Text>Like ({post.likes_count})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSave(post.id)}>
          <Text>Save ({post.saves_count})</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PostItem;
