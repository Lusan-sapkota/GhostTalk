import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import api, { registerUser, validationUtils } from '../api';
import { useRouter } from 'expo-router';

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const scheme = useColorScheme();
  const router = useRouter();

  // Password strength validation
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(pwd)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(pwd)) return 'Password must contain at least one special character';
    return 'Strong password';
  };

  const validateInputs = () => {
    const newErrors: {[key: string]: string} = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'This username is not available';
    } else if (usernameAvailable === null && username.length >= 3) {
      newErrors.username = 'Please wait for username availability check';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailValidation = validationUtils.validateEmailFormat(email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error!;
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validationUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.error!;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check username availability with debouncing
  const checkUsername = async (user: string) => {
    if (user.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameAvailable(null);

    try {
      const response = await api.get(`/user/check-username/?username=${encodeURIComponent(user)}`);
      const isAvailable = response.data.available;
      setUsernameAvailable(isAvailable);
      setIsCheckingUsername(false);

      if (!isAvailable) {
        // Generate better suggestions
        const baseUsername = user.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsernameSuggestions([
          `${baseUsername}123`,
          `${baseUsername}_${Math.floor(Math.random() * 100)}`,
          `${baseUsername}2025`,
          `${baseUsername}_official`
        ]);
      } else {
        setUsernameSuggestions([]);
      }
    } catch (error: any) {
      console.error('Username check error:', error);
      // If API fails, assume username is available to not block registration
      setUsernameAvailable(true);
      setUsernameSuggestions([]);
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      checkUsername(username);
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [username]);

  const handleRegister = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await registerUser(
        firstName.trim(),
        lastName.trim(),
        username.trim(),
        email.trim(),
        password
      );

      // Navigate to OTP verification screen with userId and email
      router.push({
        pathname: '/screens/OTPVerification',
        params: { userId: response.data.user_id, email: email.trim() }
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.username?.[0] ||
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.password1?.[0] ||
                          error.response?.data?.password2?.[0] ||
                          'Registration failed. Please try again.';

      if (error.response?.status === 400) {
        // Handle field-specific errors
        const fieldErrors: {[key: string]: string} = {};

        // Handle new form_errors structure from backend
        if (error.response.data?.form_errors) {
          Object.keys(error.response.data.form_errors).forEach(field => {
            const errorValue = error.response.data.form_errors[field];
            let fieldName = field;

            // Map backend field names to frontend field names
            if (field === 'password1') fieldName = 'password';
            if (field === 'password2') fieldName = 'confirmPassword';

            fieldErrors[fieldName] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
          });
        }

        // Handle legacy error structure
        if (error.response.data?.username) {
          fieldErrors.username = Array.isArray(error.response.data.username)
            ? error.response.data.username[0]
            : error.response.data.username;
        }
        if (error.response.data?.email) {
          fieldErrors.email = Array.isArray(error.response.data.email)
            ? error.response.data.email[0]
            : error.response.data.email;
        }
        if (error.response.data?.password1) {
          fieldErrors.password = Array.isArray(error.response.data.password1)
            ? error.response.data.password1[0]
            : error.response.data.password1;
        }
        if (error.response.data?.password2) {
          fieldErrors.confirmPassword = Array.isArray(error.response.data.password2)
            ? error.response.data.password2[0]
            : error.response.data.password2;
        }

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorMessage });
        }
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many registration attempts. Please try again later.' });
      } else if (error.response?.status === 500) {
        setErrors({ general: 'Server error. Please try again later.' });
      } else if (!error.response) {
        setErrors({ general: 'Network error. Please check your connection.' });
      } else {
        Alert.alert('Registration Failed', errorMessage);
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
            onPress={() => router.push('/screens/Login')}
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
            onPress={() => setMode('signup')}
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
          Awaken a New Spirit
        </Text>
        <Text
          style={{
            marginBottom: 16,
            color: Colors[scheme ?? 'light'].icon
          }}
        >
          Create your presence and start Whispering
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

        {/* First Name Input */}
        <View style={{ marginBottom: 10 }}>
          <TextInput
            placeholder="First Name"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              clearErrors();
            }}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 10,
              color: Colors[scheme ?? 'light'].text,
              borderColor: errors.firstName ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
              backgroundColor: Colors[scheme ?? 'light'].background,
              fontSize: 16
            }}
            placeholderTextColor={Colors[scheme ?? 'light'].icon}
            autoCapitalize="words"
            textContentType="givenName"
            accessible={true}
            accessibilityLabel="First name input field"
            accessibilityHint="Enter your first name"
          />
          {errors.firstName && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.firstName}
            </Text>
          )}
        </View>

        {/* Last Name Input */}
        <View style={{ marginBottom: 10 }}>
          <TextInput
            placeholder="Last Name"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              clearErrors();
            }}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 10,
              color: Colors[scheme ?? 'light'].text,
              borderColor: errors.lastName ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
              backgroundColor: Colors[scheme ?? 'light'].background,
              fontSize: 16
            }}
            placeholderTextColor={Colors[scheme ?? 'light'].icon}
            autoCapitalize="words"
            textContentType="familyName"
            accessible={true}
            accessibilityLabel="Last name input field"
            accessibilityHint="Enter your last name"
          />
          {errors.lastName && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.lastName}
            </Text>
          )}
        </View>

        {/* Username Input */}
        <View style={{ marginBottom: 10 }}>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              clearErrors();
            }}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 10,
              color: Colors[scheme ?? 'light'].text,
              borderColor: errors.username ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
              backgroundColor: Colors[scheme ?? 'light'].background,
              fontSize: 16
            }}
            placeholderTextColor={Colors[scheme ?? 'light'].icon}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            accessible={true}
            accessibilityLabel="Username input field"
            accessibilityHint="Enter your desired username"
          />
          {username.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{
                fontSize: 12,
                color: usernameAvailable === false ? '#e74c3c' :
                       usernameAvailable === true ? '#27ae60' :
                       isCheckingUsername ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].icon
              }}>
                {usernameAvailable === false ? 'Username not available' :
                 usernameAvailable === true ? 'Username available' :
                 isCheckingUsername ? 'Checking availability...' : 'Enter at least 3 characters'}
              </Text>
              {isCheckingUsername && (
                <Text style={{ fontSize: 12, color: Colors[scheme ?? 'light'].icon, marginLeft: 5 }}>
                  ⏳
                </Text>
              )}
            </View>
          )}
          {errors.username && (
            <Text style={{
              color: '#e74c3c',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4
            }}>
              {errors.username}
            </Text>
          )}
        </View>

        {/* Username Suggestions */}
        {usernameSuggestions.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, color: Colors[scheme ?? 'light'].icon, marginBottom: 4 }}>
              Suggestions:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {usernameSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setUsername(suggestion);
                    clearErrors();
                  }}
                  style={{
                    backgroundColor: Colors[scheme ?? 'light'].primary,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginRight: 8,
                    marginBottom: 4
                  }}
                  accessible={true}
                  accessibilityLabel={`Use username suggestion ${suggestion}`}
                >
                  <Text style={{ fontSize: 12, color: 'white' }}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Email Input */}
        <View style={{ marginBottom: 10 }}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearErrors();
            }}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 10,
              color: Colors[scheme ?? 'light'].text,
              borderColor: errors.email ? '#e74c3c' : Colors[scheme ?? 'light'].icon,
              backgroundColor: Colors[scheme ?? 'light'].background,
              fontSize: 16
            }}
            placeholderTextColor={Colors[scheme ?? 'light'].icon}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessible={true}
            accessibilityLabel="Email input field"
            accessibilityHint="Enter your email address"
          />
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

        {/* Password Input */}
        <View style={{ marginBottom: 5 }}>
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
              textContentType="newPassword"
              accessible={true}
              accessibilityLabel="Password input field"
              accessibilityHint="Enter your password"
            />
            <View style={{ position: 'absolute', right: 10, top: 12, flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(true)}
                style={{ marginRight: 8 }}
                accessible={true}
                accessibilityLabel="View password requirements"
              >
                <Ionicons
                  name="help-circle"
                  size={20}
                  color={Colors[scheme ?? 'light'].icon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
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
          </View>
          {password.length > 0 && (
            <Text style={{
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4,
              color: passwordStrength === 'Strong password' ? '#27ae60' : '#e74c3c'
            }}>
              {passwordStrength}
            </Text>
          )}
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
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Confirm Password"
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
              accessibilityHint="Re-enter your password to confirm"
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

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? Colors[scheme ?? 'light'].icon : Colors[scheme ?? 'light'].primary,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            opacity: isLoading ? 0.7 : 1
          }}
          accessible={true}
          accessibilityLabel="Register button"
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
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Password Requirements Modal */}
        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            <View style={{
              backgroundColor: Colors[scheme ?? 'light'].background,
              borderRadius: 12,
              padding: 20,
              margin: 20,
              borderWidth: 1,
              borderColor: Colors[scheme ?? 'light'].icon,
              maxWidth: 300,
              width: '80%'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: Colors[scheme ?? 'light'].text
                }}>
                  Password Requirements
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPasswordModal(false)}
                  accessible={true}
                  accessibilityLabel="Close password requirements modal"
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors[scheme ?? 'light'].icon}
                  />
                </TouchableOpacity>
              </View>
              <Text style={{
                fontSize: 14,
                color: Colors[scheme ?? 'light'].text,
                marginBottom: 10
              }}>
                Your password must contain:
              </Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={{
                  fontSize: 14,
                  color: Colors[scheme ?? 'light'].text,
                  marginBottom: 5
                }}>
                  • At least 8 characters
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors[scheme ?? 'light'].text,
                  marginBottom: 5
                }}>
                  • One uppercase letter (A-Z)
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors[scheme ?? 'light'].text,
                  marginBottom: 5
                }}>
                  • One lowercase letter (a-z)
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors[scheme ?? 'light'].text,
                  marginBottom: 5
                }}>
                  • One number (0-9)
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors[scheme ?? 'light'].text,
                  marginBottom: 5
                }}>
                  • One special character (!@#$%^&*)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={{
                  backgroundColor: Colors[scheme ?? 'light'].primary,
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 15,
                  alignSelf: 'flex-end'
                }}
                accessible={true}
                accessibilityLabel="Close modal"
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
