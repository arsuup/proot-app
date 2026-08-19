import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, type ImageSourcePropType, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { useAppData } from '../../lib/app-data';
import { useTabSwipe } from '../../lib/use-tab-swipe';

const rootClassic = require('../../../assets/images/root-cool.png');
const rootDripBasic = require('../../../assets/images/root-drip-basic.png');
const rootDripFull = require('../../../assets/images/root-drip.png');
const rootBlingBasic = require('../../../assets/images/root-bling-basic.png');
const rootBlingFull = require('../../../assets/images/root-bling-full.png');

type SkinCardProps = {
  accent: string;
  actionLabel: string;
  badge: string;
  description: string;
  disabled?: boolean;
  equipped?: boolean;
  image: ImageSourcePropType;
  kicker: string;
  locked?: boolean;
  onPress: () => void;
  title: string;
};

function SkinCard({ accent, actionLabel, badge, description, disabled, equipped, image, kicker, locked, onPress, title }: SkinCardProps) {
  return (
    <View style={styles.productCard}>
      <View style={[styles.productGlow, { backgroundColor: accent }]} />
      <View style={[styles.badge, { backgroundColor: accent }]}><Text style={styles.badgeText}>{badge}</Text></View>
      <Image source={image} style={styles.skinImage} resizeMode="contain" />
      <View style={styles.productCopy}>
        <Text style={[styles.productKicker, { color: accent }]}>{kicker}</Text>
        <Text style={styles.productName}>{title}</Text>
        <Text style={styles.productDescription}>{description}</Text>
        <View style={styles.includes}><Text style={styles.includesText}>✓ Visible dans le chatbot Root</Text></View>
        <TouchableOpacity style={[styles.buyButton, { backgroundColor: accent }, equipped && styles.equippedButton, locked && styles.lockedButton]} onPress={onPress} disabled={disabled} activeOpacity={0.84}>
          <Text style={[styles.buyButtonText, equipped && styles.equippedButtonText]}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SkinCarouselCard({ levels }: { levels: [SkinCardProps, SkinCardProps] }) {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [nextAutoDelay, setNextAutoDelay] = useState(5_000);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const showLevel = useCallback((nextLevel: number, isManual = false) => {
    if (nextLevel === selectedLevel) return;
    const direction = nextLevel > selectedLevel ? 1 : -1;
    Animated.parallel([
      Animated.timing(opacity, { duration: 130, toValue: 0, useNativeDriver: true }),
      Animated.timing(translateX, { duration: 130, toValue: direction * -16, useNativeDriver: true }),
    ]).start(() => {
      setSelectedLevel(nextLevel);
      setNextAutoDelay(isManual ? 10_000 : 5_000);
      translateX.setValue(direction * 16);
      Animated.parallel([
        Animated.timing(opacity, { duration: 190, toValue: 1, useNativeDriver: true }),
        Animated.spring(translateX, { damping: 18, stiffness: 220, toValue: 0, useNativeDriver: true }),
      ]).start();
    });
  }, [opacity, selectedLevel, translateX]);

  useEffect(() => {
    const timer = setTimeout(() => showLevel(selectedLevel === 0 ? 1 : 0), nextAutoDelay);
    return () => clearTimeout(timer);
  }, [nextAutoDelay, selectedLevel, showLevel]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -42) showLevel(1, true);
      if (gesture.dx > 42) showLevel(0, true);
    },
  }), [showLevel]);

  const level = levels[selectedLevel];
  return (
    <View style={styles.productCard}>
      <Animated.View style={{ opacity, transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={[styles.productGlow, { backgroundColor: level.accent }]} />
        <View style={[styles.badge, { backgroundColor: level.accent }]}><Text style={styles.badgeText}>{level.badge}</Text></View>
        <Image source={level.image} style={styles.skinImage} resizeMode="contain" />
        <View style={styles.productCopy}>
          <Text style={[styles.productKicker, { color: level.accent }]}>{level.kicker}</Text>
          <Text style={styles.productName}>{level.title}</Text>
          <Text style={styles.productDescription}>{level.description}</Text>
          <View style={styles.includes}><Text style={styles.includesText}>✓ Visible dans le chatbot Root</Text></View>
          <TouchableOpacity style={[styles.buyButton, { backgroundColor: level.accent }, level.equipped && styles.equippedButton, level.locked && styles.lockedButton]} onPress={level.onPress} disabled={level.disabled} activeOpacity={0.84}>
            <Text style={[styles.buyButtonText, level.equipped && styles.equippedButtonText]}>{level.actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      <View style={styles.levelIndicator} pointerEvents="none">
        <View style={[styles.levelLine, selectedLevel === 0 && [styles.activeLevelLine, { backgroundColor: levels[0].accent }]]} />
        <View style={[styles.levelLine, selectedLevel === 1 && [styles.activeLevelLine, { backgroundColor: levels[1].accent }]]} />
      </View>
    </View>
  );
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const {
    buyRootBlingBasicSkin,
    buyRootBlingFullUpgrade,
    buyRootDripBasicSkin,
    buyRootDripFullUpgrade,
    equippedRootSkin,
    equipRootSkin,
    gems,
    ownedRootSkins,
  } = useAppData();
  const tabSwipe = useTabSwipe(3);
  const [notice, setNotice] = useState<string | null>(null);
  const classicEquipped = equippedRootSkin === 'classic';
  const ownsDripBasic = ownedRootSkins.includes('drip-basic');
  const ownsDripFull = ownedRootSkins.includes('drip-full');
  const ownsBlingBasic = ownedRootSkins.includes('bling-basic');
  const ownsBlingFull = ownedRootSkins.includes('bling-full');
  const dripBasicEquipped = equippedRootSkin === 'drip-basic';
  const dripFullEquipped = equippedRootSkin === 'drip-full';
  const blingBasicEquipped = equippedRootSkin === 'bling-basic';
  const blingFullEquipped = equippedRootSkin === 'bling-full';

  const equipClassic = () => {
    if (classicEquipped) return;
    equipRootSkin('classic');
    setNotice('Skin de base équipé dans le chat Root.');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const buyDripBasic = () => {
    if (dripBasicEquipped) return;
    if (ownsDripBasic) {
      equipRootSkin('drip-basic');
      setNotice('ROOT DRIP léger équipé.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (buyRootDripBasicSkin() === 'insufficient_gems') {
      setNotice('Il te manque des gemmes. Termine des missions !');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setNotice('ROOT DRIP léger acheté et équipé !');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const buyDripFull = () => {
    if (dripFullEquipped) return;
    if (ownsDripFull) {
      equipRootSkin('drip-full');
      setNotice('ROOT DRIP complet équipé.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    const result = buyRootDripFullUpgrade();
    if (result === 'requires_basic') {
      setNotice('Achète ROOT DRIP léger avant son amélioration.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (result === 'insufficient_gems') {
      setNotice('Il te manque des gemmes pour la tenue complète.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setNotice('ROOT DRIP complet débloqué et équipé !');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const buyBlingBasic = () => {
    if (blingBasicEquipped) return;
    if (ownsBlingBasic) {
      equipRootSkin('bling-basic');
      setNotice('ROOT BLING niveau 1 équipé.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (buyRootBlingBasicSkin() === 'insufficient_gems') {
      setNotice('Il te faut 50 gemmes pour commencer à briller.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setNotice('ROOT BLING niveau 1 acheté et équipé !');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const buyBlingFull = () => {
    if (blingFullEquipped) return;
    if (ownsBlingFull) {
      equipRootSkin('bling-full');
      setNotice('ROOT BLING ultime équipé.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    const result = buyRootBlingFullUpgrade();
    if (result === 'requires_basic') {
      setNotice('ROOT BLING niveau 1 est nécessaire avant la couronne.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (result === 'insufficient_gems') {
      setNotice('Il te faut 100 gemmes pour l’amélioration ultime.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setNotice('ROOT BLING ultime débloqué et équipé !');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.screen} {...tabSwipe.panHandlers}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.kicker}>ROOT MARKET</Text><Text style={styles.title}>Boutique</Text><Text style={styles.subtitle}>Du style, aucune utilité. Root approuve.</Text></View>
          <View style={styles.wallet}><Text style={styles.walletGem}>◆</Text><Text style={styles.walletValue}>{gems}</Text></View>
        </View>

        <SkinCard accent="#F09A2D" actionLabel={classicEquipped ? 'Équipé ✓' : 'Équiper le skin de base'} badge="GRATUIT" description="Root dans sa forme originale : orange, simple, et toujours aussi peu fiable." disabled={classicEquipped} equipped={classicEquipped} image={rootClassic} kicker="SKIN ROOT" onPress={equipClassic} title="ROOT CLASSIQUE" />
        <SkinCarouselCard levels={[
          { accent: '#F2C450', actionLabel: dripBasicEquipped ? 'Équipé ✓' : ownsDripBasic ? 'Équiper' : 'Acheter · 10 ◆', badge: 'DRIP · NIVEAU 1', description: 'Veste noire, détails dorés, lunettes et baskets. Pas de pantalon : le début du style selon Root.', disabled: dripBasicEquipped, equipped: dripBasicEquipped, image: rootDripBasic, kicker: 'SKIN ROOT', locked: !ownsDripBasic && gems < 10, onPress: buyDripBasic, title: 'ROOT DRIP LÉGER' },
          { accent: '#8BE2F0', actionLabel: dripFullEquipped ? 'Équipé ✓' : ownsDripFull ? 'Équiper' : 'Améliorer · 20 ◆', badge: 'DRIP · NIVEAU 2', description: 'La tenue ROOT DRIP complète, avec le pantalon noir assorti. Enfin une tenue qui tient debout.', disabled: dripFullEquipped, equipped: dripFullEquipped, image: rootDripFull, kicker: 'AMÉLIORATION ROOT DRIP', locked: !ownsDripFull && (!ownsDripBasic || gems < 20), onPress: buyDripFull, title: 'TENUE COMPLÈTE' },
        ]} />
        <SkinCarouselCard levels={[
          { accent: '#FFE36C', actionLabel: blingBasicEquipped ? 'Équipé ✓' : ownsBlingBasic ? 'Équiper' : 'Acheter · 50 ◆', badge: 'BLING · NIVEAU 1', description: 'Veste blanche, chaînes dorées, montre diamantée : Root commence à devenir beaucoup trop riche.', disabled: blingBasicEquipped, equipped: blingBasicEquipped, image: rootBlingBasic, kicker: 'SKIN ROOT BLING', locked: !ownsBlingBasic && gems < 50, onPress: buyBlingBasic, title: 'ROOT BLING' },
          { accent: '#C79AFF', actionLabel: blingFullEquipped ? 'Équipé ✓' : ownsBlingFull ? 'Équiper' : 'Améliorer · 100 ◆', badge: 'BLING · NIVEAU 2', description: 'Veste royale violette, couronne et diamants partout. Root n’a plus aucune limite.', disabled: blingFullEquipped, equipped: blingFullEquipped, image: rootBlingFull, kicker: 'AMÉLIORATION ROOT BLING', locked: !ownsBlingFull && (!ownsBlingBasic || gems < 100), onPress: buyBlingFull, title: 'ROOT BLING ULTIME' },
        ]} />

        {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}
        <Text style={styles.footer}>Tes skins sont sauvegardés sur cet appareil.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 36 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  kicker: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.1, marginTop: 2 },
  subtitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 1 },
  wallet: { alignItems: 'center', backgroundColor: '#25221F', borderRadius: 17, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  walletGem: { color: '#77E6F7', fontSize: 14 },
  walletValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  productCard: { backgroundColor: '#24211E', borderColor: '#39342E', borderRadius: 25, borderWidth: 1, marginBottom: 16, minHeight: 520, overflow: 'hidden', padding: 20, position: 'relative' },
  productGlow: { borderRadius: 180, height: 260, opacity: 0.34, position: 'absolute', right: -92, top: -94, width: 260 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: '#332715', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  skinImage: { alignSelf: 'center', height: 250, marginTop: -3, width: '100%' },
  productCopy: { marginTop: -8 },
  productKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  productName: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', letterSpacing: -0.7, marginTop: 1 },
  productDescription: { color: '#D3CEC5', fontSize: 12, lineHeight: 17, marginTop: 6 },
  includes: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginTop: 12, paddingHorizontal: 8, paddingVertical: 6 },
  includesText: { color: '#F3EEE4', fontSize: 10, fontWeight: '800' },
  buyButton: { alignItems: 'center', borderRadius: 12, marginTop: 17, paddingVertical: 13 },
  lockedButton: { backgroundColor: '#83775D' },
  equippedButton: { backgroundColor: '#DDF2DF', borderColor: '#87BD8A', borderWidth: 1 },
  buyButtonText: { color: '#2B251B', fontSize: 13, fontWeight: '900' },
  equippedButtonText: { color: '#376E39' },
  levelIndicator: { alignItems: 'center', bottom: 12, flexDirection: 'row', gap: 6, justifyContent: 'center', left: 0, position: 'absolute', right: 0 },
  levelLine: { backgroundColor: '#5B564E', borderRadius: 3, height: 4, width: 36 },
  activeLevelLine: { width: 50 },
  notice: { backgroundColor: '#E4F4E1', borderColor: '#9DCB97', borderRadius: 13, borderWidth: 1, marginTop: 2, padding: 12 },
  noticeText: { color: '#39743A', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  footer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginHorizontal: 12, marginTop: 21, textAlign: 'center' },
});
