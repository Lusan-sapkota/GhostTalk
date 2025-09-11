import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updateProfile, setupProfile } from '../api';

const SetupProfile: React.FC = () => {
  const [bio, setBio] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const scheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const email = params.email as string;

  const colors = Colors[scheme ?? 'light'];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (bio.length > 350) {
      newErrors.bio = 'Bio must be less than 350 characters';
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formData = new FormData();

      if (bio.trim()) {
        formData.append('bio', bio.trim());
      }

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      // Use setupProfile for newly verified users (no auth required)
      const response = await setupProfile(userId, formData);

      if (response.status === 200) {
        Alert.alert('Success', 'Profile setup completed!', [
          { text: 'OK', onPress: () => router.push('/screens/Login') }
        ]);
      }
    } catch (error: any) {
      console.error('Profile setup error:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.bio?.[0] ||
                          error.response?.data?.image?.[0] ||
                          'Failed to save profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup',
      'You can set up your bio and profile picture later from your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.push('/screens/Login') }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingVertical: 40,
          backgroundColor: colors.background
        }}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 72, height: 72, borderRadius: 16 }}
          />
        </View>

        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8
        }}>
          Set Up Your Profile
        </Text>

        <Text style={{
          fontSize: 16,
          color: colors.icon,
          textAlign: 'center',
          marginBottom: 32
        }}>
          Add a bio and profile picture to personalize your account
        </Text>

        {/* Profile Image Section */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            onPress={pickImage}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.icon,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 2,
              borderColor: colors.primary,
              borderStyle: 'dashed',
            }}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
            ) : (
              <Ionicons name="camera" size={40} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {selectedImage ? 'Change Photo' : 'Add Profile Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bio Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8
          }}>
            Bio (Optional)
          </Text>

          <TextInput
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={350}
            style={{
              borderWidth: 1,
              borderColor: colors.icon,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.background,
              textAlignVertical: 'top',
              minHeight: 100,
            }}
            placeholderTextColor={colors.icon}
          />

          {errors.bio && (
            <Text style={{ color: 'red', fontSize: 14, marginTop: 4 }}>
              {errors.bio}
            </Text>
          )}

          <Text style={{
            color: colors.icon,
            fontSize: 12,
            textAlign: 'right',
            marginTop: 4
          }}>
            {bio.length}/350
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 16 }}>
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? colors.icon : colors.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Save & Continue
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            style={{
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.icon,
            }}
          >
            <Text style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '600'
            }}>
              Skip for Now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SetupProfile;
