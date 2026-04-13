import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { useDeviceToken } from '../hooks/useDeviceToken';

interface Props {
  onGoRegister: () => void;
}

export function LoginScreen({ onGoRegister }: Props) {
  const { login }     = useAuth();
  const deviceToken   = useDeviceToken();
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해 주세요');
      return;
    }
    setLoading(true);
    try {
      const user = await authApi.login({
        username: username.trim(),
        password,
        deviceToken: deviceToken ?? undefined,   // 푸시 알림 토큰 전송
      });
      await login(user);
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '아이디 또는 비밀번호를 확인해 주세요');
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
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>성지폰 트래커</Text>
          <Text style={styles.subtitle}>최저가 핫딜을 실시간으로 확인하세요</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>아이디</Text>
          <TextInput
            style={styles.input}
            placeholder="아이디 입력"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>로그인</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onGoRegister}>
            <Text style={styles.btnSecondaryText}>
              계정이 없으신가요? <Text style={styles.linkText}>회원가입</Text>
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
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
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
