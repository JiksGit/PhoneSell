import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phoneApi } from '../api/phones';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import type { WatchlistItem } from '../api/client';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WatchlistScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading, refetch } = useQuery({
    queryKey: ['watchlist', user?.userId],
    queryFn: () => phoneApi.getWatchlist(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const removeMutation = useMutation({
    mutationFn: phoneApi.removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (err: Error) => {
      Alert.alert('오류', err.message);
    },
  });

  const handleDelete = (item: WatchlistItem) => {
    Alert.alert(
      '관심 목록 삭제',
      `${item.modelName}을(를) 관심 목록에서 제거할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => removeMutation.mutate(item.id) },
      ]
    );
  };

  const isGoalAchieved = (item: WatchlistItem) =>
    item.targetPrice != null && item.currentPrice != null && item.currentPrice <= item.targetPrice;

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>로그인이 필요한 기능입니다</Text>
      </View>
    );
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />;
  }

  return (
    <FlatList
      style={styles.container}
      data={watchlist}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('PhoneDetail', { phoneId: item.phoneId, modelName: item.modelName })}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.75}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.modelName} numberOfLines={2}>{item.modelName}</Text>
            {isGoalAchieved(item) && (
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>목표 달성!</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>현재가</Text>
              <Text style={[styles.priceValue, isGoalAchieved(item) && styles.priceAchieved]}>
                {item.currentPrice != null ? `${item.currentPrice.toLocaleString()}원` : '-'}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>목표가</Text>
              <Text style={styles.priceValue}>
                {item.targetPrice != null ? `${item.targetPrice.toLocaleString()}원` : '미설정'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>삭제</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>관심 목록이 비어 있습니다</Text>
          <Text style={styles.emptyHint}>폰 상세 화면에서 관심 등록을 해보세요</Text>
        </View>
      }
      onRefresh={refetch}
      refreshing={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  listContent: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, marginTop: 60 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center' },
  emptyHint: { fontSize: 13, color: '#bbb', textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modelName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginRight: 8 },
  goalBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalBadgeText: { color: '#2e7d32', fontWeight: '700', fontSize: 12 },
  priceRow: { flexDirection: 'row', marginBottom: 14 },
  priceItem: { flex: 1, alignItems: 'center' },
  priceDivider: { width: 1, backgroundColor: '#f0f0f0' },
  priceLabel: { fontSize: 12, color: '#aaa', marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  priceAchieved: { color: '#2e7d32' },
  deleteBtn: {
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#e53935', fontWeight: '600', fontSize: 13 },
});
