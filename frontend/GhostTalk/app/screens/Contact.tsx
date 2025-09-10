import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message fields.');
      return;
    }

    // For now, just show a success message
    // In a real app, this would send the message to the backend
    Alert.alert(
      'Message Sent',
      'Thank you for your message. We will get back to you soon!',
      [
        {
          text: 'OK',
          onPress: () => {
            setSubject('');
            setMessage('');
            router.back();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors[scheme ?? 'light'].icon + '20' }]}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={Colors[scheme ?? 'light'].text}
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.headerTitle, { color: Colors[scheme ?? 'light'].text }]}>
          Contact Us
        </Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              Get in Touch
            </Text>
            <Text style={[styles.description, { color: Colors[scheme ?? 'light'].text }]}>
              Have questions, feedback, or need help? We'd love to hear from you!
            </Text>

            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={24} color={Colors[scheme ?? 'light'].tint} />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: Colors[scheme ?? 'light'].text }]}>
                  Email
                </Text>
                <Text style={[styles.contactValue, { color: Colors[scheme ?? 'light'].icon }]}>
                  support@ghosttalk.com
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Ionicons name="time-outline" size={24} color={Colors[scheme ?? 'light'].tint} />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: Colors[scheme ?? 'light'].text }]}>
                  Response Time
                </Text>
                <Text style={[styles.contactValue, { color: Colors[scheme ?? 'light'].icon }]}>
                  Within 24 hours
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={24} color={Colors[scheme ?? 'light'].tint} />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: Colors[scheme ?? 'light'].text }]}>
                  Location
                </Text>
                <Text style={[styles.contactValue, { color: Colors[scheme ?? 'light'].icon }]}>
                  Kathmandu, Nepal
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              Send us a Message
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[scheme ?? 'light'].text }]}>
                Subject
              </Text>
              <TextInput
                style={[styles.input, {
                  color: Colors[scheme ?? 'light'].text,
                  borderColor: Colors[scheme ?? 'light'].icon + '40',
                  backgroundColor: scheme === 'dark' ? '#222' : '#f8f9fa'
                }]}
                placeholder="What's this about?"
                placeholderTextColor={Colors[scheme ?? 'light'].icon}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[scheme ?? 'light'].text }]}>
                Message
              </Text>
              <TextInput
                style={[styles.textArea, {
                  color: Colors[scheme ?? 'light'].text,
                  borderColor: Colors[scheme ?? 'light'].icon + '40',
                  backgroundColor: scheme === 'dark' ? '#222' : '#f8f9fa'
                }]}
                placeholder="Tell us more..."
                placeholderTextColor={Colors[scheme ?? 'light'].icon}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: Colors[scheme ?? 'light'].tint }]}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={18} color="white" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              Other Ways to Reach Us
            </Text>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="bug-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
              <Text style={[styles.infoText, { color: Colors[scheme ?? 'light'].text }]}>
                Report a bug
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="bulb-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
              <Text style={[styles.infoText, { color: Colors[scheme ?? 'light'].text }]}>
                Suggest a feature
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="help-circle-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
              <Text style={[styles.infoText, { color: Colors[scheme ?? 'light'].text }]}>
                General help
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  contactInfo: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    opacity: 0.8,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  additionalInfo: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
