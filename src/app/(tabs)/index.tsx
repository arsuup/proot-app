import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../constants/theme';

const rootNormal = require('../../../assets/images/root-cool.png');

export default function ProotHome() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroDotOne} />
          <View style={styles.heroDotTwo} />
          <View style={styles.titleBlock}>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>ROOT EST EN LIGNE</Text></View>
            <Text style={styles.eyebrow}>LE PIRE COACH ALIMENTAIRE</Text>
            <Text style={styles.title}>PROOT</Text>
            <Text style={styles.tagline}>Ton alimentation, revue et volontairement ruinée par Root.</Text>
          </View>
          <Image source={rootNormal} style={styles.heroRoot} resizeMode="contain" />
          <View style={styles.heroSticker}><Text style={styles.heroStickerText}>0%{`\n`}SÉRIEUX</Text></View>
        </View>

        <View style={styles.missionCard}>
          <View style={styles.missionBadge}><Text style={styles.missionBadgeText}>MISSION{`\n`}DU JOUR</Text></View>
          <View style={styles.missionCopy}>
            <Text style={styles.missionTitle}>Trouve le snack le plus chaotique.</Text>
            <Text style={styles.missionText}>Scanne, observe le RootScore et laisse Root célébrer les pires décisions.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionKicker}>LE CONCEPT</Text>
          <Text style={styles.sectionTitle}>Une appli qui inverse les règles.</Text>
          <Text style={styles.bodyText}>
            Plus un produit est chargé en sucre, gras, sel ou additifs, plus Root est fier. Son score est une parodie ; le rapport nutritionnel, lui, garde les chiffres réels.
          </Text>
        </View>

        <View style={styles.scoreLegend}>
          <View style={styles.legendTop}><Text style={styles.legendTitle}>L’ÉCHELLE ROOTSCORE</Text><Text style={styles.legendCaption}>à l’envers, évidemment</Text></View>
          <View style={styles.scoreTrack}><View style={styles.scoreTrackGreen} /><View style={styles.scoreTrackYellow} /><View style={styles.scoreTrackRed} /></View>
          <View style={styles.legendLabels}><Text style={styles.legendLabel}>0 · Root panique</Text><Text style={styles.legendLabel}>100 · Root adore</Text></View>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionKicker}>MODE D’EMPLOI</Text><Text style={styles.sectionTitle}>Trois étapes, zéro sagesse.</Text></View>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>01</Text>
          <View style={styles.stepLine} />
          <View style={styles.stepContent}><Text style={styles.stepTitle}>Scanne un produit</Text><Text style={styles.stepText}>Le code-barres ouvre sa fiche, sa photo et ses infos publiques.</Text></View>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>02</Text>
          <View style={styles.stepLine} />
          <View style={styles.stepContent}><Text style={styles.stepTitle}>Subis le jugement de Root</Text><Text style={styles.stepText}>Il inverse volontairement le sens du score et improvise un conseil catastrophique.</Text></View>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>03</Text>
          <View style={styles.stepLine} />
          <View style={styles.stepContent}><Text style={styles.stepTitle}>Vérifie les vrais chiffres</Text><Text style={styles.stepText}>Le rapport détaillé affiche les données Open Food Facts pour remettre Root à sa place.</Text></View>
        </View>

        <Text style={styles.exploreTitle}>L’UNIVERS DE ROOT</Text>
        <View style={styles.exploreRow}>
          <TouchableOpacity style={[styles.exploreCard, styles.chatCard]} onPress={() => router.navigate('/root-chat')}>
            <Text style={styles.exploreSymbol}>√</Text>
            <Text style={styles.exploreCardTitle}>Parle à Root</Text>
            <Text style={styles.exploreCardText}>Des conseils de régime ridicules, en direct.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exploreCard, styles.historyCard]} onPress={() => router.navigate('/groot')}>
            <Text style={styles.exploreSymbol}>◌</Text>
            <Text style={styles.exploreCardTitle}>Groot</Text>
            <Text style={styles.exploreCardText}>Retrouve tous tes scans passés.</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Proot est une parodie. Les informations viennent d’Open Food Facts ; elles ne remplacent jamais un professionnel de santé.</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 120 },
  hero: { backgroundColor: '#23211E', borderRadius: 30, minHeight: 268, overflow: 'hidden', padding: 23, position: 'relative' },
  heroGlow: { backgroundColor: '#5B521F', borderRadius: 180, height: 230, opacity: 0.65, position: 'absolute', right: -100, top: -72, width: 230 },
  heroDotOne: { backgroundColor: colors.primary, borderRadius: 6, height: 12, left: 28, opacity: 0.9, position: 'absolute', top: 115, transform: [{ rotate: '24deg' }], width: 12 },
  heroDotTwo: { borderColor: '#EAE6DE', borderRadius: 9, borderWidth: 2, bottom: 30, left: 127, opacity: 0.5, position: 'absolute', height: 14, width: 14 },
  titleBlock: { maxWidth: '62%', zIndex: 1 },
  livePill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' },
  liveDot: { backgroundColor: '#71E18D', borderRadius: 4, height: 7, width: 7 },
  liveText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 16 },
  title: { color: '#FFFFFF', fontSize: 49, fontWeight: '900', letterSpacing: -1.4, marginTop: 4 },
  tagline: { color: '#EAE6DE', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8 },
  heroRoot: { bottom: -8, height: 225, position: 'absolute', right: -17, width: 184 },
  heroSticker: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 40, bottom: 19, height: 58, justifyContent: 'center', position: 'absolute', right: 21, transform: [{ rotate: '-10deg' }], width: 58 },
  heroStickerText: { color: colors.text, fontSize: 10, fontWeight: '900', lineHeight: 11, textAlign: 'center' },
  missionCard: { alignItems: 'center', backgroundColor: '#FFF0B4', borderRadius: 20, flexDirection: 'row', gap: 13, marginTop: 15, padding: 14 },
  missionBadge: { alignItems: 'center', backgroundColor: '#23211E', borderRadius: 11, height: 52, justifyContent: 'center', width: 58 },
  missionBadgeText: { color: colors.primary, fontSize: 8, fontWeight: '900', lineHeight: 10, textAlign: 'center' },
  missionCopy: { flex: 1 },
  missionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  missionText: { color: '#6B5E28', fontSize: 11, lineHeight: 15, marginTop: 3 },
  section: { marginTop: 31 },
  sectionKicker: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  sectionTitle: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 4 },
  bodyText: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginTop: 10 },
  scoreLegend: { backgroundColor: colors.surface, borderColor: '#ECE7DD', borderRadius: 18, borderWidth: 1, marginTop: 18, padding: 15 },
  legendTop: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  legendTitle: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  legendCaption: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  scoreTrack: { borderRadius: 8, flexDirection: 'row', height: 11, marginTop: 13, overflow: 'hidden' },
  scoreTrackGreen: { backgroundColor: colors.success, flex: 1 },
  scoreTrackYellow: { backgroundColor: colors.warning, flex: 1 },
  scoreTrackRed: { backgroundColor: colors.danger, flex: 1 },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legendLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  sectionHeader: { marginTop: 33 },
  stepCard: { backgroundColor: colors.surface, borderColor: '#ECE7DD', borderRadius: 17, borderWidth: 1, flexDirection: 'row', marginTop: 10, overflow: 'hidden', padding: 15 },
  stepNumber: { color: colors.primaryDark, fontSize: 16, fontWeight: '900', width: 29 },
  stepLine: { backgroundColor: '#EDE8DE', marginHorizontal: 8, width: 1 },
  stepContent: { flex: 1 },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  stepText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  exploreTitle: { color: colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 0.8, marginTop: 32 },
  exploreRow: { flexDirection: 'row', gap: 10, marginTop: 11 },
  exploreCard: { borderRadius: 18, flex: 1, minHeight: 146, padding: 15 },
  chatCard: { backgroundColor: '#DFF3E6' },
  historyCard: { backgroundColor: '#E8E5F8' },
  exploreSymbol: { color: colors.text, fontSize: 29, fontWeight: '900' },
  exploreCardTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 16 },
  exploreCardText: { color: colors.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 3 },
  footerText: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginHorizontal: 12, marginTop: 18, textAlign: 'center' },
  scanButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 25, bottom: 18, elevation: 6, flexDirection: 'row', gap: 9, paddingHorizontal: 19, paddingVertical: 14, position: 'absolute', right: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  barcodeIcon: { flexDirection: 'row', gap: 2, height: 20, paddingVertical: 1 },
  bar: { backgroundColor: colors.text, borderRadius: 2, height: '100%' },
  scanButtonText: { color: colors.text, fontSize: 15, fontWeight: '900' },
});
