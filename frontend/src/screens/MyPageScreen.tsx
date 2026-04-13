import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { meApi } from '../api/me';
import { useAuth } from '../context/AuthContext';
import { useDeviceToken } from '../hooks/useDeviceToken';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function MyPageScreen() {
  const navigation  = useNavigation<Nav>();
  const { user, logout, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const deviceToken = useDeviceToken();

  // 앱 시작 시 디바이스 토큰 갱신 (푸시 알림용)
  useEffect(() => {
    if (deviceToken && user) {
      meApi.updateDeviceToken(deviceToken).catch(() => {});
    }
  }, [deviceToken, user]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: meApi.getProfile,
    enabled: !!user,
  });

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['myPosts'],
    queryFn: ({ pageParam = 0 }) => meApi.getMyPosts(pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (last) => last.hasNext ? last.page + 1 : undefined,
    enabled: !!user,
  });

  const myPosts = postsData?.pages.flatMap((p) => p.content) ?? [];

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive', onPress: async () => {
          queryClient.clear();
          await logout();
        },
      },
    ]);
  };

  if (profileLoading) {
    return <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />;
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>
      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <View style={[styles.roleBadge, isAdmin && styles.roleBadgeAdmin]}>
          <Text style={[styles.roleText, isAdmin && styles.roleTextAdmin]}>
            {isAdmin ? '👑 관리자' : '👤 일반 유저'}
          </Text>
        </View>
        <Text style={styles.joinDate}>가입일: {joinDate}</Text>
      </View>

      {/* 활동 통계 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{profile?.postCount ?? 0}</Text>
          <Text style={styles.statLabel}>작성 글</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{profile?.watchlistCount ?? 0}</Text>
          <Text style={styles.statLabel}>관심 목록</Text>
        </View>
      </View>

      {/* 관리자 전용 — 모니터링 버튼 */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.monitoringBtn}
          onPress={() => navigation.navigate('Monitoring')}
        >
          <Text style={styles.monitoringBtnText}>📊 모니터링 대시보드</Text>
        </TouchableOpacity>
      )}

      {/* 내 게시글 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내가 쓴 글</Text>
        {myPosts.length === 0 ? (
          <Text style={styles.emptyText}>아직 작성한 글이 없습니다</Text>
        ) : (
          myPosts.map((post) => (
            <View key={post.id} style={styles.postItem}>
              <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
              <View style={styles.postMeta}>
                <Text style={styles.postDate}>{timeAgo(post.createdAt)}</Text>
                {post.commentCount > 0 && (
                  <Text style={styles.postComments}>💬 {post.commentCount}</Text>
                )}
              </View>
            </View>
          ))
        )}
        {hasNextPage && (
          <TouchableOpacity style={styles.moreBtn} onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}>
            <Text style={styles.moreBtnText}>
              {isFetchingNextPage ? '로딩 중...' : '더 보기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  inner: { padding: 20, paddingBottom: 40 },
  loader: { flex: 1, marginTop: 60 },

  // 프로필 카드
  profileCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a73e8', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  username: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#e8f0fe', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10,
  },
  roleBadgeAdmin: { backgroundColor: '#fff8e1' },
  roleText: { fontSize: 13, color: '#1a73e8', fontWeight: '700' },
  roleTextAdmin: { color: '#f57c00' },
  joinDate: { fontSize: 13, color: '#aaa' },

  // 통계
  statsRow: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-around',
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: '#f0f0f0' },
  statNum: { fontSize: 26, fontWeight: '800', color: '#1a73e8', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#888' },

  // 모니터링 버튼 (관리자)
  monitoringBtn: {
    backgroundColor: '#fff8e1', borderWidth: 1.5, borderColor: '#ffd54f',
    borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16,
  },
  monitoringBtnText: { fontSize: 15, fontWeight: '700', color: '#f57c00' },

  // 내 게시글
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', paddingVertical: 16 },
  postItem: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  postTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postDate: { fontSize: 12, color: '#aaa' },
  postComments: { fontSize: 12, color: '#1a73e8' },
  moreBtn: {
    marginTop: 12, padding: 10, alignItems: 'center',
    backgroundColor: '#f0f4ff', borderRadius: 10,
  },
  moreBtnText: { fontSize: 13, color: '#1a73e8', fontWeight: '600' },

  // 로그아웃
  logoutBtn: {
    backgroundColor: '#fff0f0', borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ffcdd2',
  },
  logoutBtnText: { fontSize: 15, color: '#e53935', fontWeight: '700' },
});
