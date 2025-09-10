import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SectionType = 'account' | 'privacy' | 'security' | 'notifications' | 'appearance' | 'help';

type Option = { label: string; value: string };

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  colors,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.icon + '20' }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.icon + '20', opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={22} color={colors.tint} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
          {!!subtitle && (
            <Text style={[styles.rowSubtitle, { color: colors.icon }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.rowRight}>{right}</View>
    </Pressable>
  );
}

function Selector({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.selector}>
      <Text style={[styles.selectorText, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.icon} />
    </TouchableOpacity>
  );
}

function OptionPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        {options.map(opt => (
          <Pressable
            key={opt.value}
            onPress={() => {
              onSelect(opt.value);
              onClose();
            }}
            style={({ pressed }) => [
              styles.modalOption,
              {
                backgroundColor: pressed ? colors.tint + '10' : 'transparent',
                borderBottomColor: colors.icon + '20',
              },
            ]}
          >
            <Text style={[styles.modalOptionText, { color: colors.text }]}>{opt.label}</Text>
            {selected === opt.value && (
              <Ionicons name="checkmark" size={18} color={colors.tint} />
            )}
          </Pressable>
        ))}
        <Pressable onPress={onClose} style={styles.modalCancel}>
          <Text style={[styles.modalCancelText, { color: colors.tint }]}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme ?? 'light'];
  const getLabel = (value: string) => {
    switch (value) {
      case 'friends_and_followers':
        return 'Friends and Followers Only';
      case 'friends':
        return 'Friends Only';
      case 'followers':
        return 'Followers Only';
      case 'public':
        return 'Everyone';
      default:
        return 'Friends Only';
    }
  };
  const { width } = useWindowDimensions();

  // Breakpoints
  const isWide = width >= 900;
  const isTablet = width >= 700 && width < 900;

  // Section nav
  const [activeSection, setActiveSection] = useState<SectionType>('account');

  // Account
  const [userData, setUserData] = useState<any>(null);

  // Privacy
  const [postPrivacy, setPostPrivacy] = useState<'friends' | 'public' | 'friends_and_followers' | 'followers'>('friends');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'friends' | 'public' | 'friends_and_followers' | 'followers'>('friends');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Notifications
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(scheme ?? 'system');
  const [language, setLanguage] = useState('English');

  // Modals
  const [visibilityPickerOpen, setVisibilityPickerOpen] = useState(false);
  const [postPrivacyPickerOpen, setPostPrivacyPickerOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userRaw = await AsyncStorage.getItem('user');
        if (userRaw) setUserData(JSON.parse(userRaw));
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const settingsRaw = await AsyncStorage.getItem('settings');
        if (!settingsRaw) return;
        const s = JSON.parse(settingsRaw);
        setPostPrivacy(s.postPrivacy ?? 'friends');
        setShowOnlineStatus(s.showOnlineStatus ?? true);
        setProfileVisibility(s.profileVisibility ?? 'friends');
        setPushNotifications(s.pushNotifications ?? true);
        setEmailNotifications(s.emailNotifications ?? true);
        setFriendRequestNotifications(s.friendRequestNotifications ?? true);
        setMessageNotifications(s.messageNotifications ?? true);
        setTheme(s.theme ?? scheme ?? 'system');
        setLanguage(s.language ?? 'English');
        setTwoFactorEnabled(s.twoFactorEnabled ?? false);
        setLoginAlerts(s.loginAlerts ?? true);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    })();
  }, [scheme]);

  const saveSettings = async (patch: Record<string, any>) => {
    try {
      const current = await AsyncStorage.getItem('settings');
      const json = current ? JSON.parse(current) : {};
      const next = { ...json, ...patch };
      await AsyncStorage.setItem('settings', JSON.stringify(next));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const navItems: { key: SectionType; label: string; icon: any }[] = useMemo(
    () => [
      { key: 'account', label: 'Account', icon: 'person-outline' },
      { key: 'privacy', label: 'Privacy', icon: 'lock-closed-outline' },
      { key: 'security', label: 'Security', icon: 'shield-outline' },
      { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
      { key: 'appearance', label: 'Appearance', icon: 'color-palette-outline' },
      { key: 'help', label: 'Help', icon: 'help-circle-outline' },
    ],
    []
  );

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Deactivate this account? Log in again to reactivate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deactivated', 'Account can be reactivated by logging in.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Account Deletion', 'Deletion request submitted. Check email for confirmation.');
        },
      },
    ]);
  };

  const SectionContainer = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.tint }]}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <SectionContainer title="Account Information">
            <View
              style={[
                styles.infoCard,
                { backgroundColor: scheme === 'dark' ? '#2a2a2a' : '#f8f9fa' },
              ]}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Name</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userData?.name || 'John Doe'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userData?.email || 'john@example.com'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Member since</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userData?.joinDate || 'Jan 2024'}
                </Text>
              </View>
            </View>

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/screens/Profile')}
              >
                <Ionicons name="person-outline" size={18} color="white" />
                <Text style={styles.primaryBtnText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.tint }]}
                onPress={() => router.push('/screens/Profile')}
              >
                <Ionicons name="create-outline" size={18} color={colors.tint} />
                <Text style={[styles.outlineBtnText, { color: colors.tint }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.warnBtn, { borderColor: '#ff9500' }]}
                onPress={handleDeactivateAccount}
              >
                <Ionicons name="pause-circle-outline" size={18} color="#ff9500" />
                <Text style={styles.warnBtnText}>Deactivate Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dangerBtn, { borderColor: '#ff4444' }]}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={18} color="#ff4444" />
                <Text style={styles.dangerBtnText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </SectionContainer>
        );

      case 'privacy':
        return (
          <SectionContainer title="Privacy Settings">
            <SettingRow
              icon="lock-closed-outline"
              title="Post Privacy"
              subtitle="Who can see your posts"
              colors={colors}
              right={
                <Selector
                  label={getLabel(postPrivacy)}
                  onPress={() => setPostPrivacyPickerOpen(true)}
                  colors={colors}
                />
              }
            />
            <SettingRow
              icon="eye-outline"
              title="Online Status"
              subtitle="Show when online"
              colors={colors}
              right={
                <Switch
                  value={showOnlineStatus}
                  onValueChange={(v) => {
                    setShowOnlineStatus(v);
                    saveSettings({ showOnlineStatus: v });
                  }}
                />
              }
            />
            <SettingRow
              icon="person-outline"
              title="Profile Visibility"
              subtitle="Who can see your profile"
              colors={colors}
              right={
                <Selector
                  label={getLabel(profileVisibility)}
                  onPress={() => setVisibilityPickerOpen(true)}
                  colors={colors}
                />
              }
            />
          </SectionContainer>
        );

      case 'security':
        return (
          <SectionContainer title="Security Settings">
            <Pressable
              onPress={() => setShowPasswordFields(!showPasswordFields)}
              style={({ pressed }) => [
                styles.accordionHeader,
                { borderBottomColor: colors.icon + '20', opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="key-outline" size={22} color={colors.tint} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Change Password</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.icon }]}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showPasswordFields ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.icon}
              />
            </Pressable>

            {showPasswordFields && (
              <View
                style={[
                  styles.passwordFields,
                  { backgroundColor: scheme === 'dark' ? '#222' : '#f8f9fa' },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon + '40' }]}
                  placeholder="Current Password"
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon + '40' }]}
                  placeholder="New Password"
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.icon + '40' }]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    if (newPassword === confirmPassword && newPassword.length >= 6) {
                      Alert.alert('Success', 'Password updated successfully!');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowPasswordFields(false);
                    } else {
                      Alert.alert(
                        'Error',
                        'Passwords must match and be at least 6 characters long.'
                      );
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            )}

            <SettingRow
              icon="shield-checkmark-outline"
              title="Two-Factor Authentication"
              subtitle="Add a second step to sign in"
              colors={colors}
              right={
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={(v) => {
                    setTwoFactorEnabled(v);
                    saveSettings({ twoFactorEnabled: v });
                  }}
                />
              }
            />

            <SettingRow
              icon="alert-circle-outline"
              title="Login Alerts"
              subtitle="Notify on new device logins"
              colors={colors}
              right={
                <Switch
                  value={loginAlerts}
                  onValueChange={(v) => {
                    setLoginAlerts(v);
                    saveSettings({ loginAlerts: v });
                  }}
                />
              }
            />
          </SectionContainer>
        );

      case 'notifications':
        return (
          <SectionContainer title="Notification Settings">
            <SettingRow
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Receive push notifications"
              colors={colors}
              right={
                <Switch
                  value={pushNotifications}
                  onValueChange={(v) => {
                    setPushNotifications(v);
                    saveSettings({ pushNotifications: v });
                  }}
                />
              }
            />
            <SettingRow
              icon="mail-outline"
              title="Email Notifications"
              subtitle="Receive email notifications"
              colors={colors}
              right={
                <Switch
                  value={emailNotifications}
                  onValueChange={(v) => {
                    setEmailNotifications(v);
                    saveSettings({ emailNotifications: v });
                  }}
                />
              }
            />
            <SettingRow
              icon="person-add-outline"
              title="Friend Requests"
              subtitle="Notifications for friend requests"
              colors={colors}
              right={
                <Switch
                  value={friendRequestNotifications}
                  onValueChange={(v) => {
                    setFriendRequestNotifications(v);
                    saveSettings({ friendRequestNotifications: v });
                  }}
                />
              }
            />
            <SettingRow
              icon="chatbubble-outline"
              title="Messages"
              subtitle="Notifications for new messages"
              colors={colors}
              right={
                <Switch
                  value={messageNotifications}
                  onValueChange={(v) => {
                    setMessageNotifications(v);
                    saveSettings({ messageNotifications: v });
                  }}
                />
              }
            />
          </SectionContainer>
        );

      case 'appearance':
        return (
          <SectionContainer title="Appearance Settings">
            <SettingRow
              icon="color-palette-outline"
              title="Theme"
              subtitle="Choose your preferred theme"
              colors={colors}
              right={
                <Selector
                  label={theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
                  onPress={() => setThemePickerOpen(true)}
                  colors={colors}
                />
              }
            />
            <SettingRow
              icon="language-outline"
              title="Language"
              subtitle="Select your language"
              colors={colors}
              right={
                <Selector label={language} onPress={() => setLanguagePickerOpen(true)} colors={colors} />
              }
            />
          </SectionContainer>
        );

      case 'help':
        return (
          <SectionContainer title="Help & Support">
            <Pressable
              style={({ pressed }) => [
                styles.helpRow,
                { borderBottomColor: colors.icon + '20', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push('/screens/Legal')}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.tint} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>Help & Legal</Text>
                <Text style={[styles.helpDesc, { color: colors.icon }]}>
                  Privacy Policy, Terms, FAQ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.helpRow,
                { borderBottomColor: colors.icon + '20', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push('/screens/Contact')}
            >
              <Ionicons name="mail-outline" size={24} color={colors.tint} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>Contact Support</Text>
                <Text style={[styles.helpDesc, { color: colors.icon }]}>
                  Get help from our support team
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.helpRow,
                { borderBottomColor: colors.icon + '20', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push('/screens/About')}
            >
              <Ionicons name="information-circle-outline" size={24} color={colors.tint} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>About GhostTalk</Text>
                <Text style={[styles.helpDesc, { color: colors.icon }]}>
                  Learn more about the app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </Pressable>
          </SectionContainer>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.icon + '20' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.body}>
        {/* Left nav for wide screens */}
        {isWide && (
          <View style={[styles.rail, { borderRightColor: colors.icon + '20' }]}>
            {navItems.map((item) => {
              const active = activeSection === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setActiveSection(item.key)}
                  style={[
                    styles.railItem,
                    { backgroundColor: active ? colors.tint + '20' : 'transparent' },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? colors.tint : colors.icon}
                  />
                  <Text
                    style={[
                      styles.railLabel,
                      { color: active ? colors.tint : colors.icon, fontWeight: active ? '700' : '500' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.main}>
          {/* Top chips for narrow screens */}
          {!isWide && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {navItems.map((item) => {
                const active = activeSection === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setActiveSection(item.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.tint + '20' : 'transparent',
                        borderColor: active ? colors.tint : colors.icon + '40',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? colors.tint : colors.icon}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.tint : colors.icon, fontWeight: active ? '700' : '500' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: isTablet || isWide ? 24 : 16, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {renderSection()}
          </ScrollView>
        </View>
      </View>

      {/* Modals */}
      <OptionPickerModal
        visible={visibilityPickerOpen}
        title="Profile Visibility"
        options={[
          { label: 'Friends and Followers Only', value: 'friends_and_followers' },
          { label: 'Friends Only', value: 'friends' },
          { label: 'Followers Only', value: 'followers' },
          { label: 'Everyone', value: 'public' },
        ]}
        selected={profileVisibility}
        onSelect={(v) => {
          setProfileVisibility(v as 'friends' | 'public' | 'friends_and_followers' | 'followers');
          saveSettings({ profileVisibility: v });
        }}
        onClose={() => setVisibilityPickerOpen(false)}
        colors={colors}
      />

      <OptionPickerModal
        visible={postPrivacyPickerOpen}
        title="Post Privacy"
        options={[
          { label: 'Friends and Followers Only', value: 'friends_and_followers' },
          { label: 'Friends Only', value: 'friends' },
          { label: 'Followers Only', value: 'followers' },
          { label: 'Everyone', value: 'public' },
        ]}
        selected={postPrivacy}
        onSelect={(v) => {
          setPostPrivacy(v as typeof postPrivacy);
          saveSettings({ postPrivacy: v });
        }}
        onClose={() => setPostPrivacyPickerOpen(false)}
        colors={colors}
      />

      <OptionPickerModal
        visible={themePickerOpen}
        title="Theme"
        options={[
          { label: 'System', value: 'system' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ]}
        selected={theme}
        onSelect={(v) => {
          setTheme(v as 'light' | 'dark' | 'system');
          saveSettings({ theme: v });
          if (Platform.OS === 'android') {
            // Optional: toast could go here to inform restart/theme applies globally via provider
          }
        }}
        onClose={() => setThemePickerOpen(false)}
        colors={colors}
      />

      <OptionPickerModal
        visible={languagePickerOpen}
        title="Language"
        options={[
          { label: 'English', value: 'English' },
          { label: 'Nepali', value: 'Nepali' },
          { label: 'Hindi', value: 'Hindi' },
        ]}
        selected={language}
        onSelect={(v) => {
          setLanguage(v);
          saveSettings({ language: v });
        }}
        onClose={() => setLanguagePickerOpen(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', flex: 1 },

  body: { flex: 1, flexDirection: 'row' },

  rail: {
    width: 240,
    borderRightWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  railLabel: { fontSize: 15, fontWeight: '600' },

  main: { flex: 1 },
  chips: { paddingVertical: 12, paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  card: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  cardBody: { borderRadius: 12, overflow: 'hidden' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight: { alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13, marginTop: 2 },

  selector: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  selectorText: { fontSize: 14, fontWeight: '500' },

  infoCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600' },

  rowButtons: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  outlineBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlineBtnText: { fontSize: 16, fontWeight: '600' },
  warnBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#fff3cd',
  },
  warnBtnText: { fontSize: 16, fontWeight: '600', color: '#856404' },
  dangerBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#f8d7da',
  },
  dangerBtnText: { fontSize: 16, fontWeight: '600', color: '#721c24' },

  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  passwordFields: { padding: 16, borderRadius: 10, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  helpTitle: { fontSize: 16, fontWeight: '600' },
  helpDesc: { fontSize: 14, marginTop: 2 },

  modalBackdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionText: { fontSize: 15, fontWeight: '500' },
  modalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
});
