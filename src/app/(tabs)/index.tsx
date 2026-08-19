import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { useTabSwipe } from '../../lib/use-tab-swipe';

const rootNormal = require('../../../assets/images/root-cool.png');

export default function ProotHome() {
  const insets = useSafeAreaInsets();
  const tabSwipe = useTabSwipe(0);

  useEffect(() => {
    const controller = new AbortController();
    return () => controller.abort();
  }, []);

  return (
    <View style={styles.container} {...tabSwipe.panHandlers}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>LE PIRE COACH ALIMENTAIRE</Text>
            <Text style={styles.title}>(P)ROOT</Text>
            <Text style={styles.tagline}>Ton alimentation, revue et volontairement ruinée par Root.</Text>
          </View>
          <Image source={rootNormal} style={styles.heroRoot} resizeMode="contain" />
          <View style={styles.heroSticker}><Text style={styles.heroStickerText}>0%{`\n`}SÉRIEUX</Text></View>
        </View>

        <TouchableOpacity style={styles.missionCard} onPress={() => router.push('/missions')} activeOpacity={0.84}>
          <Text style={styles.missionText}>MISSIONS DU JOUR</Text>
          <Text style={styles.missionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text>LE CONCEPT</Text>
          <Text style={styles.sectionTitle}>Une appli qui inverse les règles.</Text>
          <Text style={styles.bodyText}>
            Plus un produit est chargé en sucre, gras, sel ou additifs, plus Root est content.
          </Text>
        </View>

        <View style={styles.scoreLegend}>
          <View style={styles.legendTop}><Text style={styles.legendTitle}>L'ÉCHELLE ROOTSCORE</Text></View>
          <View style={styles.scoreTrack}><View style={styles.scoreTrackGreen} /><View style={styles.scoreTrackYellow} /><View style={styles.scoreTrackRed} /></View>
          <View style={styles.legendLabels}><Text style={styles.legendLabel}>0 · Root panique</Text><Text style={styles.legendLabel}>100 · Root adore</Text></View>
        </View>
        <Text style={styles.footerText}>Proot est une parodie. Les informations viennent d'Open Food Facts ; elles ne remplacent jamais un professionnel de santé.</Text>
      </ScrollView>

      <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/scanner')} activeOpacity={0.88}>
        <View style={styles.barcodeIcon}>
          <View style={[styles.bar, { width: 2 }]} />
          <View style={[styles.bar, { width: 4 }]} />
          <View style={[styles.bar, { width: 1 }]} />
          <View style={[styles.bar, { width: 3 }]} />
          <View style={[styles.bar, { width: 2 }]} />
        </View>
        <Text style={styles.scanButtonText}>Scannez</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background,},
  content: { padding: 20,paddingBottom: 80},
  hero: { backgroundColor: colors.surfaceSecondary, borderRadius: 30, borderWidth: 1,borderColor: colors.border,minHeight: 268, overflow: 'hidden', padding: 23, position: 'relative' },
  heroGlow: {position: 'absolute', top: -72, right: -100, width: 230, height: 230, borderRadius: 180, backgroundColor: colors.primaryDark, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 60, elevation: 0 },
  titleBlock: { maxWidth: '62%', zIndex: 1 },
  eyebrow: { color: colors.primaryDark, fontSize: 12, fontWeight: '900', letterSpacing: 1.1, marginTop: 16 },
  title: { color: colors.text, fontSize: 49,fontWeight: '900', letterSpacing: -1.4,marginTop: 4 },
  tagline: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8 },
  heroRoot: { bottom: -8, height: 225, position: 'absolute', right: -17, width: 184 },
  heroSticker: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 40, bottom: 19,height: 58, justifyContent: 'center', position: 'absolute', right: 21, transform: [{ rotate: '-4deg' }], width: 58 },
  heroStickerText: { color: colors.text, fontSize: 10, fontWeight: '900', lineHeight: 11, textAlign: 'center' },
  missionCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 20, flexDirection: 'row', gap: 20, marginTop: 15, padding: 5, borderWidth: 1, borderColor: colors.border },
  missionText: { color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 10, textAlign: 'center'},
  missionArrow: { color: colors.text, fontSize: 36, fontWeight: '600', position: 'relative', top: -5 },
  section: { marginTop: 31 },
  sectionTitle: { color: colors.text,fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 4 },
  bodyText: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginTop: 10 },
  scoreLegend: { backgroundColor: colors.surface, borderRadius: 18, marginTop: 18, padding: 15, borderWidth: 1, borderColor: colors.border},
  legendTop: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  legendTitle: { color: colors.text,fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  legendCaption: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  scoreTrack: { borderRadius: 8, flexDirection: 'row', height: 11, marginTop: 13, overflow: 'hidden'},
  scoreTrackGreen: { backgroundColor: colors.success, flex: 1 },
  scoreTrackYellow: { backgroundColor: colors.warning, flex: 1 },
  scoreTrackRed: { backgroundColor: colors.danger, flex: 1 },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legendLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  footerText: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginHorizontal: 12, marginTop: 18, textAlign: 'center' },
  scanButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 25, borderWidth: 1,borderColor: colors.border,bottom: 18, elevation: 6, flexDirection: 'row', gap: 9, paddingHorizontal: 19, paddingVertical: 14, position: 'absolute', right: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  barcodeIcon: { flexDirection: 'row', gap: 2, height: 20, paddingVertical: 1 },
  bar: { backgroundColor: colors.text, borderRadius: 2, height: '100%' },
  scanButtonText: { color: colors.text, fontSize: 15, fontWeight: '900' },
});
