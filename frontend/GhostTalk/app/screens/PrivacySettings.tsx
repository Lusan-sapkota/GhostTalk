import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getPrivacySettings, updatePrivacySettings } from '../api';

interface PrivacySettings {
  show_online_status: boolean;
  show_last_seen: boolean;
  allow_messages_from: 'everyone' | 'friends' | 'none';
  allow_friend_requests: boolean;
  profile_visibility: 'public' | 'friends' | 'private';
}

const PrivacySettingsScreen: React.FC = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const [settings, setSettings] = useState<PrivacySettings>({
    show_online_status: true,
    show_last_seen: true,
    allow_messages_from: 'everyone',
    allow_friend_requests: true,
    profile_visibility: 'public',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const response = await getPrivacySettings();
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    setLoading(true);
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const response = await updatePrivacySettings(newSettings);
      if (response.data.success) {
        // Settings updated successfully
      } else {
        // Revert on failure
        setSettings(settings);
        Alert.alert('Error', 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      // Revert on failure
      setSettings(settings);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    control: React.ReactNode,
    showBorder: boolean = true
  ) => (
    <View style={[styles.settingItem, showBorder && { borderBottomWidth: 1, borderBottomColor: colors.icon + '20' }]}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.icon }]}>{subtitle}</Text>
      </View>
      {control}
    </View>
  );

  const renderMessageOptions = () => (
    <View style={styles.optionsContainer}>
      {[
        { value: 'everyone', label: 'Everyone' },
        { value: 'friends', label: 'Friends only' },
        { value: 'none', label: 'No one' },
      ].map((option, index) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionItem,
            settings.allow_messages_from === option.value && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => updateSetting('allow_messages_from', option.value)}
          disabled={loading}
        >
          <Text style={[
            styles.optionText,
            { color: colors.text },
            settings.allow_messages_from === option.value && { color: colors.primary, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
          {settings.allow_messages_from === option.value && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProfileVisibilityOptions = () => (
    <View style={styles.optionsContainer}>
      {[
        { value: 'public', label: 'Public' },
        { value: 'friends', label: 'Friends only' },
        { value: 'private', label: 'Private' },
      ].map((option, index) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionItem,
            settings.profile_visibility === option.value && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => updateSetting('profile_visibility', option.value)}
          disabled={loading}
        >
          <Text style={[
            styles.optionText,
            { color: colors.text },
            settings.profile_visibility === option.value && { color: colors.primary, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
          {settings.profile_visibility === option.value && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.icon + '20' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Online Status</Text>

          {renderSettingItem(
            'Show online status',
            'Let others see when you\'re online',
            <Switch
              value={settings.show_online_status}
              onValueChange={(value) => updateSetting('show_online_status', value)}
              trackColor={{ false: colors.icon + '40', true: colors.primary + '60' }}
              thumbColor={settings.show_online_status ? colors.primary : colors.icon}
              disabled={loading}
            />
          )}

          {renderSettingItem(
            'Show last seen',
            'Let others see when you were last active',
            <Switch
              value={settings.show_last_seen}
              onValueChange={(value) => updateSetting('show_last_seen', value)}
              trackColor={{ false: colors.icon + '40', true: colors.primary + '60' }}
              thumbColor={settings.show_last_seen ? colors.primary : colors.icon}
              disabled={loading}
            />,
            false
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Messages</Text>

          <View style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.icon + '20' }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Allow messages from</Text>
              <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                Who can send you messages
              </Text>
            </View>
          </View>
          {renderMessageOptions()}

          {renderSettingItem(
            'Allow friend requests',
            'Let others send you friend requests',
            <Switch
              value={settings.allow_friend_requests}
              onValueChange={(value) => updateSetting('allow_friend_requests', value)}
              trackColor={{ false: colors.icon + '40', true: colors.primary + '60' }}
              thumbColor={settings.allow_friend_requests ? colors.primary : colors.icon}
              disabled={loading}
            />,
            false
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Visibility</Text>

          <View style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.icon + '20' }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Profile visibility</Text>
              <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                Who can see your profile
              </Text>
            </View>
          </View>
          {renderProfileVisibilityOptions()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
});

export default PrivacySettingsScreen;