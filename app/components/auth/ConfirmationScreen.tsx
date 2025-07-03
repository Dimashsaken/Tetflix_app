import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from './AuthProvider';

interface ConfirmationScreenProps {
  email: string;
  onNavigateToSignIn: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ 
  email, 
  onNavigateToSignIn 
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { confirmSignUp, resendCode } = useAuth();

  const handleConfirmSignUp = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the confirmation code');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmSignUp(email, code);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          'Your account has been confirmed. You can now sign in.',
          [{ text: 'OK', onPress: onNavigateToSignIn }]
        );
      } else {
        Alert.alert('Confirmation Failed', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      const result = await resendCode(email);
      
      if (result.success) {
        Alert.alert('Success', 'A new confirmation code has been sent to your email');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Confirm Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a confirmation code to {email}
        </Text>
        <Text style={styles.instruction}>
          Enter the 6-digit code below to verify your account
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Confirmation Code"
            placeholderTextColor="#666"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={[styles.confirmButton, loading && styles.disabledButton]}
            onPress={handleConfirmSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={resending}
            >
              <Text style={[styles.resendLink, resending && styles.disabledText]}>
                {resending ? 'Sending...' : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.backContainer}>
            <TouchableOpacity onPress={onNavigateToSignIn}>
              <Text style={styles.backLink}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13111C',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1F1D2B',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
    letterSpacing: 8,
  },
  confirmButton: {
    backgroundColor: '#E50914',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    color: '#fff',
    fontSize: 14,
  },
  resendLink: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.6,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  backLink: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default ConfirmationScreen; 