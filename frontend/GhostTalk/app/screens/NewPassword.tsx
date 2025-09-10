import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../api';

const NewPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const scheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const otpCode = params.otp_code as string;
  const userId = params.user_id as string;

  const validatePasswords = () => {
    const newErrors: {[key: string]: string} = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    if (!userId) {
      setErrors({ general: 'User ID is missing. Please restart the password reset process.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await resetPassword(parseInt(userId), otpCode, password, confirmPassword);

      if (response.data.status === 'success') {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset successfully. You can now log in with your new password.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/screens/Login')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.non_field_errors?.[0] ||
                          error.response?.data?.detail ||
                          'Failed to reset password. Please try again.';

      if (error.response?.status === 400) {
        setErrors({ general: 'Invalid or expired verification code' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many attempts. Please try again later.' });
      } else {
        Alert.alert('Reset Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrors = () => {
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20 }}
        style={{ backgroundColor: Colors[scheme ?? 'light'].background }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 72, height: 72, borderRadius: 16 }}
            accessible={true}
            accessibilityLabel="GhostTalk App Logo"
          />
        </View>

        <Text
          style={{
            fontSize: 22,
            marginBottom: 8,
            color: Colors[scheme ?? 'light'].text,
            fontWeight: '700',
            textAlign: 'center'
          }}
          accessible={true}
          accessibilityRole="header"
        >
          New Password
        </Text>
        <Text
          style={{
            marginBottom: 24,
            color: Colors[scheme ?? 'light'].icon,
            textAlign: 'center',
            lineHeight: 20
          }}
        >
          Create a strong password for your account
        </Text>

        {/* General Error Message */}
        {errors.general && (
          <View style={{
            backgroundColor: '#fee',
            borderColor: '#fcc',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <Text style={{ color: '#c33', textAlign: 'center' }}>
              {errors.general}
            </Text>
          </View>
        )}

        {/* Password Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: Colors[scheme ?? 'light'].text,
            marginBottom: 8
          }}>
            New Password
          </Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Enter new password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearErrors();
              }}
              secureTextEntry={!passwordVisible}
              style={{
                borderWidth: 1,
                padding: 12,
                paddingRight: 50,
                borderRadius: 10,
                color: Colors[scheme ?? 'light'].text,
                borderColor: errors.password ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
                backgroundColor: Colors[scheme ?? 'light'].background,
                fontSize: 16
              }}
              placeholderTextColor={Colors[scheme ?? 'light'].icon}
              textContentType="newPassword"
              accessible={true}
              accessibilityLabel="New password input field"
              accessibilityHint="Enter your new password"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={{ position: 'absolute', right: 10, top: 12 }}
              accessible={true}
              accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={passwordVisible ? 'eye' : 'eye-off'}
                size={20}
                color={Colors[scheme ?? 'light'].icon}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.password}
            </Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: Colors[scheme ?? 'light'].text,
            marginBottom: 8
          }}>
            Confirm Password
          </Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearErrors();
              }}
              secureTextEntry={!confirmPasswordVisible}
              style={{
                borderWidth: 1,
                padding: 12,
                paddingRight: 50,
                borderRadius: 10,
                color: Colors[scheme ?? 'light'].text,
                borderColor: errors.confirmPassword ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
                backgroundColor: Colors[scheme ?? 'light'].background,
                fontSize: 16
              }}
              placeholderTextColor={Colors[scheme ?? 'light'].icon}
              textContentType="newPassword"
              accessible={true}
              accessibilityLabel="Confirm password input field"
              accessibilityHint="Re-enter your new password to confirm"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={{ position: 'absolute', right: 10, top: 12 }}
              accessible={true}
              accessibilityLabel={confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
            >
              <Ionicons
                name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                size={20}
                color={Colors[scheme ?? 'light'].icon}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Password Requirements */}
        <View style={{
          backgroundColor: Colors[scheme ?? 'light'].background === '#ffffff' ? '#f8f9fa' : '#2c2c2e',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: Colors[scheme ?? 'light'].icon
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: Colors[scheme ?? 'light'].text,
            marginBottom: 8
          }}>
            Password Requirements:
          </Text>
          <Text style={{
            fontSize: 12,
            color: Colors[scheme ?? 'light'].icon,
            lineHeight: 18
          }}>
            • At least 8 characters long{'\n'}
            • Contains uppercase and lowercase letters{'\n'}
            • Contains at least one number
          </Text>
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
            padding: 12,
            borderRadius: 10,
            opacity: isLoading ? 0.7 : 1,
            marginBottom: 16
          }}
          accessible={true}
          accessibilityLabel="Reset password button"
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 16
            }}>
              Reset Password
            </Text>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isLoading}
          style={{ marginTop: 8 }}
          accessible={true}
          accessibilityLabel="Back button"
        >
          <Text style={{
            textAlign: 'center',
            color: Colors[scheme ?? 'light'].highlight,
            fontSize: 14
          }}>
            ← Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NewPassword;
