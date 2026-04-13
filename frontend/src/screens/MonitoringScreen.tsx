import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';

const GRAFANA_URL = process.env.EXPO_PUBLIC_GRAFANA_URL ?? 'http://localhost:3000';
const DASHBOARD_URL = `${GRAFANA_URL}/d/sungji-phone-main`;

export function MonitoringScreen() {
  // 웹 브라우저 환경 — iframe으로 대체
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          src={`${DASHBOARD_URL}?kiosk=tv`}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
          title="Grafana 대시보드"
        />
      </View>
    );
  }

  // 네이티브 앱 환경 — WebView 동적 import
  return <NativeMonitoring />;
}

function NativeMonitoring() {
  const [WebView, setWebView] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    import('react-native-webview')
      .then((mod) => setWebView(() => mod.WebView))
      .catch(() => setLoadError(true));
  }, []);

  if (loadError || !WebView) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Grafana 대시보드</Text>
        <Text style={styles.fallbackUrl}>{DASHBOARD_URL}</Text>
        <TouchableOpacity
          style={styles.openBtn}
          onPress={() => Linking.openURL(DASHBOARD_URL)}
        >
          <Text style={styles.openBtnText}>브라우저에서 열기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: `${DASHBOARD_URL}?kiosk=tv` }}
        style={styles.webview}
        startInLoadingState
        onError={() => setLoadError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f7fa',
  },
  fallbackTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  fallbackUrl: { fontSize: 13, color: '#888', marginBottom: 24, textAlign: 'center' },
  openBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
