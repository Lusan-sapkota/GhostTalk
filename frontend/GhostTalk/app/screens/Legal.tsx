import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'privacy' | 'terms' | 'faq';

export default function LegalScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('privacy');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'privacy':
        return (
          <ScrollView style={styles.content}>
            <Text style={[styles.title, { color: Colors[scheme ?? 'light'].text }]}>
              Privacy Policy
            </Text>
            <Text style={[styles.lastUpdated, { color: Colors[scheme ?? 'light'].icon }]}>
              Last updated: September 11, 2025
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              1. Information We Collect
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              We collect information you provide directly to us, such as when you create an account, post content, or contact us for support. This includes your username, email address, profile information, and any content you share.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              2. How We Use Your Information
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotions.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              3. Information Sharing
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              4. Data Security
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              5. Contact Us
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              If you have any questions about this Privacy Policy, please contact us through the Contact page in our app.
            </Text>
          </ScrollView>
        );

      case 'terms':
        return (
          <ScrollView style={styles.content}>
            <Text style={[styles.title, { color: Colors[scheme ?? 'light'].text }]}>
              Terms and Conditions
            </Text>
            <Text style={[styles.lastUpdated, { color: Colors[scheme ?? 'light'].icon }]}>
              Last updated: September 11, 2025
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              1. Acceptance of Terms
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              By accessing and using GhostTalk, you accept and agree to be bound by the terms and provision of this agreement.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              2. User Accounts
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              3. Content Policy
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              You retain ownership of your content. By posting content, you grant us a non-exclusive, royalty-free license to use, display, and distribute your content on our platform.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              4. Prohibited Activities
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              You agree not to engage in harmful, abusive, or illegal activities on our platform, including but not limited to harassment, spam, or distribution of malicious content.
            </Text>

            <Text style={[styles.sectionTitle, { color: Colors[scheme ?? 'light'].text }]}>
              5. Termination
            </Text>
            <Text style={[styles.paragraph, { color: Colors[scheme ?? 'light'].text }]}>
              We reserve the right to terminate or suspend your account at our discretion, with or without notice, for conduct that violates these terms.
            </Text>
          </ScrollView>
        );

      case 'faq':
        return (
          <ScrollView style={styles.content}>
            <Text style={[styles.title, { color: Colors[scheme ?? 'light'].text }]}>
              Frequently Asked Questions
            </Text>

            <View style={styles.faqItem}>
              <Text style={[styles.question, { color: Colors[scheme ?? 'light'].text }]}>
                Q: How do I create an account?
              </Text>
              <Text style={[styles.answer, { color: Colors[scheme ?? 'light'].text }]}>
                A: Tap the "Register" button on the login screen and fill in your details including username, email, and password.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.question, { color: Colors[scheme ?? 'light'].text }]}>
                Q: How do I add friends?
              </Text>
              <Text style={[styles.answer, { color: Colors[scheme ?? 'light'].text }]}>
                A: Go to the Friends tab, use the search function to find users, and send friend requests.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.question, { color: Colors[scheme ?? 'light'].text }]}>
                Q: How do I save posts?
              </Text>
              <Text style={[styles.answer, { color: Colors[scheme ?? 'light'].text }]}>
                A: Tap the bookmark icon on any post to save it. You can view your saved posts in the sidebar menu.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.question, { color: Colors[scheme ?? 'light'].text }]}>
                Q: How do I change my profile picture?
              </Text>
              <Text style={[styles.answer, { color: Colors[scheme ?? 'light'].text }]}>
                A: Go to your Profile page and tap the "Edit Profile" button to update your information and profile picture.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.question, { color: Colors[scheme ?? 'light'].text }]}>
                Q: How do I report inappropriate content?
              </Text>
              <Text style={[styles.answer, { color: Colors[scheme ?? 'light'].text }]}>
                A: Use the settings icon on posts or contact us through the Contact page for reporting issues.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.question, { color: Colors[scheme ?? 'light'].text }]}>
                Q: Is my data secure?
              </Text>
              <Text style={[styles.answer, { color: Colors[scheme ?? 'light'].text }]}>
                A: Yes, we implement industry-standard security measures to protect your personal information. See our Privacy Policy for details.
              </Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
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
          Help & Legal
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: Colors[scheme ?? 'light'].icon + '20' }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('privacy')}
          style={[
            styles.tab,
            activeTab === 'privacy' && [styles.activeTab, { borderBottomColor: Colors[scheme ?? 'light'].tint }]
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'privacy' ? Colors[scheme ?? 'light'].tint : Colors[scheme ?? 'light'].icon }
          ]}>
            Privacy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('terms')}
          style={[
            styles.tab,
            activeTab === 'terms' && [styles.activeTab, { borderBottomColor: Colors[scheme ?? 'light'].tint }]
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'terms' ? Colors[scheme ?? 'light'].tint : Colors[scheme ?? 'light'].icon }
          ]}>
            Terms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('faq')}
          style={[
            styles.tab,
            activeTab === 'faq' && [styles.activeTab, { borderBottomColor: Colors[scheme ?? 'light'].tint }]
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'faq' ? Colors[scheme ?? 'light'].tint : Colors[scheme ?? 'light'].icon }
          ]}>
            FAQ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderTabContent()}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    lineHeight: 22,
    paddingLeft: 8,
  },
});
