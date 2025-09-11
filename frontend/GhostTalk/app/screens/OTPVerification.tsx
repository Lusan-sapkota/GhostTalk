import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { verifyOTP } from '../api';
import { useRouter, useLocalSearchParams } from 'expo-router';

const OTPVerification: React.FC = () => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const scheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const email = params.email as string;

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOTP(parseInt(userId), otpCode);
      if (response.data.status === 'verified') {
        Alert.alert('Success', 'Account verified successfully!', [
          { text: 'OK', onPress: () => router.push({
            pathname: '/screens/Profile',
            params: { userId: userId, email: email }
          }) }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    // Implement resend OTP logic here
    Alert.alert('OTP Resent', 'A new OTP has been sent to your email');
    setResendTimer(30);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: Colors[scheme ?? 'light'].background }}>
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Image source={require('../../assets/images/icon.png')} style={{ width: 72, height: 72, borderRadius: 16 }} />
      </View>

      <Text style={{ fontSize: 22, marginBottom: 8, color: Colors[scheme ?? 'light'].text, fontWeight: '700', textAlign: 'center' }}>Verify Your Account</Text>
      <Text style={{ marginBottom: 16, color: Colors[scheme ?? 'light'].icon, textAlign: 'center' }}>
        We've sent a 6-digit code to{'\n'}{email}
      </Text>

      <TextInput
        placeholder="Enter 6-digit OTP"
        value={otpCode}
        onChangeText={setOtpCode}
        keyboardType="numeric"
        maxLength={6}
        style={{
          borderWidth: 1,
          padding: 15,
          marginBottom: 20,
          borderRadius: 10,
          color: Colors[scheme ?? 'light'].text,
          borderColor: Colors[scheme ?? 'light'].icon,
          backgroundColor: Colors[scheme ?? 'light'].background,
          fontSize: 18,
          textAlign: 'center',
          letterSpacing: 8
        }}
        placeholderTextColor={Colors[scheme ?? 'light'].icon}
      />

      <TouchableOpacity
        onPress={handleVerifyOTP}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
          padding: 15,
          borderRadius: 10,
          marginBottom: 20
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors[scheme ?? 'light'].icon, fontSize: 14 }}>
          Didn't receive the code?
        </Text>
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={resendTimer > 0}
          style={{ marginLeft: 5 }}
        >
          <Text style={{
            color: resendTimer > 0 ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
            fontSize: 14,
            fontWeight: '600'
          }}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ marginTop: 20 }}
      >
        <Text style={{ textAlign: 'center', color: Colors[scheme ?? 'light'].highlight, fontSize: 14 }}>
          Change Email Address
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OTPVerification;
