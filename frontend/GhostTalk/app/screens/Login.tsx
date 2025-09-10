import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { loginUser, authUtils, validationUtils } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [useEmail, setUseEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const scheme = useColorScheme();
  const router = useRouter();

  const validateInputs = () => {
    const newErrors: {[key: string]: string} = {};

    if (!usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = useEmail ? 'Email is required' : 'Username is required';
    } else if (useEmail) {
      const emailValidation = validationUtils.validateEmailFormat(usernameOrEmail);
      if (!emailValidation.isValid) {
        newErrors.usernameOrEmail = emailValidation.error!;
      }
    } else if (!useEmail && usernameOrEmail.length < 3) {
      newErrors.usernameOrEmail = 'Username must be at least 3 characters';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await loginUser(usernameOrEmail, password);

      // Store authentication data securely
      await authUtils.setAuthData(response.data.token, response.data.user);

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.non_field_errors?.[0] ||
                          error.response?.data?.detail ||
                          error.response?.data?.username?.[0] ||
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.password?.[0] ||
                          'Login failed. Please check your credentials and try again.';

      if (error.response?.status === 400) {
        // Handle field-specific errors
        const fieldErrors: {[key: string]: string} = {};

        // Handle form_errors structure
        if (error.response.data?.form_errors) {
          Object.keys(error.response.data.form_errors).forEach(field => {
            const errorValue = error.response.data.form_errors[field];
            fieldErrors[field] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
          });
        }

        // Handle legacy error structure
        if (error.response.data?.username) {
          fieldErrors.usernameOrEmail = Array.isArray(error.response.data.username)
            ? error.response.data.username[0]
            : error.response.data.username;
        }
        if (error.response.data?.email) {
          fieldErrors.usernameOrEmail = Array.isArray(error.response.data.email)
            ? error.response.data.email[0]
            : error.response.data.email;
        }
        if (error.response.data?.password) {
          fieldErrors.password = Array.isArray(error.response.data.password)
            ? error.response.data.password[0]
            : error.response.data.password;
        }

        // Handle non-field errors
        if (error.response.data?.non_field_errors) {
          const nonFieldError = Array.isArray(error.response.data.non_field_errors)
            ? error.response.data.non_field_errors[0]
            : error.response.data.non_field_errors;
          fieldErrors.general = nonFieldError;
        }

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorMessage });
        }
      } else if (error.response?.status === 401) {
        setErrors({ general: 'Invalid username/email or password.' });
      } else if (error.response?.status === 403) {
        setErrors({ general: 'Account is disabled or not verified.' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many login attempts. Please try again later.' });
      } else if (error.response?.status === 500) {
        setErrors({ general: 'Server error. Please try again later.' });
      } else if (!error.response) {
        setErrors({ general: 'Network error. Please check your connection.' });
      } else {
        Alert.alert('Login Failed', errorMessage);
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

        {/* Segmented control */}
        <View style={{
          flexDirection: 'row',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: Colors[scheme ?? 'light'].icon
        }}>
          <TouchableOpacity
            onPress={() => setMode('signin')}
            style={{
              flex: 1,
              backgroundColor: mode === 'signin' ? Colors[scheme ?? 'light'].primary : 'transparent',
              paddingVertical: 10
            }}
            accessible={true}
            accessibilityLabel="Sign In Tab"
            accessibilityState={{ selected: mode === 'signin' }}
          >
            <Text style={{
              textAlign: 'center',
              color: mode === 'signin' ? 'white' : Colors[scheme ?? 'light'].text,
              fontWeight: '600'
            }}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/screens/Register')}
            style={{
              flex: 1,
              backgroundColor: mode === 'signup' ? Colors[scheme ?? 'light'].primary : 'transparent',
              paddingVertical: 10
            }}
            accessible={true}
            accessibilityLabel="Sign Up Tab"
            accessibilityState={{ selected: mode === 'signup' }}
          >
            <Text style={{
              textAlign: 'center',
              color: mode === 'signup' ? 'white' : Colors[scheme ?? 'light'].text,
              fontWeight: '600'
            }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: 22,
            marginBottom: 8,
            color: Colors[scheme ?? 'light'].text,
            fontWeight: '700'
          }}
          accessible={true}
          accessibilityRole="header"
        >
          Welcome, Ghost
        </Text>
        <Text
          style={{
            marginBottom: 16,
            color: Colors[scheme ?? 'light'].icon
          }}
        >
          Sign in to continue your whispers
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

        {/* Username/Email Input */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder={useEmail ? "Email" : "Username"}
              value={usernameOrEmail}
              onChangeText={(text) => {
                setUsernameOrEmail(text);
                clearErrors();
              }}
              style={{
                borderWidth: 1,
                padding: 12,
                paddingRight: 50,
                borderRadius: 10,
                color: Colors[scheme ?? 'light'].text,
                borderColor: errors.usernameOrEmail ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
                backgroundColor: Colors[scheme ?? 'light'].background,
                fontSize: 16
              }}
              placeholderTextColor={Colors[scheme ?? 'light'].icon}
              autoCapitalize={useEmail ? 'none' : 'none'}
              autoCorrect={false}
              keyboardType={useEmail ? 'email-address' : 'default'}
              textContentType={useEmail ? 'emailAddress' : 'username'}
              accessible={true}
              accessibilityLabel={useEmail ? "Email input field" : "Username input field"}
              accessibilityHint={useEmail ? "Enter your email address" : "Enter your username"}
            />
            <TouchableOpacity
              onPress={() => {
                setUseEmail(!useEmail);
                setUsernameOrEmail('');
                clearErrors();
              }}
              style={{ position: 'absolute', right: 10, top: 12 }}
              accessible={true}
              accessibilityLabel={`Switch to ${useEmail ? 'username' : 'email'} input`}
            >
              <Ionicons
                name={useEmail ? "person" : "mail"}
                size={20}
                color={Colors[scheme ?? 'light'].icon}
              />
            </TouchableOpacity>
          </View>
          {errors.usernameOrEmail && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.usernameOrEmail}
            </Text>
          )}
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Password"
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
              textContentType="password"
              accessible={true}
              accessibilityLabel="Password input field"
              accessibilityHint="Enter your password"
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

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
            padding: 12,
            borderRadius: 10,
            opacity: isLoading ? 0.7 : 1
          }}
          accessible={true}
          accessibilityLabel="Login button"
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
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity
          onPress={() => router.push('/screens/ForgotPassword')}
          style={{ marginTop: 12 }}
          accessible={true}
          accessibilityLabel="Forgot password link"
        >
          <Text style={{
            textAlign: 'center',
            color: Colors[scheme ?? 'light'].highlight,
            fontSize: 14
          }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
