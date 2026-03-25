import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
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

export default function AuthScreen() {
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
      Alert.alert('Missing email', 'Please enter your email.');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Missing password', 'Please enter your password.');
      return false;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert('Missing full name', 'Please enter your full name.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
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
        Alert.alert('Success', 'Logged in successfully.');
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
          
          Alert.alert('Success', 'Account created successfully.');
      }

      resetForm();
    } catch (error: any) {
        console.log('AUTH ERROR:', error);
        console.log('AUTH ERROR CODE:', error?.code);
        console.log('AUTH ERROR MESSAGE:', error?.message);
      
        let message = error?.message || 'Something went wrong. Please try again.';
      
        if (error?.code === 'auth/email-already-in-use') {
          message = 'This email is already in use.';
        } else if (error?.code === 'auth/invalid-email') {
          message = 'This email address is invalid.';
        } else if (error?.code === 'auth/invalid-credential') {
          message = 'Invalid email or password.';
        } else if (error?.code === 'auth/user-not-found') {
          message = 'User not found.';
        } else if (error?.code === 'auth/wrong-password') {
          message = 'Incorrect password.';
        } else if (error?.code === 'auth/too-many-requests') {
          message = 'Too many attempts. Please try again later.';
        }
      
        Alert.alert('Authentication error', `${error?.code || 'unknown'}\n${message}`);
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
          <Text style={styles.title}>EasyBill</Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Sign in to manage your apartment bills'
              : 'Create your account to get started'}
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
                Login
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
                Register
              </Text>
            </Pressable>
          </View>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
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
                {isLogin ? 'Login' : 'Create Account'}
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