import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyPasswordResetOTP, requestPasswordReset } from '../api';

const PasswordResetOTP: React.FC = () => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const scheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const userId = params.user_id as string;

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const validateOTP = () => {
    const newErrors: {[key: string]: string} = {};

    if (!otpCode.trim()) {
      newErrors.otp = 'OTP code is required';
    } else if (otpCode.length !== 6) {
      newErrors.otp = 'Please enter a valid 6-digit OTP code';
    } else if (!/^\d{6}$/.test(otpCode)) {
      newErrors.otp = 'OTP code must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP()) {
      return;
    }

    if (!userId) {
      setErrors({ general: 'User ID is missing. Please restart the password reset process.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await verifyPasswordResetOTP(parseInt(userId), otpCode);

      if (response.data.status === 'verified') {
        router.push({
          pathname: '/screens/NewPassword',
          params: { email, otp_code: otpCode, user_id: userId }
        });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.non_field_errors?.[0] ||
                          error.response?.data?.detail ||
                          'Verification failed. Please check your OTP code.';

      if (error.response?.status === 400) {
        setErrors({ otp: 'Invalid or expired OTP code' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many attempts. Please try again later.' });
      } else {
        Alert.alert('Verification Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const response = await requestPasswordReset(email);
      const newUserId = response.data?.user_id;

      // Update userId if it changed (though it shouldn't)
      if (newUserId && newUserId !== userId) {
        // Note: This would require updating the params, but for now we'll keep the original
        console.log('User ID changed during resend:', newUserId);
      }

      Alert.alert('OTP Resent', 'A new verification code has been sent to your email');
      setResendTimer(30);
      setOtpCode('');
      setErrors({});
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
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
          Verify Code
        </Text>
        <Text
          style={{
            marginBottom: 24,
            color: Colors[scheme ?? 'light'].icon,
            textAlign: 'center',
            lineHeight: 20
          }}
        >
          We've sent a 6-digit verification code to{'\n'}{email}
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

        {/* OTP Input */}
        <View style={{ marginBottom: 20 }}>
          <TextInput
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChangeText={(text) => {
              setOtpCode(text.replace(/[^0-9]/g, ''));
              clearErrors();
            }}
            keyboardType="numeric"
            maxLength={6}
            style={{
              borderWidth: 1,
              padding: 15,
              borderRadius: 10,
              color: Colors[scheme ?? 'light'].text,
              borderColor: errors.otp ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
              backgroundColor: Colors[scheme ?? 'light'].background,
              fontSize: 18,
              textAlign: 'center',
              letterSpacing: 8
            }}
            placeholderTextColor={Colors[scheme ?? 'light'].icon}
            accessible={true}
            accessibilityLabel="OTP code input field"
            accessibilityHint="Enter the 6-digit verification code sent to your email"
            editable={!isLoading}
          />
          {errors.otp && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.otp}
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerifyOTP}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
            padding: 12,
            borderRadius: 10,
            opacity: isLoading ? 0.7 : 1,
            marginBottom: 16
          }}
          accessible={true}
          accessibilityLabel="Verify OTP button"
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
              Verify Code
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: Colors[scheme ?? 'light'].icon, fontSize: 14 }}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendTimer > 0 || isLoading}
            style={{ marginLeft: 5 }}
            accessible={true}
            accessibilityLabel="Resend OTP button"
            accessibilityState={{ disabled: resendTimer > 0 || isLoading }}
          >
            <Text style={{
              color: resendTimer > 0 ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
              fontSize: 14,
              fontWeight: '600'
            }}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>

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
            {' '}Check your spam/junk folder if you don't see the email. The code expires in 10 minutes.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PasswordResetOTP;
