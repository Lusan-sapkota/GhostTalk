import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Post, Comment, getPostDetail } from '../app/api';
import { API_BASE_URL } from '../app/api';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import CommentSection from './CommentSection';

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
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
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

  const fetchComments = async () => {
    if (comments.length > 0) return; // Already loaded
    setLoadingComments(true);
    try {
      const response = await getPostDetail(post.id);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleRefreshComments = async () => {
    try {
      const response = await getPostDetail(post.id);
      setComments(response.data.comments || []);
      // Update the post's comments_count if it changed
      if (response.data.comments_count !== undefined && response.data.comments_count !== post.comments_count) {
        // Note: This would require the parent to update the post object
        // For now, we'll just refresh the comments
      }
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  };

  const handleUserProfilePress = () => {
    if (post?.author?.id) {
      router.push({
        pathname: '/screens/PublicProfile' as any,
        params: { userId: post.author.id.toString() }
      });
    }
  };

  const handlePrivacy = () => {
    setShowMenu(false);
    if (onPrivacy) {
      onPrivacy(post);
    }
  };

  const renderFormattedText = (text: string, colors: any) => {
    if (!text) return null;

    // Use post ID as prefix for unique keys
    const keyPrefix = `post-${post.id}-`;
    let globalKey = 0;

  // Helper function to get unique key
  const getUniqueKey = () => `${keyPrefix}${globalKey++}`;

    // Define types for text parts
    interface TextPart {
      text: string;
      style?: any;
      key: string;
      isLink?: boolean;
      url?: string;
    }

    const parts: TextPart[] = [];
    // Normalize: collapse multiple blank lines and Windows newlines
    let remainingText = text.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n');

    // Handle lists first (lines starting with - )
    const lines = remainingText.split('\n');
    const processedLines = lines.map((line) => {
      if (line.trim().startsWith('- ')) {
        return '• ' + line.trim().substring(2);
      }
      return line;
    });
    remainingText = processedLines.join('\n');

    // Simple processing: split by formatting markers and create parts
    const segments = remainingText.split(/(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|\[.*?\]\(.*?\))/g);

    segments.forEach((segment) => {
      if (!segment) return;

      if (segment.startsWith('**') && segment.endsWith('**')) {
        // Bold text
        parts.push({
          text: segment.slice(2, -2),
          style: { fontWeight: 'bold' },
          key: getUniqueKey()
        });
      } else if (segment.startsWith('*') && segment.endsWith('*') && !segment.startsWith('**')) {
        // Italic text
        parts.push({
          text: segment.slice(1, -1),
          style: { fontStyle: 'italic' },
          key: getUniqueKey()
        });
      } else if (segment.startsWith('<u>') && segment.endsWith('</u>')) {
        // Underlined text
        parts.push({
          text: segment.slice(3, -4),
          style: { textDecorationLine: 'underline' },
          key: getUniqueKey()
        });
      } else if (segment.match(/\[.*?\]\(.*?\)/)) {
        // Link
        const match = segment.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          parts.push({
            text: match[1],
            style: { color: colors.tint, textDecorationLine: 'underline' },
            key: getUniqueKey(),
            isLink: true,
            url: match[2]
          });
        }
      } else {
        // Regular text
        parts.push({
          text: segment,
          key: getUniqueKey()
        });
      }
    });

    // Merge adjacent parts with the same style to reduce fragmentation
    const mergedParts: TextPart[] = [];
    parts.forEach((part) => {
      const lastPart = mergedParts[mergedParts.length - 1];
      if (lastPart &&
          JSON.stringify(lastPart.style) === JSON.stringify(part.style) &&
          lastPart.isLink === part.isLink &&
          lastPart.url === part.url) {
        // Merge with previous part
        lastPart.text += part.text;
      } else {
        // Add as new part
        mergedParts.push({ ...part });
      }
    });

    // Render as a single parent Text with inline styled spans to avoid gaps
    return (
      <Text key={`${keyPrefix}root`} style={{ color: colors.text, fontSize: 15, lineHeight: 19 }}>
        {mergedParts.map(part => (
          <Text
            key={part.key}
            style={part.style}
            onPress={part.isLink ? () => {
              if (part.url) {
                Linking.openURL(part.url).catch(err => {
                  console.error('Failed to open URL:', err);
                  Alert.alert('Error', 'Could not open link');
                });
              }
            } : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#222' : '#eee', backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleUserProfilePress}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tint + '55', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>{initials}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUserProfilePress}>
            <View>
              <Text style={{ fontWeight: '700', color: colors.text }}>{authorName}</Text>
              <Text style={{ fontSize: 11, color: colors.tabIconDefault }}>{new Date(post.date_posted).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
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
      {/* Use a View instead of TouchableOpacity so text selection works; keep onPress on parent container via onStartShouldSetResponder */}
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => onPress(post)}
      >
        {!!post.title && <Text selectable style={{ fontSize: 16, fontWeight: '700', marginTop: 4, color: colors.text }}>{post.title}</Text>}
        {!!post.content && (
          <View style={{ marginTop: 4 }}>
            {renderFormattedText(post.content, colors)}
          </View>
        )}
        {/* Display images */}
        {(post.image || (post.images && post.images.length > 0)) && (
          <View style={{ marginTop: 8 }}>
            {post.images && post.images.length > 1 ? (
              // Multiple images - show in grid or carousel
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {post.images.map((imageUri, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedImageIndex(index);
                        setShowImageModal(true);
                      }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        backgroundColor: scheme === 'dark' ? '#222' : '#f0f0f0',
                      }}
                    >
                      <Image
                        source={{
                          uri: imageUri.startsWith('http')
                            ? imageUri
                            : `${API_BASE_URL}${imageUri.startsWith('/') ? '' : '/'}${imageUri}`
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 8,
                        }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              // Single image
              <TouchableOpacity
                onPress={() => setShowImageModal(true)}
              >
                <Image
                  source={{
                    uri: (() => {
                      const imageUri = (post.images && post.images[0]) || post.image;
                      if (!imageUri) return '';
                      return imageUri.startsWith('http')
                        ? imageUri
                        : `${API_BASE_URL}${imageUri.startsWith('/') ? '' : '/'}${imageUri}`;
                    })()
                  }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
                    backgroundColor: scheme === 'dark' ? '#222' : '#f0f0f0'
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Footer actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 }}>
        <TouchableOpacity onPress={() => onLike(post.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? colors.tint : colors.icon} />
          <Text style={{ color: colors.text }}>{post.likes_count}</Text>
        </TouchableOpacity>
        {typeof post.comments_count === 'number' && (
          <TouchableOpacity onPress={handleToggleComments} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={showComments ? colors.tint : colors.icon} />
            <Text style={{ color: showComments ? colors.tint : colors.text }}>{post.comments_count}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={() => onShare && onShare(post)} 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name={post.shared ? 'share' : 'share-outline'} size={18} color={post.shared ? colors.tint : colors.icon} />
          <Text style={{ color: post.shared ? colors.tint : colors.text }}>{post.shares_count || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={comments}
          onRefresh={handleRefreshComments}
        />
      )}

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

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowImageModal(false)}
          >
            {/* Close button */}
            <TouchableOpacity
              style={{ position: 'absolute', top: 50, right: 20, zIndex: 1 }}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            {/* Navigation buttons for multiple images */}
            {post.images && post.images.length > 1 && (
              <>
                {selectedImageIndex > 0 && (
                  <TouchableOpacity
                    style={{ position: 'absolute', left: 20, top: '50%', zIndex: 1 }}
                    onPress={() => setSelectedImageIndex(selectedImageIndex - 1)}
                  >
                    <Ionicons name="chevron-back" size={30} color="white" />
                  </TouchableOpacity>
                )}
                {selectedImageIndex < post.images.length - 1 && (
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 20, top: '50%', zIndex: 1 }}
                    onPress={() => setSelectedImageIndex(selectedImageIndex + 1)}
                  >
                    <Ionicons name="chevron-forward" size={30} color="white" />
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Image counter */}
            {post.images && post.images.length > 1 && (
              <View style={{
                position: 'absolute',
                bottom: 30,
                alignSelf: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                zIndex: 1
              }}>
                <Text style={{ color: 'white', fontSize: 14 }}>
                  {selectedImageIndex + 1} / {post.images.length}
                </Text>
              </View>
            )}

            {/* Display current image */}
            {(() => {
              const currentImageUri = post.images
                ? post.images[selectedImageIndex]
                : post.image;

              if (!currentImageUri) return null;

              return (
                <Image
                  source={{
                    uri: currentImageUri.startsWith('http')
                      ? currentImageUri
                      : `${API_BASE_URL}${currentImageUri.startsWith('/') ? '' : '/'}${currentImageUri}`
                  }}
                  style={{
                    width: '90%',
                    height: '70%',
                    borderRadius: 8,
                  }}
                  resizeMode="contain"
                />
              );
            })()}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default PostItem;
