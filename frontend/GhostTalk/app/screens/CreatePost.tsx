import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost } from '../api';

const CreatePost: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const scheme = useColorScheme();

  const handleCreatePost = async () => {
    try {
      await createPost(title, content);
      Alert.alert('Success', 'Post created');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <Text style={{ fontSize: 24, marginBottom: 20, color: Colors[scheme ?? 'light'].text }}>Create Post ✍️</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Content"
        value={content}
        onChangeText={setContent}
        multiline
        style={{ borderWidth: 1, padding: 10, marginBottom: 20, height: 100 }}
      />
      <TouchableOpacity onPress={handleCreatePost} style={{ backgroundColor: Colors[scheme ?? 'light'].primary, padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Create</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreatePost;
