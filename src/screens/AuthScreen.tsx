import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { AppLanguage, setAppLanguage } from '../i18n';

export default function AuthScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('he') ? 'he' : 'en';

  const handleLanguage = async (lng: AppLanguage) => {
    if (lng === currentLang) {
      return;
    }
    await setAppLanguage(lng);
  };
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert(t('auth.missingEmailTitle'), t('auth.missingEmailBody'));
      return false;
    }

    if (!password.trim()) {
      Alert.alert(t('auth.missingPasswordTitle'), t('auth.missingPasswordBody'));
      return false;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert(t('auth.missingFullNameTitle'), t('auth.missingFullNameBody'));
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t('auth.weakPasswordTitle'), t('auth.weakPasswordBody'));
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          fullName: fullName.trim(),
          email: email.trim(),
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (error: any) {
      console.log('AUTH ERROR:', error);
      console.log('AUTH ERROR CODE:', error?.code);
      console.log('AUTH ERROR MESSAGE:', error?.message);

      let message = error?.message || t('auth.errorGeneric');

      if (error?.code === 'auth/email-already-in-use') {
        message = t('auth.errorEmailInUse');
      } else if (error?.code === 'auth/invalid-email') {
        message = t('auth.errorInvalidEmail');
      } else if (error?.code === 'auth/invalid-credential') {
        message = t('auth.errorInvalidCredential');
      } else if (error?.code === 'auth/user-not-found') {
        message = t('auth.errorUserNotFound');
      } else if (error?.code === 'auth/wrong-password') {
        message = t('auth.errorWrongPassword');
      } else if (error?.code === 'auth/too-many-requests') {
        message = t('auth.errorTooManyRequests');
      }

      Alert.alert(t('auth.errorTitle'), `${error?.code || 'unknown'}\n${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.languageSectionLabel}>{t('language.sectionTitle')}</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[
                styles.languageButton,
                currentLang === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => void handleLanguage('en')}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  currentLang === 'en' && styles.languageButtonTextActive,
                ]}
              >
                {t('language.english')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.languageButton,
                currentLang === 'he' && styles.languageButtonActive,
              ]}
              onPress={() => void handleLanguage('he')}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  currentLang === 'he' && styles.languageButtonTextActive,
                ]}
              >
                {t('language.hebrew')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? t('auth.subtitleLogin') : t('auth.subtitleRegister')}
          </Text>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
              onPress={() => setIsLogin(true)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  isLogin && styles.toggleButtonTextActive,
                ]}
              >
                {t('auth.login')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
              onPress={() => setIsLogin(false)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  !isLogin && styles.toggleButtonTextActive,
                ]}
              >
                {t('auth.register')}
              </Text>
            </Pressable>
          </View>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('auth.placeholderFullName')}
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.placeholderEmail')}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.placeholderPassword')}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleAuth}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? t('auth.submitLogin') : t('auth.submitRegister')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  languageSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#2563EB',
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563EB',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
