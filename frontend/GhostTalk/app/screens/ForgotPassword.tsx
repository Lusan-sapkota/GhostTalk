import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestPasswordReset, validationUtils } from '../api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [success, setSuccess] = useState(false);
  const scheme = useColorScheme();
  const router = useRouter();

  const validateEmail = () => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailValidation = validationUtils.validateEmailFormat(email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const response = await requestPasswordReset(email);

      // Extract user_id from response
      const userId = response.data?.user_id;

      setSuccess(true);
      setTimeout(() => {
        router.push({
          pathname: '/screens/PasswordResetOTP',
          params: { email, user_id: userId }
        });
      }, 2000);

    } catch (error: any) {
      console.error('Password reset request error:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.non_field_errors?.[0] ||
                          error.response?.data?.detail ||
                          'Failed to send password reset email. Please try again.';

      if (error.response?.status === 400) {
        setErrors({ email: 'No account found with this email address' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many requests. Please try again later.' });
      } else {
        Alert.alert('Request Failed', errorMessage);
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
          Reset Password
        </Text>
        <Text
          style={{
            marginBottom: 24,
            color: Colors[scheme ?? 'light'].icon,
            textAlign: 'center',
            lineHeight: 20
          }}
        >
          Enter your email address and we'll send you a verification code to reset your password
        </Text>

        {/* Success Message */}
        {success && (
          <View style={{
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <Text style={{ color: '#155724', textAlign: 'center' }}>
              ✅ Password reset code sent! Check your email and proceed to verification.
            </Text>
          </View>
        )}

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

        {/* Email Input */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearErrors();
              }}
              style={{
                borderWidth: 1,
                padding: 12,
                paddingRight: 50,
                borderRadius: 10,
                color: Colors[scheme ?? 'light'].text,
                borderColor: errors.email ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
                backgroundColor: Colors[scheme ?? 'light'].background,
                fontSize: 16
              }}
              placeholderTextColor={Colors[scheme ?? 'light'].icon}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              accessible={true}
              accessibilityLabel="Email input field"
              accessibilityHint="Enter your email address for password reset"
              editable={!isLoading && !success}
            />
            <View style={{ position: 'absolute', right: 10, top: 12 }}>
              <Ionicons
                name="mail"
                size={20}
                color={Colors[scheme ?? 'light'].icon}
              />
            </View>
          </View>
          {errors.email && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.email}
            </Text>
          )}
        </View>

        {/* Send Reset Code Button */}
        <TouchableOpacity
          onPress={handleRequestReset}
          disabled={isLoading || success}
          style={{
            backgroundColor: (isLoading || success) ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
            padding: 12,
            borderRadius: 10,
            opacity: (isLoading || success) ? 0.7 : 1,
            marginBottom: 16
          }}
          accessible={true}
          accessibilityLabel="Send reset code button"
          accessibilityState={{ disabled: isLoading || success }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : success ? (
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 16
            }}>
              Code Sent! Redirecting...
            </Text>
          ) : (
            <Text style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 16
            }}>
              Send Reset Code
            </Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isLoading}
          style={{ marginTop: 8 }}
          accessible={true}
          accessibilityLabel="Back to login button"
        >
          <Text style={{
            textAlign: 'center',
            color: Colors[scheme ?? 'light'].highlight,
            fontSize: 14
          }}>
            ← Back to Login
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: Colors[scheme ?? 'light'].background === '#ffffff' ? '#f8f9fa' : '#2c2c2e',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: Colors[scheme ?? 'light'].icon
        }}>
          <Text style={{
            fontSize: 14,
            color: Colors[scheme ?? 'light'].text,
            textAlign: 'center',
            lineHeight: 20
          }}>
            <Ionicons name="information-circle" size={16} color={Colors[scheme ?? 'light'].icon} />
            {' '}Need help? Make sure to check your spam/junk folder if you don't see the reset email.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
