import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAppData } from '../lib/app-data';
import { fetchDailyTasks, getDailyMissionKey, getRandomDailyTasks, getSecondsUntilNextDailyMission, type DailyTask } from '../lib/daily-missions';

type MissionProgress = { completedTaskIds: string[]; date: string; gems: number; tasks: DailyTask[] };

const MISSION_PROGRESS_STORAGE_KEY = '@proot/daily-mission-progress-v2';

const hasTrackableTasks = (value: MissionProgress | null): value is MissionProgress =>
  Array.isArray(value?.tasks)
  && value.tasks.length === 3
  && value.tasks.every((task) =>
    typeof task.kind === 'string'
    && typeof task.target === 'number'
    && task.target > 0
  );

const getTaskProgress = (task: DailyTask, activity: ReturnType<typeof useAppData>['missionActivity'], date: string) => {
  if (activity.date !== date) return 0;
  switch (task.kind) {
    case 'bleach': return activity.bleach;
    case 'chat': return activity.chat;
    case 'coca-zero': return activity.cocaZero;
    case 'history-time': return activity.historySeconds;
    case 'impossible-equation': return activity.impossibleEquation;
    case 'nutrition': return activity.nutrition;
    case 'nutella': return activity.nutella;
    case 'repeat-scan': return Math.max(0, ...Object.values(activity.scanBarcodes));
    case 'root-game': return activity.rootGame;
    case 'scan': return activity.scan;
  }
};

const formatCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default function MissionsScreen() {
  const { addGems, gems, missionActivity, resetMissionActivity, resetMissionCompletionAlerts, spendGems } = useAppData();
  const [progress, setProgress] = useState<MissionProgress | null>(null);
  const [now, setNow] = useState(Date.now());
  const [rewardedTaskId, setRewardedTaskId] = useState<string | null>(null);
  const [reloadMessage, setReloadMessage] = useState<string | null>(null);

  const loadMissions = useCallback(async () => {
    const today = getDailyMissionKey();
    let savedProgress: MissionProgress | null = null;
    try {
      const rawValue = await AsyncStorage.getItem(MISSION_PROGRESS_STORAGE_KEY);
      savedProgress = rawValue ? (JSON.parse(rawValue) as MissionProgress) : null;
    } catch {
      savedProgress = null;
    }

    if (savedProgress?.date === today && hasTrackableTasks(savedProgress)) {
      setProgress(savedProgress);
      return;
    }

    setProgress({ completedTaskIds: [], date: today, gems: 0, tasks: await fetchDailyTasks() });
  }, []);

  useEffect(() => { void loadMissions(); }, [loadMissions]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (progress && progress.date !== getDailyMissionKey()) void loadMissions();
  }, [loadMissions, now, progress]);
  useEffect(() => {
    if (progress) void AsyncStorage.setItem(MISSION_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const claimTask = (task: DailyTask) => {
    const currentCount = progress ? getTaskProgress(task, missionActivity, progress.date) : 0;
    if (!progress || currentCount < task.target || progress.completedTaskIds.includes(task.id)) return;
    setProgress((current) => current ? { ...current, completedTaskIds: [...current.completedTaskIds, task.id] } : current);
    addGems(task.reward);
    setRewardedTaskId(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setRewardedTaskId(null), 1_700);
  };

  const reloadMissions = async () => {
    if (!progress) return;
    if (!spendGems(10)) {
      setReloadMessage('Il te faut 10 gemmes pour recharger les missions.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setRewardedTaskId(null);
    await resetMissionActivity();
    await resetMissionCompletionAlerts();
    setProgress((current) => current ? {
      ...current,
      completedTaskIds: [],
      tasks: getRandomDailyTasks(current.tasks.map((task) => task.id)),
    } : current);
    setReloadMessage('Trois nouvelles missions viennent d’arriver.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const completedCount = progress?.completedTaskIds.length ?? 0;
  const allTasksCompleted = completedCount === 3;
  const headerSubtitle = allTasksCompleted ? 'Root prépare déjà le prochain trio…' : 'Trois petites choses à faire, aucun conseil fiable.';

  if (!progress) return <View style={styles.loading}><ActivityIndicator color={colors.primaryDark} /></View>;

  return (
    <View style={styles.screen}>
        <View style={styles.nav}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <View style={styles.navCopy}><Text style={styles.navTitle}>MISSIONS ROOT</Text><Text style={styles.navSubtitle}>Du jour</Text></View>
        <View style={styles.gemCounter}><Text style={styles.gemIcon}>◆</Text><Text style={styles.gemCount}>{gems}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}><Text style={styles.heroKicker}>JOURNÉE EN COURS</Text><Text style={styles.progressText}>{completedCount}/3</Text></View>
          <Text style={styles.heroTitle}>{allTasksCompleted ? 'Root est impressionné. Inquiétant.' : 'Gagne des gemmes sans écouter Root.'}</Text>
          <Text style={styles.heroText}>{headerSubtitle}</Text>
          <View style={styles.countdownRow}><Text style={styles.countdownLabel}>Nouvelles missions dans</Text><Text style={styles.countdown}>{formatCountdown(getSecondsUntilNextDailyMission())}</Text></View>
        </View>
        <Text style={styles.sectionTitle}>TES 3 TÂCHES</Text>
        {progress.tasks.map((task, index) => {
          const isCompleted = progress.completedTaskIds.includes(task.id);
          const isRewarded = rewardedTaskId === task.id;
          const currentCount = getTaskProgress(task, missionActivity, progress.date);
          const visibleCount = Math.min(currentCount, task.target);
          const isVerified = currentCount >= task.target;
          const completionPercentage = `${Math.round((visibleCount / task.target) * 100)}%` as `${number}%`;
          return <View key={task.id} style={[styles.taskCard, isCompleted && styles.completedTaskCard]}>
            <View style={styles.taskNumber}><Text style={styles.taskNumberText}>0{index + 1}</Text></View>
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.taskContent}>{task.content}</Text>
              <View style={styles.taskProgressRow}><Text style={styles.taskProgressText}>{visibleCount}/{task.target}</Text><View style={styles.taskProgressTrack}><View style={[styles.taskProgressFill, { width: completionPercentage }]} /></View></View>
              <View style={styles.taskFooter}><View style={styles.rewardPill}><Text style={styles.rewardGem}>◆</Text><Text style={styles.rewardText}>+{task.reward} gemmes</Text></View>{isCompleted ? <Text style={styles.completedText}>{isRewarded ? '＋ GEMMES !' : 'TERMINÉE ✓'}</Text> : isVerified ? <Text style={styles.verifiedText}>VALIDÉE ✓</Text> : <Text style={styles.waitingText}>À faire</Text>}</View>
            </View>
            {!isCompleted ? <TouchableOpacity style={[styles.completeButton, !isVerified && styles.completeButtonDisabled]} onPress={() => claimTask(task)} disabled={!isVerified} activeOpacity={0.82}><Text style={styles.completeButtonText}>{isVerified ? `Réclamer\n+${task.reward}` : `${visibleCount}/${task.target}`}</Text></TouchableOpacity> : null}
          </View>;
        })}
        <View style={styles.note}><Text style={styles.noteTitle}>ENVIE D’UN AUTRE DÉFI ?</Text><Text style={styles.noteText}>Recharge trois nouvelles missions pour 10 gemmes. La progression des anciennes sera remplacée.</Text><TouchableOpacity style={[styles.reloadButton, gems < 10 && styles.reloadButtonLocked]} onPress={reloadMissions} activeOpacity={0.8}><Text style={styles.reloadButtonText}>Nouvelles missions · 10 ◆</Text></TouchableOpacity>{reloadMessage ? <Text style={styles.reloadMessage}>{reloadMessage}</Text> : null}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  nav: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: '#E8E3D9', borderBottomWidth: 1, flexDirection: 'row', gap: 11, paddingBottom: 14, paddingHorizontal: 18, paddingTop: 50 },
  backButton: { alignItems: 'center', backgroundColor: colors.button, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  backText: { color: colors.text, fontSize: 36, fontWeight: '400', lineHeight: 23, marginTop: -3 },
  navCopy: { flex: 1 }, navTitle: { color: colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 0.7 },
  navSubtitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  gemCounter: { alignItems: 'center', backgroundColor: '#24211E', borderRadius: 16, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 8 },
  gemIcon: { color: '#7BE3F4', fontSize: 13 }, 
  gemCount: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  content: { padding: 18, paddingBottom: 42 },
  hero: { backgroundColor: '#23211E', borderRadius: 20, overflow: 'hidden', padding: 18 },
  heroTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heroKicker: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  progressText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  heroTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', letterSpacing: -0.5, marginTop: 12 },
  heroText: { color: '#D8D4CC', fontSize: 12, lineHeight: 17, marginTop: 5 },
  countdownRow: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 11, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 11, paddingVertical: 10 },
  countdownLabel: { color: '#D8D4CC', fontSize: 10, fontWeight: '700' },
  countdown: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10, marginTop: 26 }, 
  taskCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E7E1D7', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 9, minHeight: 118, padding: 12 }, 
  completedTaskCard: { backgroundColor: '#EAF6E7', borderColor: '#9ACB93' }, 
  taskNumber: { alignItems: 'center', backgroundColor: '#F1EEE7', borderRadius: 14, height: 42, justifyContent: 'center', marginTop: -35, width: 42 }, 
  taskNumberText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' }, 
  taskCopy: { flex: 1, minWidth: 0 }, 
  taskTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, 
  taskContent: { color: colors.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 4 }, 
  taskProgressRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 9 },
  taskProgressText: { color: colors.textSecondary, fontSize: 10, fontWeight: '900', minWidth: 24 },
  taskProgressTrack: { backgroundColor: '#E3DED4', borderRadius: 5, flex: 1, height: 7, overflow: 'hidden' },
  taskProgressFill: { backgroundColor: '#4FAE49', borderRadius: 5, height: '100%' },
  taskFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, 
  rewardPill: { alignItems: 'center', backgroundColor: '#E8F7FB', borderRadius: 8, flexDirection: 'row', gap: 4, paddingHorizontal: 7, paddingVertical: 4 }, 
  rewardGem: { color: '#319CB0', fontSize: 9 }, 
  rewardText: { color: '#247585', fontSize: 9, fontWeight: '900' }, 
  completedText: { color: '#397D37', fontSize: 9, fontWeight: '900' }, 
  verifiedText: { color: '#397D37', fontSize: 9, fontWeight: '900' },
  waitingText: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  completeButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, justifyContent: 'center', minHeight: 50, paddingHorizontal: 9, width: 68 }, 
  completeButtonDisabled: { backgroundColor: '#E6E1D7' },
  completeButtonText: { color: colors.text, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  note: { backgroundColor: '#FFF3C4', borderRadius: 14, marginTop: 24, padding: 13 }, 
  noteTitle: { color: '#705D00', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 }, 
  noteText: { color: '#6B5E28', fontSize: 11, lineHeight: 16, marginTop: 4 },
  reloadButton: { alignSelf: 'flex-start', backgroundColor: '#F0C14B', borderRadius: 9, marginTop: 12, paddingHorizontal: 10, paddingVertical: 8 },
  reloadButtonLocked: { backgroundColor: '#D9CFB2' },
  reloadButtonText: { color: '#604C06', fontSize: 10, fontWeight: '900' },
  reloadMessage: { color: '#6B5E28', fontSize: 10, fontWeight: '700', marginTop: 7 },
});
