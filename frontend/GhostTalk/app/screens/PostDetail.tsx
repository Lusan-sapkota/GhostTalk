import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getPostDetail, Post, Comment } from '../api';
import CommentSection from '../../components/CommentSection';
import { useLocalSearchParams } from 'expo-router';

const PostDetail: React.FC<any> = (props) => {
  // Support both expo-router params and react-navigation route prop
  const params = useLocalSearchParams();
  const route = (props && props.route) || undefined;
  let post: Post | undefined = undefined;
  try {
    if (params && (params as any).post) {
      const p = (params as any).post as any;
      post = typeof p === 'string' ? JSON.parse(p) : p;
    } else if (route && route.params && route.params.post) {
      post = route.params.post;
    }
  } catch (e) {
    console.error('Failed to parse post param', e);
  }

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Missing post data</Text>
      </View>
    );
  }
  const [comments, setComments] = useState<Comment[]>([]);

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

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text selectable style={{ fontSize: 20, fontWeight: 'bold' }}>{post.title}</Text>
      <Text selectable>{post.content}</Text>
      <Text>By {post?.author?.username || 'Unknown User'}</Text>

      <CommentSection
        postId={post.id}
        comments={comments}
        onRefresh={fetchPostDetail}
      />
    </View>
  );
};

export default PostDetail;
