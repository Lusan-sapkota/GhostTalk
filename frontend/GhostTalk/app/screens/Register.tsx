import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerUser } from '../api';
import { useRouter } from 'expo-router';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const scheme = useColorScheme();
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await registerUser(username, email, password);
      Alert.alert('Success', 'Account created');
      router.push('/screens/Login');
    } catch (error) {
      Alert.alert('Error', 'Registration failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <Text style={{ fontSize: 28, marginBottom: 20, color: Colors[scheme ?? 'light'].text, fontWeight: '700' }}>Create account ✨</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <TouchableOpacity onPress={handleRegister} style={{ backgroundColor: Colors[scheme ?? 'light'].primary, padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/screens/Login')} style={{ marginTop: 10 }}>
        <Text style={{ textAlign: 'center', color: Colors[scheme ?? 'light'].highlight }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Register;
