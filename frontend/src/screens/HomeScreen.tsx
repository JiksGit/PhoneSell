import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { phoneApi, DealFilter } from '../api/phones';
import { useAuth } from '../context/AuthContext';
import type { PriceRecord } from '../api/client';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortMode = 'recent' | 'lowest';

const BRANDS = ['전체', '삼성', '애플', '샤오미', '구글', '기타'];

export function HomeScreen() {
  const navigation  = useNavigation<Nav>();
  const { user, logout, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [searchText,   setSearchText]   = useState('');
  const [sortMode,     setSortMode]     = useState<SortMode>('recent');
  const [showFilter,   setShowFilter]   = useState(false);
  const [selectedBrand, setBrand]       = useState('전체');
  const [minInput,     setMinInput]     = useState('');
  const [maxInput,     setMaxInput]     = useState('');
  const [appliedFilter, setApplied]     = useState<DealFilter>({});

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => {
          queryClient.clear();
          await logout();
        },
      },
    ]);
  };

  const applyFilter = () => {
    const filter: DealFilter = {};
    if (selectedBrand !== '전체') filter.brand = selectedBrand;
    if (minInput)  filter.minPrice = parseInt(minInput.replace(/,/g, ''), 10) * 10000;
    if (maxInput)  filter.maxPrice = parseInt(maxInput.replace(/,/g, ''), 10) * 10000;
    setApplied(filter);
    setShowFilter(false);
  };

  const resetFilter = () => {
    setBrand('전체'); setMinInput(''); setMaxInput('');
    setApplied({});
    setShowFilter(false);
  };

  const filterCount = [
    appliedFilter.brand,
    appliedFilter.minPrice != null || appliedFilter.maxPrice != null ? '가격' : null,
  ].filter(Boolean).length;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['deals', sortMode, appliedFilter],
      queryFn: ({ pageParam = 0 }) =>
        sortMode === 'recent'
          ? phoneApi.getRecentDeals(pageParam, 20, appliedFilter)
          : phoneApi.getLowestDeals(pageParam, 20, appliedFilter),
      getNextPageParam: (last) => last.hasNext ? last.page + 1 : undefined,
      initialPageParam: 0,
      refetchInterval: 30000,
    });

  const allDeals: PriceRecord[] = data?.pages.flatMap((p) => p.content) ?? [];

  const handleSearch = () => {
    if (searchText.trim()) navigation.navigate('Search', { initialKeyword: searchText.trim() });
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 딜 링크 바로가기
  const openDealLink = async (url: string | null) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else Alert.alert('오류', '링크를 열 수 없습니다');
    } catch {
      Alert.alert('오류', '링크 열기에 실패했습니다');
    }
  };

  const renderItem = ({ item, index }: { item: PriceRecord; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PhoneDetail', { phoneId: item.phoneId, modelName: item.modelName })}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{item.source}</Text>
        </View>
        <Text style={styles.timeText}>{formatTimeAgo(item.crawledAt)}</Text>
      </View>

      <Text style={styles.modelName} numberOfLines={2}>{item.modelName}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.priceRow}>
          {sortMode === 'lowest' && (
            <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
              <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>{index + 1}위</Text>
            </View>
          )}
          <Text style={styles.price}>{item.price.toLocaleString()}원</Text>
        </View>
        {/* 딜 링크 바로가기 버튼 */}
        {item.sourceUrl ? (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => openDealLink(item.sourceUrl)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.linkBtnText}>딜 보기 →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 유저 정보 바 */}
      <View style={styles.userBar}>
        <Text style={styles.userBarText}>
          👤 {user?.username}
          {isAdmin ? <Text style={styles.adminBadge}>  [관리자]</Text> : ''}
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="모델명 검색 (예: 갤럭시 S25)"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>검색</Text>
        </TouchableOpacity>
        {/* 필터 버튼 */}
        <TouchableOpacity
          style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilter(!showFilter)}
        >
          <Text style={[styles.filterBtnText, filterCount > 0 && styles.filterBtnTextActive]}>
            {filterCount > 0 ? `필터 ${filterCount}` : '필터'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 필터 패널 */}
      {showFilter && (
        <View style={styles.filterPanel}>
          {/* 브랜드 */}
          <Text style={styles.filterLabel}>브랜드</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandRow}>
            {BRANDS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.brandChip, selectedBrand === b && styles.brandChipActive]}
                onPress={() => setBrand(b)}
              >
                <Text style={[styles.brandChipText, selectedBrand === b && styles.brandChipTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 가격 범위 (만원 단위 입력) */}
          <Text style={styles.filterLabel}>가격 범위 (만원)</Text>
          <View style={styles.priceRangeRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="최소 (예: 10)"
              value={minInput}
              onChangeText={setMinInput}
              keyboardType="numeric"
            />
            <Text style={styles.rangeSep}>~</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="최대 (예: 100)"
              value={maxInput}
              onChangeText={setMaxInput}
              keyboardType="numeric"
            />
          </View>

          {/* 적용/초기화 */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.filterResetBtn} onPress={resetFilter}>
              <Text style={styles.filterResetText}>초기화</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilter}>
              <Text style={styles.filterApplyText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 정렬 탭 */}
      <View style={styles.sortTabs}>
        {(['recent', 'lowest'] as SortMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.sortTab, sortMode === mode && styles.sortTabActive]}
            onPress={() => setSortMode(mode)}
          >
            <Text style={[styles.sortTabText, sortMode === mode && styles.sortTabTextActive]}>
              {mode === 'recent' ? '🕐 최신순' : '💰 가격 낮은 순'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {sortMode === 'recent' ? '최근 성지폰 목록' : '최저가 성지폰 목록'}
        </Text>
        {data && <Text style={styles.totalCount}>총 {data.pages[0]?.totalElements ?? 0}건</Text>}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : (
        <FlatList
          data={allDeals}
          keyExtractor={(item) => `${sortMode}-${item.id}`}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage
            ? <ActivityIndicator style={{ padding: 16 }} color="#1a73e8" /> : null}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1a73e8']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>데이터가 없습니다</Text>
              <Text style={styles.emptyHint}>필터를 바꾸거나 잠시 후 새로고침 해주세요</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  userBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a73e8',
  },
  userBarText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  adminBadge: { color: '#ffd54f', fontWeight: '700' },
  logoutText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline' },
  searchBar: {
    flexDirection: 'row', padding: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1, height: 38, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 10, fontSize: 13,
    backgroundColor: '#fafafa', marginRight: 6,
  },
  searchBtn: {
    backgroundColor: '#1a73e8', borderRadius: 8,
    paddingHorizontal: 12, height: 38, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  filterBtn: {
    marginLeft: 6, borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 8, paddingHorizontal: 10, height: 38, justifyContent: 'center',
  },
  filterBtnActive: { borderColor: '#1a73e8', backgroundColor: '#e8f0fe' },
  filterBtnText: { fontSize: 13, color: '#777', fontWeight: '600' },
  filterBtnTextActive: { color: '#1a73e8' },

  // 필터 패널
  filterPanel: {
    backgroundColor: '#fff', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#e8e8e8',
  },
  filterLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 4 },
  brandRow: { flexDirection: 'row', marginBottom: 10 },
  brandChip: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 8,
  },
  brandChipActive: { borderColor: '#1a73e8', backgroundColor: '#e8f0fe' },
  brandChipText: { fontSize: 13, color: '#777', fontWeight: '500' },
  brandChipTextActive: { color: '#1a73e8', fontWeight: '700' },
  priceRangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  priceInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, backgroundColor: '#fafafa',
  },
  rangeSep: { marginHorizontal: 10, fontSize: 16, color: '#888' },
  filterActions: { flexDirection: 'row', gap: 8 },
  filterResetBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  filterResetText: { color: '#666', fontWeight: '600' },
  filterApplyBtn: {
    flex: 2, backgroundColor: '#1a73e8', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  filterApplyText: { color: '#fff', fontWeight: '700' },

  // 정렬 탭
  sortTabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  sortTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  sortTabActive: { borderBottomColor: '#1a73e8' },
  sortTabText: { fontSize: 13, color: '#999', fontWeight: '600' },
  sortTabTextActive: { color: '#1a73e8' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  totalCount: { fontSize: 13, color: '#888' },
  loader: { marginTop: 60 },
  listContent: { paddingBottom: 24 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 5, padding: 14,
    borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sourceBadge: { backgroundColor: '#e8f0fe', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  sourceText: { fontSize: 11, color: '#1a73e8', fontWeight: '600' },
  timeText: { fontSize: 11, color: '#aaa' },
  modelName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 18, fontWeight: '800', color: '#e53935' },
  rankBadge: { backgroundColor: '#f0f0f0', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  rankBadgeTop: { backgroundColor: '#fff3e0' },
  rankText: { fontSize: 11, fontWeight: '700', color: '#888' },
  rankTextTop: { color: '#e65100' },
  linkBtn: {
    backgroundColor: '#e8f0fe', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  linkBtnText: { fontSize: 12, color: '#1a73e8', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: '#888' },
  emptyHint: { fontSize: 13, color: '#bbb', marginTop: 6 },
});
