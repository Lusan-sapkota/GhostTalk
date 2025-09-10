import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface AboutData {
  name: string;
  version: string;
}

export default function AboutScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      // Using direct axios call since this is a simple public endpoint
      const response = await axios.get('http://localhost:8000/about/');
      setAboutData(response.data);
    } catch (error) {
      console.error('Error fetching about data:', error);
      // Fallback data
      setAboutData({ name: 'GhostTalk', version: '1.0' });
    } finally {
      setLoading(false);
    }
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
          About
        </Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* App Icon */}
          <View style={styles.iconContainer}>
            <Image source={require('../../assets/images/icon.png')} style={{ width: 80, height: 80 }} />
          </View>

          {/* App Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.appName, { color: Colors[scheme ?? 'light'].text }]}>
              {loading ? 'Loading...' : aboutData?.name || 'GhostTalk'}
            </Text>
            <Text style={[styles.version, { color: Colors[scheme ?? 'light'].icon }]}>
              Version {loading ? '...' : aboutData?.version || '1.0'}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.description, { color: Colors[scheme ?? 'light'].text }]}>
              GhostTalk is a modern social media platform built with React Native and Django.
              Connect with friends, share your thoughts, and discover amazing content from the community.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              Features
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
                <Text style={[styles.featureText, { color: Colors[scheme ?? 'light'].text }]}>
                  Real-time messaging
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="heart-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
                <Text style={[styles.featureText, { color: Colors[scheme ?? 'light'].text }]}>
                  Like and save posts
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="search-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
                <Text style={[styles.featureText, { color: Colors[scheme ?? 'light'].text }]}>
                  Advanced search
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="people-outline" size={20} color={Colors[scheme ?? 'light'].tint} />
                <Text style={[styles.featureText, { color: Colors[scheme ?? 'light'].text }]}>
                  Friend connections
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: Colors[scheme ?? 'light'].icon }]}>
              Made with ❤️ using React Native & Django
            </Text>
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
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    opacity: 0.7,
  },
  descriptionContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
