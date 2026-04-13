import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PriceRecord } from '../api/client';

interface Props {
  record: PriceRecord;
  onPress?: () => void;
}

export function PhoneCard({ record, onPress }: Props) {
  const crawledDate = new Date(record.crawledAt);
  const timeAgo = getTimeAgo(crawledDate);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.modelName} numberOfLines={2}>{record.modelName}</Text>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{record.source}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{record.price.toLocaleString()}원</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modelName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  sourceBadge: {
    backgroundColor: '#e8f0fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e53935',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
});
