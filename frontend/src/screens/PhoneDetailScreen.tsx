import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart } from 'react-native-chart-kit';
import { phoneApi } from '../api/phones';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

type Route = RouteProp<RootStackParamList, 'PhoneDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export function PhoneDetailScreen() {
  const route = useRoute<Route>();
  const { phoneId, modelName } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState('');

  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', phoneId],
    queryFn: () => phoneApi.getPriceHistory(phoneId),
    refetchInterval: 30000,
  });

  const { data: latestPrice } = useQuery({
    queryKey: ['latest-price', phoneId],
    queryFn: () => phoneApi.getLatestPrice(phoneId),
    refetchInterval: 30000,
  });

  const addWatchlistMutation = useMutation({
    mutationFn: phoneApi.addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setModalVisible(false);
      setTargetPriceInput('');
      showAlert('완료', '관심 목록에 등록되었습니다!');
    },
    onError: (err: Error) => {
      showAlert('오류', err.message);
    },
  });

  // 웹/네이티브 공통 알림
  const showAlert = (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleAddWatchlist = () => {
    if (!user) {
      showAlert('알림', '로그인 후 이용할 수 있습니다');
      return;
    }
    const targetPrice = targetPriceInput
      ? parseInt(targetPriceInput.replace(/,/g, ''), 10)
      : undefined;
    addWatchlistMutation.mutate({ phoneId, targetPrice });
  };

  // 차트 데이터 준비 (최근 7일 데이터)
  const chartData = prepareChartData(priceHistory ?? []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.modelName}>{modelName}</Text>
        {latestPrice && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>현재 최저가</Text>
            <Text style={styles.price}>{latestPrice.price.toLocaleString()}원</Text>
            <Text style={styles.priceSource}>{latestPrice.source} 기준</Text>
          </View>
        )}
      </View>

      {/* 가격 추이 차트 */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>최근 가격 추이</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#1a73e8" style={{ marginVertical: 40 }} />
        ) : chartData.labels.length > 0 ? (
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 32}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              style: { borderRadius: 8 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#1a73e8' },
            }}
            bezier
            style={styles.chart}
            formatYLabel={(val) => `${(parseInt(val) / 10000).toFixed(0)}만`}
          />
        ) : (
          <Text style={styles.noData}>가격 데이터가 없습니다</Text>
        )}
      </View>

      {/* 관심 등록 버튼 */}
      <TouchableOpacity style={styles.watchlistBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.watchlistBtnText}>관심 등록하기</Text>
      </TouchableOpacity>

      {/* 최근 가격 목록 */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>가격 히스토리</Text>
        {(priceHistory ?? []).slice(0, 20).map((record) => (
          <View key={record.id} style={styles.historyItem}>
            <View>
              <Text style={styles.historySource}>{record.source}</Text>
              <Text style={styles.historyDate}>{formatDate(record.crawledAt)}</Text>
            </View>
            <Text style={styles.historyPrice}>{record.price.toLocaleString()}원</Text>
          </View>
        ))}
      </View>

      {/* 목표 가격 입력 모달 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>목표 가격 설정</Text>
            <Text style={styles.modalSubtitle}>이 금액 이하가 되면 알림을 드릴게요</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="목표 가격 입력 (선택)"
              keyboardType="numeric"
              value={targetPriceInput}
              onChangeText={setTargetPriceInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleAddWatchlist}
                disabled={addWatchlistMutation.isPending}
              >
                <Text style={styles.confirmBtnText}>
                  {addWatchlistMutation.isPending ? '등록 중...' : '등록'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function prepareChartData(records: any[]) {
  if (records.length === 0) return { labels: [], datasets: [{ data: [] }] };
  const recent = [...records].reverse().slice(-7);
  return {
    labels: recent.map((r) => formatDateShort(r.crawledAt)),
    datasets: [{ data: recent.map((r) => r.price) }],
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  priceBox: {
    backgroundColor: '#fff3f3',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  priceLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '800', color: '#e53935' },
  priceSource: { fontSize: 12, color: '#aaa', marginTop: 4 },
  chartSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  chart: { borderRadius: 8 },
  noData: { textAlign: 'center', color: '#aaa', paddingVertical: 40 },
  watchlistBtn: {
    backgroundColor: '#1a73e8',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  watchlistBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  historySection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  historySource: { fontSize: 13, fontWeight: '500', color: '#1a73e8' },
  historyDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  historyPrice: { fontSize: 15, fontWeight: '700', color: '#333' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f5f5f5' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#1a73e8' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});
