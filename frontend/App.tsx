import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen }      from './src/screens/LoginScreen';
import { RegisterScreen }   from './src/screens/RegisterScreen';
import { HomeScreen }       from './src/screens/HomeScreen';
import { SearchScreen }     from './src/screens/SearchScreen';
import { PhoneDetailScreen } from './src/screens/PhoneDetailScreen';
import { WatchlistScreen }  from './src/screens/WatchlistScreen';
import { BoardScreen }      from './src/screens/BoardScreen';
import { MyPageScreen }     from './src/screens/MyPageScreen';
import { MonitoringScreen } from './src/screens/MonitoringScreen';

// ─── 타입 ────────────────────────────────────────────────────────

export type RootStackParamList = {
  HomeTabs:    undefined;
  PhoneDetail: { phoneId: number; modelName: string };
  Search:      { initialKeyword?: string };
  Monitoring:  undefined;  // 관리자 전용 (MyPage에서 push)
};

export type TabParamList = {
  Home:      undefined;
  SearchTab: undefined;
  Watchlist: undefined;
  Board:     undefined;
  MyPage:    undefined;
};

const AuthStackNav = createNativeStackNavigator();
const MainStack    = createNativeStackNavigator<RootStackParamList>();
const Tab          = createBottomTabNavigator<TabParamList>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5000, gcTime: 300000 },
  },
});

// ─── 탭 아이콘 ────────────────────────────────────────────────────
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', SearchTab: '🔍', Watchlist: '⭐', Board: '📋', MyPage: '👤',
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>
      {icons[name] ?? '●'}
    </Text>
  );
}

const tabScreenOptions = {
  tabBarActiveTintColor: '#1a73e8',
  tabBarInactiveTintColor: '#999',
  tabBarStyle: { paddingBottom: 4, height: 60 },
  headerStyle: { backgroundColor: '#1a73e8' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
};

// ─── 공통 탭 (유저/관리자 동일, 관리자는 MyPage에서 모니터링 접근) ──
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ title: '홈',       tabBarLabel: '홈' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen}    options={{ title: '검색',     tabBarLabel: '검색' }} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} options={{ title: '관심 목록', tabBarLabel: '관심' }} />
      <Tab.Screen name="Board"     component={BoardScreen}     options={{ title: '게시판',   tabBarLabel: '게시판' }} />
      <Tab.Screen name="MyPage"    component={MyPageScreen}    options={{ title: '마이페이지', tabBarLabel: '마이' }} />
    </Tab.Navigator>
  );
}

// ─── 로그인/회원가입 전환 Wrapper ────────────────────────────────
function AuthRootScreen() {
  const [showRegister, setShowRegister] = useState(false);
  return showRegister
    ? <RegisterScreen onGoLogin={() => setShowRegister(false)} />
    : <LoginScreen   onGoRegister={() => setShowRegister(true)} />;
}

// ─── 로그인 후 스택 ───────────────────────────────────────────────
function MainNavigator() {
  const { isAdmin } = useAuth();
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="HomeTabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="PhoneDetail"
        component={PhoneDetailScreen}
        options={({ route }) => ({
          title: route.params.modelName,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
          headerBackTitle: '',
        })}
      />
      <MainStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: '검색', headerStyle: { backgroundColor: '#1a73e8' }, headerTintColor: '#fff', headerBackTitle: '' }}
      />
      {/* 모니터링 — 관리자만 접근 (MyPage에서 navigate) */}
      {isAdmin && (
        <MainStack.Screen
          name="Monitoring"
          component={MonitoringScreen}
          options={{ title: '모니터링 대시보드', headerStyle: { backgroundColor: '#1a73e8' }, headerTintColor: '#fff' }}
        />
      )}
    </MainStack.Navigator>
  );
}

// ─── 루트 네비게이터 ─────────────────────────────────────────────
function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <>
      {!user ? (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <AuthStackNav.Screen name="AuthRoot" component={AuthRootScreen} />
        </AuthStackNav.Navigator>
      ) : (
        <MainNavigator />
      )}
    </>
  );
}

// ─── 앱 루트 ─────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
