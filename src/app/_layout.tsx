import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppDataProvider, useAppData } from '../lib/app-data';
import { victorySoundUri } from '../lib/victory-sound';

function MissionCompletionBanner() {
  const { dismissMissionCompletionAlert, missionCompletionAlert } = useAppData();
  const player = useAudioPlayer(victorySoundUri);
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (!missionCompletionAlert) {
      translateY.setValue(-150);
      return;
    }

    translateY.setValue(-150);
    Animated.spring(translateY, {
      damping: 16,
      mass: 0.75,
      stiffness: 190,
      toValue: 0,
      useNativeDriver: true,
    }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void player.seekTo(0).catch(() => undefined).finally(() => player.play());

    const timeout = setTimeout(
      () => dismissMissionCompletionAlert(missionCompletionAlert.id),
      3_600,
    );
    return () => clearTimeout(timeout);
  }, [dismissMissionCompletionAlert, missionCompletionAlert, player, translateY]);

  if (!missionCompletionAlert) return null;

  return (
    <Animated.View style={[styles.missionBanner, { transform: [{ translateY }] }]} pointerEvents="box-none">
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.88}
        onPress={() => dismissMissionCompletionAlert(missionCompletionAlert.id)}
        style={styles.missionBannerCard}
      >
        <Text style={styles.missionBannerKicker}>✓ TÂCHE COMPLÉTÉE</Text>
        <Text style={styles.missionBannerTitle}>{missionCompletionAlert.title}</Text>
        <Text style={styles.missionBannerText}>+{missionCompletionAlert.reward} gemmes à réclamer dans les missions</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Layout() {
  return (
    <AppDataProvider>
      <View style={styles.app}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="missions" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="login" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen
          name="scanner"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <MissionCompletionBanner />
      </View>
    </AppDataProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  missionBanner: { left: 16, position: 'absolute', right: 16, top: 52, zIndex: 100 },
  missionBannerCard: {
    backgroundColor: '#256047',
    borderColor: '#75D5A5',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    shadowColor: '#12261B',
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { height: 6, width: 0 },
    elevation: 10,
  },
  missionBannerKicker: { color: '#BAF4D3', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  missionBannerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 3 },
  missionBannerText: { color: '#D9F4E4', fontSize: 11, fontWeight: '700', marginTop: 3 },
});
