import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost, updatePost } from '../api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  const scheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const colors = Colors[scheme ?? 'light'];

  useEffect(() => {
    const editPostParam = params.editPost as string;
    if (editPostParam) {
      try {
        const post = JSON.parse(editPostParam);
        setTitle(post.title || '');
        setContent(post.content || '');
        setIsEditing(true);
        setEditingPostId(post.id);
        // Note: Image editing would require additional backend support
      } catch (error) {
        console.error('Error parsing edit post data:', error);
      }
    }
  }, [params.editPost]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 150) {
      newErrors.title = 'Title must be less than 150 characters';
    }

    if (content.length > 5000) {
      newErrors.content = 'Content must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Make cropping optional
        quality: 0.8,
        allowsMultipleSelection: true, // Allow multiple images
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Make cropping optional
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setSelectedImages([]);
  };

  const handleCreatePost = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      // Add text fields
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      // Add images if selected
      for (let i = 0; i < selectedImages.length; i++) {
        const imageUri = selectedImages[i];
        // Get file extension and create proper filename
        const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `post_image_${Date.now()}_${i}.${fileExtension}`;

        // For React Native, we need to create a file object from the URI
        const response = await fetch(imageUri);
        const blob = await response.blob();

        formData.append('images', {
          uri: imageUri,
          name: fileName,
          type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        } as any);
      }

      if (isEditing && editingPostId) {
        // Update existing post
        await updatePost(editingPostId, title.trim(), content.trim());
        Alert.alert('Success', 'Post updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (onPostCreated) {
                onPostCreated();
              } else {
                router.back();
              }
            }
          }
        ]);
      } else {
        // Create new post
        await createPost(formData);
        Alert.alert('Success', 'Post created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setContent('');
              setSelectedImages([]);
              setIsPrivate(false);
              if (onPostCreated) {
                onPostCreated();
              } else {
                router.back();
              }
            }
          }
        ]);
      }
    } catch (error: any) {
      console.error('Create post error:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          'Failed to create post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (formatType: 'bold' | 'italic' | 'underline' | 'list' | 'link') => {
    // Basic text formatting - in a real app, you'd use a rich text editor
    const selection = content.slice(-50); // Get last 50 chars for context

    switch (formatType) {
      case 'bold':
        setContent(content + '**bold text**');
        break;
      case 'italic':
        setContent(content + '*italic text*');
        break;
      case 'underline':
        setContent(content + '<u>underlined text</u>');
        break;
      case 'list':
        setContent(content + '\n- List item');
        break;
      case 'link':
        setContent(content + '[link text](https://example.com)');
        break;
    }
  };

  const privacyOptions = [
    { label: 'Public', value: false, description: 'Anyone can see this post' },
    { label: 'Private', value: true, description: 'Only you can see this post' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: colors.tabIconDefault,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: colors.tabIconDefault + '20',
            }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
          }}>
            Create Post
          </Text>

          <TouchableOpacity
            onPress={handleCreatePost}
            disabled={isLoading || !title.trim()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: (isLoading || !title.trim()) ? colors.tabIconDefault : colors.tint,
              opacity: (isLoading || !title.trim()) ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 14,
              }}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            }}>
              Title *
            </Text>
            <TextInput
              placeholder="What's your post about?"
              placeholderTextColor={colors.tabIconDefault}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) {
                  setErrors({ ...errors, title: '' });
                }
              }}
              style={{
                borderWidth: 1,
                borderColor: errors.title ? '#ff4444' : colors.tabIconDefault,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                minHeight: 50,
              }}
              maxLength={150}
              multiline
            />
            {errors.title && (
              <Text style={{
                color: '#ff4444',
                fontSize: 14,
                marginTop: 4,
              }}>
                {errors.title}
              </Text>
            )}
            <Text style={{
              color: colors.tabIconDefault,
              fontSize: 12,
              marginTop: 4,
              textAlign: 'right',
            }}>
              {title.length}/150
            </Text>
          </View>

          {/* Content Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            }}>
              Content
            </Text>

            {/* Formatting Toolbar */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: 12,
              padding: 12,
              backgroundColor: colors.tabIconDefault + '10',
              borderRadius: 12,
            }}>
              <TouchableOpacity
                onPress={() => formatText('bold')}
                style={{
                  padding: 8,
                  margin: 2,
                  borderRadius: 8,
                  backgroundColor: colors.tabIconDefault + '20',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: colors.text,
                }}>
                  B
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => formatText('italic')}
                style={{
                  padding: 8,
                  margin: 2,
                  borderRadius: 8,
                  backgroundColor: colors.tabIconDefault + '20',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: colors.text,
                }}>
                  I
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => formatText('underline')}
                style={{
                  padding: 8,
                  margin: 2,
                  borderRadius: 8,
                  backgroundColor: colors.tabIconDefault + '20',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  textDecorationLine: 'underline',
                  color: colors.text,
                }}>
                  U
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => formatText('list')}
                style={{
                  padding: 8,
                  margin: 2,
                  borderRadius: 8,
                  backgroundColor: colors.tabIconDefault + '20',
                }}
              >
                <Ionicons name="list" size={20} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => formatText('link')}
                style={{
                  padding: 8,
                  margin: 2,
                  borderRadius: 8,
                  backgroundColor: colors.tabIconDefault + '20',
                }}
              >
                <Ionicons name="link" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.tabIconDefault}
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (errors.content) {
                  setErrors({ ...errors, content: '' });
                }
              }}
              style={{
                borderWidth: 1,
                borderColor: errors.content ? '#ff4444' : colors.tabIconDefault,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
              maxLength={5000}
              multiline
              numberOfLines={6}
            />
            {errors.content && (
              <Text style={{
                color: '#ff4444',
                fontSize: 14,
                marginTop: 4,
              }}>
                {errors.content}
              </Text>
            )}
            <Text style={{
              color: colors.tabIconDefault,
              fontSize: 12,
              marginTop: 4,
              textAlign: 'right',
            }}>
              {content.length}/5000
            </Text>
          </View>

          {/* Image Upload */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 12,
            }}>
              Media
            </Text>

            {selectedImages.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {selectedImages.map((imageUri, index) => (
                      <View key={index} style={{ position: 'relative' }}>
                        <Image
                          source={{ uri: imageUri }}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            backgroundColor: colors.tabIconDefault + '20',
                          }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            padding: 4,
                            borderRadius: 12,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                          }}
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <Text style={{
                  color: colors.tabIconDefault,
                  fontSize: 12,
                  textAlign: 'center',
                }}>
                  {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
                </Text>
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                gap: 12,
                marginBottom: 12,
              }}>
                <TouchableOpacity
                  onPress={pickImage}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.tabIconDefault,
                    borderRadius: 12,
                    borderStyle: 'dashed',
                    backgroundColor: colors.tabIconDefault + '10',
                  }}
                >
                  <Ionicons name="images" size={24} color={colors.tint} />
                  <Text style={{
                    marginLeft: 8,
                    color: colors.tint,
                    fontWeight: '600',
                  }}>
                    Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={takePhoto}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.tabIconDefault,
                    borderRadius: 12,
                    borderStyle: 'dashed',
                    backgroundColor: colors.tabIconDefault + '10',
                  }}
                >
                  <Ionicons name="camera" size={24} color={colors.tint} />
                  <Text style={{
                    marginLeft: 8,
                    color: colors.tint,
                    fontWeight: '600',
                  }}>
                    Camera
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Privacy Settings */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderWidth: 1,
                borderColor: colors.tabIconDefault,
                borderRadius: 12,
                backgroundColor: colors.background,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={isPrivate ? "lock-closed" : "globe"}
                  size={24}
                  color={colors.text}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                  }}>
                    {isPrivate ? 'Private' : 'Public'}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.tabIconDefault,
                  }}>
                    {isPrivate ? 'Only you can see this post' : 'Anyone can see this post'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
          </View>

          {/* Formatting Help */}
          <View style={{
            padding: 16,
            backgroundColor: colors.tabIconDefault + '10',
            borderRadius: 12,
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            }}>
              Formatting Tips
            </Text>
            <Text style={{
              fontSize: 12,
              color: colors.tabIconDefault,
              lineHeight: 18,
            }}>
              • Use **bold** for emphasis{'\n'}
              • Use *italic* for stress{'\n'}
              • Use [text](url) for links{'\n'}
              • Use - for lists
            </Text>
          </View>

          {/* Post Button */}
          <TouchableOpacity
            onPress={handleCreatePost}
            disabled={isLoading || !title.trim()}
            style={{
              backgroundColor: (isLoading || !title.trim()) ? colors.tabIconDefault : colors.tint,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 20,
              opacity: (isLoading || !title.trim()) ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
              }}>
                {isEditing ? 'Update Post' : 'Create Post'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Privacy Modal */}
        <Modal
          visible={showPrivacyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPrivacyModal(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '50%',
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.text,
                }}>
                  Post Privacy
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPrivacyModal(false)}
                  style={{
                    padding: 8,
                    borderRadius: 20,
                    backgroundColor: colors.tabIconDefault + '20',
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {privacyOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => {
                    setIsPrivate(option.value);
                    setShowPrivacyModal(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    marginBottom: 8,
                    borderRadius: 12,
                    backgroundColor: isPrivate === option.value ? colors.tint + '20' : colors.tabIconDefault + '10',
                  }}
                >
                  <Ionicons
                    name={option.value ? "lock-closed" : "globe"}
                    size={24}
                    color={isPrivate === option.value ? colors.tint : colors.text}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.text,
                    }}>
                      {option.label}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: colors.tabIconDefault,
                    }}>
                      {option.description}
                    </Text>
                  </View>
                  {isPrivate === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePost;
