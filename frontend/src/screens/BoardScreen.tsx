import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, Post, Comment } from '../api/board';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

// ─── 댓글 섹션 컴포넌트 ──────────────────────────────────────────

function CommentSection({ postId }: { postId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => boardApi.getComments(postId),
  });

  const addMutation = useMutation({
    mutationFn: () => boardApi.addComment(postId, commentText.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setCommentText('');
    },
    onError: (e: Error) => Alert.alert('오류', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => boardApi.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (e: Error) => Alert.alert('오류', e.message),
  });

  const handleDeleteComment = (c: Comment) => {
    Alert.alert('댓글 삭제', '댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate(c.id) },
    ]);
  };

  const canDelete = (c: Comment) => user?.userId === c.userId || user?.role === 'ADMIN';

  return (
    <View style={cs.root}>
      <Text style={cs.title}>댓글 {comments.length}개</Text>

      {isLoading
        ? <ActivityIndicator size="small" color="#1a73e8" style={{ margin: 12 }} />
        : comments.map((c) => (
          <View key={c.id} style={cs.item}>
            <View style={cs.itemTop}>
              <Text style={cs.author}>{c.username}</Text>
              <Text style={cs.date}>{timeAgo(c.createdAt)}</Text>
              {canDelete(c) && (
                <TouchableOpacity onPress={() => handleDeleteComment(c)} style={cs.delBtn}>
                  <Text style={cs.delText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={cs.content}>{c.content}</Text>
          </View>
        ))}

      {/* 댓글 입력 */}
      {user && (
        <View style={cs.inputRow}>
          <TextInput
            style={cs.input}
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[cs.sendBtn, (!commentText.trim() || addMutation.isPending) && cs.sendBtnDisabled]}
            onPress={() => commentText.trim() && addMutation.mutate()}
            disabled={!commentText.trim() || addMutation.isPending}
          >
            <Text style={cs.sendText}>{addMutation.isPending ? '...' : '등록'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  root: { borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 12, paddingTop: 12 },
  title: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  item: {
    backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  author: { fontSize: 13, fontWeight: '700', color: '#1a73e8', flex: 1 },
  date: { fontSize: 11, color: '#aaa', marginRight: 8 },
  delBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  delText: { fontSize: 11, color: '#e53935' },
  content: { fontSize: 14, color: '#333', lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    backgroundColor: '#fafafa', maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#1a73e8', borderRadius: 10,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ─── 게시판 메인 ─────────────────────────────────────────────────

export function BoardScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [writeModal, setWriteModal]   = useState(false);
  const [detailPost, setDetailPost]   = useState<Post | null>(null);
  const [editModal,  setEditModal]    = useState<Post | null>(null);
  const [title,      setTitle]        = useState('');
  const [content,    setContent]      = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['board'],
      queryFn: ({ pageParam = 0 }) => boardApi.getPosts(pageParam as number, 20),
      initialPageParam: 0,
      getNextPageParam: (last) => last.hasNext ? last.page + 1 : undefined,
    });

  const posts = data?.pages.flatMap((p) => p.content) ?? [];

  const createMutation = useMutation({
    mutationFn: () => boardApi.createPost({ title, content }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); setWriteModal(false); setTitle(''); setContent(''); },
    onError: (e: Error) => Alert.alert('오류', e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => boardApi.updatePost(editModal!.id, { title, content }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); setEditModal(null); setTitle(''); setContent(''); },
    onError: (e: Error) => Alert.alert('오류', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => boardApi.deletePost(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); setDetailPost(null); },
    onError: (e: Error) => Alert.alert('오류', e.message),
  });

  const canModify = (p: Post) => user?.userId === p.userId || user?.role === 'ADMIN';

  const openEdit = (p: Post) => { setTitle(p.title); setContent(p.content); setDetailPost(null); setEditModal(p); };
  const openWrite = () => { setTitle(''); setContent(''); setWriteModal(true); };

  if (isLoading) return <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />;

  return (
    <View style={styles.root}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setDetailPost(item)}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.cardAuthor}>✍️ {item.username}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.cardPreview} numberOfLines={2}>{item.content}</Text>
              {item.commentCount > 0 && (
                <View style={styles.commentBadge}>
                  <Text style={styles.commentBadgeText}>💬 {item.commentCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>첫 번째 글을 작성해 보세요!</Text></View>}
        onRefresh={refetch}
        refreshing={false}
      />

      <TouchableOpacity style={styles.fab} onPress={openWrite}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ─── 글 상세 모달 (댓글 포함) ─── */}
      <Modal visible={!!detailPost} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{detailPost?.title}</Text>
              <Text style={styles.modalMeta}>
                {detailPost?.username}  ·  {detailPost ? timeAgo(detailPost.createdAt) : ''}
              </Text>
              <Text style={styles.modalContent}>{detailPost?.content}</Text>
              {/* 댓글 섹션 */}
              {detailPost && <CommentSection postId={detailPost.id} />}
            </ScrollView>
            <View style={styles.modalActions}>
              {detailPost && canModify(detailPost) && (
                <>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(detailPost!)}>
                    <Text style={styles.editBtnText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn}
                    onPress={() => Alert.alert('삭제', '삭제할까요?', [
                      { text: '취소', style: 'cancel' },
                      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate(detailPost!.id) },
                    ])}>
                    <Text style={styles.deleteBtnText}>삭제</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailPost(null)}>
                <Text style={styles.closeBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── 글쓰기/수정 모달 ─── */}
      <Modal visible={writeModal || !!editModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editModal ? '글 수정' : '새 글 쓰기'}</Text>
            <TextInput style={styles.formInput} placeholder="제목" value={title}
              onChangeText={setTitle} maxLength={200} />
            <TextInput style={[styles.formInput, styles.contentInput]} placeholder="내용을 입력하세요"
              value={content} onChangeText={setContent} multiline textAlignVertical="top" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.editBtn}
                onPress={() => editModal ? updateMutation.mutate() : createMutation.mutate()}
                disabled={createMutation.isPending || updateMutation.isPending}>
                <Text style={styles.editBtnText}>{editModal ? '수정 완료' : '등록'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn}
                onPress={() => { setWriteModal(false); setEditModal(null); }}>
                <Text style={styles.closeBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  loader: { flex: 1, marginTop: 60 },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginRight: 8 },
  cardTime: { fontSize: 11, color: '#bbb' },
  cardAuthor: { fontSize: 12, color: '#999', marginBottom: 6 },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-start' },
  cardPreview: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  commentBadge: { marginLeft: 8, backgroundColor: '#e8f0fe', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  commentBadgeText: { fontSize: 12, color: '#1a73e8', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: '#aaa' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1a73e8', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 5,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  modalMeta: { fontSize: 12, color: '#aaa', marginBottom: 16 },
  modalContent: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: '#e8f0fe', borderRadius: 10, padding: 12, alignItems: 'center' },
  editBtnText: { color: '#1a73e8', fontWeight: '700' },
  deleteBtn: { flex: 1, backgroundColor: '#fff0f0', borderRadius: 10, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: '#e53935', fontWeight: '700' },
  closeBtn: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, alignItems: 'center' },
  closeBtnText: { color: '#555', fontWeight: '600' },
  formInput: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
    backgroundColor: '#fafafa', marginBottom: 12, color: '#222',
  },
  contentInput: { height: 130, textAlignVertical: 'top' },
});
