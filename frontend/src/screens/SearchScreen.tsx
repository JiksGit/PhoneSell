import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { phoneApi } from '../api/phones';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Search'>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [keyword, setKeyword] = useState(route.params?.initialKeyword ?? '');
  const [submitted, setSubmitted] = useState(!!route.params?.initialKeyword);

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['phone-search', keyword],
    queryFn: () => phoneApi.searchPhones(keyword),
    enabled: submitted && keyword.length > 0,
  });

  const handleSearch = () => {
    if (keyword.trim()) {
      setSubmitted(true);
      refetch();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="모델명을 입력하세요"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>검색</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigation.navigate('PhoneDetail', { phoneId: item.id, modelName: item.modelName })}
            >
              <Text style={styles.modelName}>{item.modelName}</Text>
              <Text style={styles.brand}>{item.brand}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            submitted ? <Text style={styles.empty}>검색 결과가 없습니다</Text> : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  loader: { marginTop: 60 },
  listContent: { paddingVertical: 8 },
  resultItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  modelName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  brand: { fontSize: 13, color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 60, color: '#aaa', fontSize: 15 },
});
