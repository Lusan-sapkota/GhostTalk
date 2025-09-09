import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { getPostDetail, Post, Comment } from '../api';
import CommentItem from '../../components/CommentItem';

const PostDetail: React.FC<{ route: any }> = ({ route }) => {
  const { post } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPostDetail();
  }, []);

  const fetchPostDetail = async () => {
    try {
      const response = await getPostDetail(post.id);
      setComments(response.data.comments);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLikeComment = async (id: number, pid: number) => {
    // Implement like comment
  };

  const handleAddComment = async () => {
    // Implement add comment
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{post.title}</Text>
      <Text>{post.content}</Text>
      <Text>By {post.author.username}</Text>
      <TextInput
        placeholder="Add a comment"
        value={newComment}
        onChangeText={setNewComment}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <TouchableOpacity onPress={handleAddComment} style={{ backgroundColor: 'blue', padding: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Comment</Text>
      </TouchableOpacity>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CommentItem comment={item} onLike={handleLikeComment} />
        )}
      />
    </View>
  );
};

export default PostDetail;
