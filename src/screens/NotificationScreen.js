import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Animated, Dimensions, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS } from '../theme';
import http from '../config/http';

const NotificationScreen = ({ navigation }) => {
  const { isDark, colors } = useAppTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const exitAnim = React.useRef(new Animated.Value(0)).current;

  const handleClose = useCallback(() => {
    Animated.timing(exitAnim, {
      toValue: Dimensions.get('window').height,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.poly(4)),
    }).start(() => {
      navigation.goBack();
    });
  }, [exitAnim, navigation]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await http.get('/api/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await http.patch('/api/notifications', { id });
    } catch (err) {
      console.warn('Failed to mark notification as read', err.message);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await http.patch('/api/notifications', { markAll: true });
    } catch (err) {
      console.warn('Failed to mark all as read', err.message);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: exitAnim }] }]}>
      <SafeAreaView style={[styles.root, { backgroundColor: isDark ? '#0F172A' : '#F0F0FF' }]} edges={['top']}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={[styles.markAllText, { color: '#06b6d4' }]}>Mark all as read</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#06b6d4" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No notifications yet</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                renderItem={({ item }) => {
                  const bg = item.isRead 
                    ? (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc')
                    : (isDark ? 'rgba(6, 182, 212, 0.1)' : '#e0f2fe');
                  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

                  return (
                    <TouchableOpacity 
                      style={[styles.card, { backgroundColor: bg, borderColor: border }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!item.isRead) markAsRead(item.id);
                      }}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={[styles.cardBody, { color: colors.textMuted }]}>{item.body}</Text>
                      <Text style={[styles.cardDate, { color: isDark ? '#64748B' : '#94A3B8' }]}>{formatDate(item.createdAt)}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06b6d4',
    marginLeft: 8,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FONTS.medium,
  }
});

export default NotificationScreen;
