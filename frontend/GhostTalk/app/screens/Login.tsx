import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { loginUser } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const scheme = useColorScheme();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await loginUser(username, password);
  await AsyncStorage.setItem('token', response.data.token);
  router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: Colors[scheme ?? 'light'].background }}>
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Image source={require('../../assets/images/icon.png')} style={{ width: 72, height: 72, borderRadius: 16 }} />
      </View>
      {/* Segmented control */}
      <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: Colors[scheme ?? 'light'].icon }}>
        <TouchableOpacity onPress={() => setMode('signin')} style={{ flex: 1, backgroundColor: mode==='signin'? Colors[scheme ?? 'light'].primary : 'transparent', paddingVertical: 10 }}>
          <Text style={{ textAlign: 'center', color: mode==='signin' ? 'white' : Colors[scheme ?? 'light'].text, fontWeight: '600' }}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/screens/Register')} style={{ flex: 1, backgroundColor: mode==='signup'? Colors[scheme ?? 'light'].primary : 'transparent', paddingVertical: 10 }}>
          <Text style={{ textAlign: 'center', color: mode==='signup' ? 'white' : Colors[scheme ?? 'light'].text, fontWeight: '600' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 22, marginBottom: 8, color: Colors[scheme ?? 'light'].text, fontWeight: '700' }}>Welcome back 👋</Text>
      <Text style={{ marginBottom: 16, color: Colors[scheme ?? 'light'].icon }}>Sign in to continue</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: Colors[scheme ?? 'light'].primary, padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Implement password reset flow')} style={{ marginTop: 12 }}>
        <Text style={{ textAlign: 'center', color: Colors[scheme ?? 'light'].highlight }}>Forgot password?</Text>
      </TouchableOpacity>
  <TouchableOpacity onPress={() => router.push('/screens/Register')} style={{ marginTop: 10 }}>
        <Text style={{ textAlign: 'center', color: Colors[scheme ?? 'light'].highlight }}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
