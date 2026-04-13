import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

interface Props {
  onGoLogin: () => void;
}

export function RegisterScreen({ onGoLogin }: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해 주세요');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('입력 오류', '아이디는 3자 이상 입력해 주세요');
      return;
    }
    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상 입력해 주세요');
      return;
    }
    if (password !== confirm) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다');
      return;
    }
    setLoading(true);
    try {
      const user = await authApi.register({ username: username.trim(), password });
      await login(user);
    } catch (e: any) {
      Alert.alert('회원가입 실패', e.message ?? '다시 시도해 주세요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>성지폰 트래커에 오신 것을 환영합니다</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>아이디 (3~50자)</Text>
          <TextInput
            style={styles.input}
            placeholder="사용할 아이디 입력"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>비밀번호 (6자 이상)</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
          />

          <Text style={styles.label}>비밀번호 확인</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 재입력"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>가입하기</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onGoLogin}>
            <Text style={styles.btnSecondaryText}>
              이미 계정이 있으신가요? <Text style={styles.linkText}>로그인</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a73e8', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, backgroundColor: '#fafafa', color: '#222',
  },
  btnPrimary: {
    backgroundColor: '#1a73e8', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { alignItems: 'center', marginTop: 16 },
  btnSecondaryText: { fontSize: 14, color: '#888' },
  linkText: { color: '#1a73e8', fontWeight: '700' },
});
