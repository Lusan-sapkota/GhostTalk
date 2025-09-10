import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import api, { registerUser } from '../api';
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
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

  // Check username availability
  const checkUsername = async (user: string) => {
    if (user.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }
    try {
      const response = await api.get(`/user/check-username/?username=${user}`);
      setUsernameAvailable(response.data.available);
      if (!response.data.available) {
        setUsernameSuggestions([`${user}123`, `${user}_official`, `${user}2025`]);
      } else {
        setUsernameSuggestions([]);
      }
    } catch (error) {
      setUsernameAvailable(null);
    }
  };

  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password]);

  useEffect(() => {
    checkUsername(username);
  }, [username]);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (passwordStrength !== 'Strong password') {
      Alert.alert('Error', 'Password does not meet requirements');
      return;
    }
    if (usernameAvailable === false) {
      Alert.alert('Error', 'Username is not available');
      return;
    }
    try {
      const response = await registerUser(firstName, lastName, username, email, password);
      // Navigate to OTP verification screen with userId and email
      router.push({
        pathname: '/screens/OTPVerification',
        params: { userId: response.data.user_id, email: email }
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: Colors[scheme ?? 'light'].background }}>
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
      <Image source={require('../../assets/images/icon.png')} style={{ width: 72, height: 72, borderRadius: 16 }} />
      </View>
      {/* Segmented control */}
      <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: Colors[scheme ?? 'light'].icon }}>
        <TouchableOpacity onPress={() => router.push('/screens/Login')} style={{ flex: 1, backgroundColor: mode==='signin'? Colors[scheme ?? 'light'].primary : 'transparent', paddingVertical: 10 }}>
          <Text style={{ textAlign: 'center', color: mode==='signin' ? 'white' : Colors[scheme ?? 'light'].text, fontWeight: '600' }}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('signup')} style={{ flex: 1, backgroundColor: mode==='signup'? Colors[scheme ?? 'light'].primary : 'transparent', paddingVertical: 10 }}>
          <Text style={{ textAlign: 'center', color: mode==='signup' ? 'white' : Colors[scheme ?? 'light'].text, fontWeight: '600' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 22, marginBottom: 8, color: Colors[scheme ?? 'light'].text, fontWeight: '700' }}>Awaken a New Spirit</Text>
      <Text style={{ marginBottom: 16, color: Colors[scheme ?? 'light'].icon }}>Create your presence and start Whispering</Text>
            <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 10, color: Colors[scheme ?? 'light'].text, borderColor: Colors[scheme ?? 'light'].icon, backgroundColor: Colors[scheme ?? 'light'].background }}
        placeholderTextColor={Colors[scheme ?? 'light'].icon}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 10, color: Colors[scheme ?? 'light'].text, borderColor: Colors[scheme ?? 'light'].icon, backgroundColor: Colors[scheme ?? 'light'].background }}
        placeholderTextColor={Colors[scheme ?? 'light'].icon}
      />
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, marginBottom: 5, borderRadius: 10, color: Colors[scheme ?? 'light'].text, borderColor: Colors[scheme ?? 'light'].icon, backgroundColor: Colors[scheme ?? 'light'].background }}
        placeholderTextColor={Colors[scheme ?? 'light'].icon}
      />
      {username.length > 0 && (
        <Text style={{ fontSize: 12, marginBottom: 10, color: usernameAvailable === false ? 'red' : usernameAvailable === true ? 'green' : Colors[scheme ?? 'light'].icon }}>
          {usernameAvailable === false ? 'Username not available' : usernameAvailable === true ? 'Username available' : 'Checking...'}
        </Text>
      )}
      {usernameSuggestions.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: Colors[scheme ?? 'light'].icon }}>Suggestions:</Text>
          {usernameSuggestions.map((suggestion, index) => (
            <TouchableOpacity key={index} onPress={() => setUsername(suggestion)}>
              <Text style={{ fontSize: 12, color: Colors[scheme ?? 'light'].highlight, marginRight: 10 }}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 10, color: Colors[scheme ?? 'light'].text, borderColor: Colors[scheme ?? 'light'].icon, backgroundColor: Colors[scheme ?? 'light'].background }}
        placeholderTextColor={Colors[scheme ?? 'light'].icon}
      />
      <View style={{ position: 'relative', marginBottom: 5 }}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          style={{ borderWidth: 1, padding: 10, paddingRight: 50, borderRadius: 10, color: Colors[scheme ?? 'light'].text, borderColor: Colors[scheme ?? 'light'].icon, backgroundColor: Colors[scheme ?? 'light'].background }}
          placeholderTextColor={Colors[scheme ?? 'light'].icon}
        />
        <TouchableOpacity
          onPress={() => setPasswordVisible(!passwordVisible)}
          style={{ position: 'absolute', right: 10, top: 10 }}
        >
          <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={20} color={Colors[scheme ?? 'light'].icon} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowPasswordModal(true)}
          style={{ position: 'absolute', right: 40, top: 10 }}
        >
          <Ionicons name="help-circle" size={20} color={Colors[scheme ?? 'light'].icon} />
        </TouchableOpacity>
      </View>
      {password.length > 0 && (
        <Text style={{ fontSize: 12, marginBottom: 10, color: passwordStrength === 'Strong password' ? 'green' : 'red' }}>
          {passwordStrength}
        </Text>
      )}
      <View style={{ position: 'relative', marginBottom: 20 }}>
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!confirmPasswordVisible}
          style={{ borderWidth: 1, padding: 10, paddingRight: 50, borderRadius: 10, color: Colors[scheme ?? 'light'].text, borderColor: Colors[scheme ?? 'light'].icon, backgroundColor: Colors[scheme ?? 'light'].background }}
          placeholderTextColor={Colors[scheme ?? 'light'].icon}
        />
        <TouchableOpacity
          onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          style={{ position: 'absolute', right: 10, top: 10 }}
        >
          <Ionicons name={confirmPasswordVisible ? 'eye-off' : 'eye'} size={20} color={Colors[scheme ?? 'light'].icon} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleRegister} style={{ backgroundColor: Colors[scheme ?? 'light'].primary, padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Register</Text>
      </TouchableOpacity>

      {/* Password Requirements Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>Password Requirements</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors[scheme ?? 'light'].icon} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: Colors[scheme ?? 'light'].text, marginBottom: 10 }}>
              Your password must contain:
            </Text>
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 14, color: Colors[scheme ?? 'light'].text, marginBottom: 5 }}>• At least 8 characters</Text>
              <Text style={{ fontSize: 14, color: Colors[scheme ?? 'light'].text, marginBottom: 5 }}>• One uppercase letter (A-Z)</Text>
              <Text style={{ fontSize: 14, color: Colors[scheme ?? 'light'].text, marginBottom: 5 }}>• One lowercase letter (a-z)</Text>
              <Text style={{ fontSize: 14, color: Colors[scheme ?? 'light'].text, marginBottom: 5 }}>• One number (0-9)</Text>
              <Text style={{ fontSize: 14, color: Colors[scheme ?? 'light'].text, marginBottom: 5 }}>• One special character (!@#$%^&*)</Text>
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
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Register;
