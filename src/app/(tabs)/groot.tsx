import { router } from 'expo-router';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { colors } from '../../../constants/theme';
import { type ScanHistoryItem, useAppData } from '../../lib/app-data';

const rootNormal = require('../../../assets/images/root-cool.png');

const nutritionGradeColors: Record<string, string> = {
  A: '#16803C', B: '#4FAE49', C: '#F5B90B', D: '#F08223', E: '#DD2E2E',
};

const formatDate = (date: string) => new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(date));

const formatAmount = (value?: number) => value === undefined ? '—' : `${value.toLocaleString('fr-BE')} g`;
const formatEnergy = (value?: number) => value === undefined ? '—' : `${Math.round(value).toLocaleString('fr-BE')} kcal`;

function HistoryReport({ scan, onClose }: { scan: ScanHistoryItem; onClose: () => void }) {
  const grade = scan.nutritionGrade?.toUpperCase();
  const gradeColor = grade ? nutritionGradeColors[grade] ?? colors.textMuted : colors.textMuted;
  const nutrients = scan.nutriments;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.reportScreen}>
        <View style={styles.reportNav}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>‹</Text></TouchableOpacity>
          <Text style={styles.reportNavTitle}>RAPPORT DU SCAN</Text>
          <View style={styles.closeButtonPlaceholder} />
        </View>
        <ScrollView contentContainerStyle={styles.reportContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reportProductTop}>
            <View style={styles.reportProductImageFrame}>
              {scan.image ? <Image source={{ uri: scan.image }} style={styles.reportProductImage} resizeMode="contain" /> : <Text style={styles.noImage}>?</Text>}
            </View>
            <View style={styles.reportProductInfo}>
              <Text style={styles.reportProductName}>{scan.productName}</Text>
              {scan.brand ? <Text style={styles.reportBrand}>{scan.brand}</Text> : null}
              <Text style={styles.reportDate}>Scanné le {formatDate(scan.scannedAt)}</Text>
            </View>
          </View>

          <View style={styles.rootScoreCard}>
            <Image source={rootNormal} style={styles.reportRoot} resizeMode="contain" />
            <View style={styles.rootScoreCopy}>
              <Text style={styles.rootScoreLabel}>LE VERDICT DE ROOT</Text>
              <Text style={[styles.rootScoreTitle, { color: scan.verdictColor }]}>{scan.verdictTitle}</Text>
            </View>
            <View style={[styles.reportScore, { borderColor: scan.verdictColor }]}><Text style={[styles.reportScoreNumber, { color: scan.verdictColor }]}>{scan.rootScore}</Text><Text style={styles.reportScoreCaption}>ROOT</Text></View>
          </View>

          <Text style={styles.realDataTitle}>LES VRAIES VALEURS</Text>
          {nutrients ? (
            <View style={styles.reportPanel}>
              <View style={styles.reportPanelTop}>
                <View><Text style={styles.reportPanelTitle}>RAPPORT NUTRITIONNEL</Text><Text style={styles.reportPanelSubtitle}>Informations pour 100 g</Text></View>
                <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}><Text style={styles.gradeSmall}>NUTRI</Text><Text style={styles.gradeBig}>{grade ?? '—'}</Text></View>
              </View>
              <View style={styles.energyCard}><Text style={styles.energyLabel}>ÉNERGIE</Text><Text style={styles.energyValue}>{formatEnergy(nutrients['energy-kcal_100g'])}</Text><Text style={styles.energyCaption}>pour 100 g de produit</Text></View>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionCell}><Text style={styles.nutritionNumber}>{formatAmount(nutrients.sugars_100g)}</Text><Text style={styles.nutritionLabel}>Sucres</Text></View>
                <View style={styles.nutritionCell}><Text style={styles.nutritionNumber}>{formatAmount(nutrients.fat_100g)}</Text><Text style={styles.nutritionLabel}>Matières grasses</Text></View>
                <View style={styles.nutritionCell}><Text style={styles.nutritionNumber}>{formatAmount(nutrients['saturated-fat_100g'])}</Text><Text style={styles.nutritionLabel}>Dont saturées</Text></View>
                <View style={styles.nutritionCell}><Text style={styles.nutritionNumber}>{formatAmount(nutrients.salt_100g)}</Text><Text style={styles.nutritionLabel}>Sel</Text></View>
                <View style={styles.nutritionCell}><Text style={styles.nutritionNumber}>{formatAmount(nutrients.proteins_100g)}</Text><Text style={styles.nutritionLabel}>Protéines</Text></View>
                <View style={styles.nutritionCell}><Text style={styles.nutritionNumber}>{formatAmount(nutrients.fiber_100g)}</Text><Text style={styles.nutritionLabel}>Fibres</Text></View>
              </View>
              <View style={styles.additivesRow}><Text style={styles.additivesLabel}>Additifs déclarés</Text><Text style={styles.additivesValue}>{nutrients.additives_n ?? '—'}</Text></View>
              <View style={styles.sourceNote}><Text style={styles.sourceNoteTitle}>SOURCE</Text><Text style={styles.sourceNoteText}>Données issues d’Open Food Facts et conservées lors du scan. Root ne change pas ces chiffres.</Text></View>
            </View>
          ) : (
            <View style={styles.missingData}><Text style={styles.missingDataTitle}>Rapport non disponible pour ce vieux scan.</Text><Text style={styles.missingDataText}>Les nouveaux scans sauvegardent toutes les valeurs réelles. Rescannne ce produit une fois pour mettre sa fiche à jour.</Text></View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GrootScreen() {
  const { clearHistory, history, signOut, user } = useAppData();
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);

  const confirmClearHistory = () => {
    Alert.alert('Effacer l’historique ?', 'Les scans enregistrés sur cet appareil seront supprimés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => void clearHistory() },
    ]);
  };

  const logout = () => void signOut().then(() => router.replace('/'));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.title}>GROOT</Text><Text style={styles.subtitle}>Tes scans passés</Text></View>
        <TouchableOpacity style={styles.logoutButton} onPress={user ? logout : () => router.push('/login')}><Text style={styles.logoutText}>{user ? 'Déconnexion' : 'Connexion'}</Text></TouchableOpacity>
      </View>

      {user ? <View style={styles.profileRow}><Image source={user.picture ? { uri: user.picture } : rootNormal} style={styles.profileImage} resizeMode="cover" /><View><Text style={styles.profileName}>{user.name}</Text><Text style={styles.profileCaption}>Historique local du téléphone</Text></View></View> : null}

      <View style={styles.historyHeading}>
        <Text style={styles.historyTitle}>{history.length ? `${history.length} produit${history.length > 1 ? 's' : ''}` : 'Aucun scan'}</Text>
        {history.length ? <TouchableOpacity onPress={confirmClearHistory}><Text style={styles.clearText}>Effacer</Text></TouchableOpacity> : null}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}><Image source={rootNormal} style={styles.emptyRoot} resizeMode="contain" /><Text style={styles.emptyTitle}>Groot attend ton premier scan.</Text><Text style={styles.emptyText}>Retourne dans Proot, scanne un produit et son rapport apparaîtra ici.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {history.map((scan) => (
            <TouchableOpacity key={scan.id} style={styles.scanCard} onPress={() => setSelectedScan(scan)} activeOpacity={0.82}>
              <View style={styles.productImageFrame}>{scan.image ? <Image source={{ uri: scan.image }} style={styles.productImage} resizeMode="contain" /> : <Text style={styles.noImage}>?</Text>}</View>
              <View style={styles.scanInfo}><Text numberOfLines={2} style={styles.productName}>{scan.productName}</Text>{scan.brand ? <Text numberOfLines={1} style={styles.brand}>{scan.brand}</Text> : null}<Text style={styles.date}>{formatDate(scan.scannedAt)} · Appuie pour le rapport</Text></View>
              <View style={[styles.score, { borderColor: scan.verdictColor }]}><Text style={[styles.scoreNumber, { color: scan.verdictColor }]}>{scan.rootScore}</Text><Text style={styles.scoreLabel}>ROOT</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {selectedScan ? <HistoryReport scan={selectedScan} onClose={() => setSelectedScan(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: -2 },
  logoutButton: { backgroundColor: colors.button, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  logoutText: { color: colors.textSecondary, fontSize: 11, fontWeight: '900' },
  profileRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#ECE7DD', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 20, padding: 11 },
  profileImage: { backgroundColor: '#F2F0EB', borderRadius: 20, height: 40, width: 40 },
  profileName: { color: colors.text, fontSize: 14, fontWeight: '900' },
  profileCaption: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  historyHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 24 },
  historyTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  clearText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 55, paddingHorizontal: 35 },
  emptyRoot: { height: 150, width: 150 },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  list: { gap: 11, paddingBottom: 26 },
  scanCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#ECE7DD', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 10 },
  productImageFrame: { alignItems: 'center', backgroundColor: '#F5F4F0', borderRadius: 12, height: 62, justifyContent: 'center', overflow: 'hidden', width: 55 },
  productImage: { height: 56, width: 49 },
  noImage: { color: colors.textMuted, fontSize: 25, fontWeight: '900' },
  scanInfo: { flex: 1, minWidth: 0 },
  productName: { color: colors.text, fontSize: 14, fontWeight: '900', lineHeight: 18 },
  brand: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  score: { alignItems: 'center', borderRadius: 18, borderWidth: 2, justifyContent: 'center', minHeight: 49, minWidth: 49, paddingHorizontal: 3 },
  scoreNumber: { fontSize: 17, fontWeight: '900', lineHeight: 19 },
  scoreLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '900' },
  reportScreen: { backgroundColor: colors.background, flex: 1 },
  reportNav: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: '#E8E3D9', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14, paddingHorizontal: 18, paddingTop: 50 },
  closeButton: { alignItems: 'center', backgroundColor: colors.button, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  closeText: { color: colors.text, fontSize: 30, fontWeight: '400', lineHeight: 23, marginTop: -3 },
  closeButtonPlaceholder: { width: 36 },
  reportNavTitle: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  reportContent: { padding: 18, paddingBottom: 42 },
  reportProductTop: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  reportProductImageFrame: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E8E3D9', borderRadius: 16, borderWidth: 1, height: 93, justifyContent: 'center', overflow: 'hidden', width: 83 },
  reportProductImage: { height: 86, width: 76 },
  reportProductInfo: { flex: 1 },
  reportProductName: { color: colors.text, fontSize: 19, fontWeight: '900', lineHeight: 23 },
  reportBrand: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  reportDate: { color: colors.textMuted, fontSize: 11, marginTop: 8 },
  rootScoreCard: { alignItems: 'center', backgroundColor: '#23211E', borderRadius: 18, flexDirection: 'row', marginTop: 18, minHeight: 104, overflow: 'hidden', padding: 12 },
  reportRoot: { height: 88, marginLeft: -11, width: 88 },
  rootScoreCopy: { flex: 1 },
  rootScoreLabel: { color: '#D5D0C8', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  rootScoreTitle: { fontSize: 14, fontWeight: '900', lineHeight: 18, marginTop: 4 },
  reportScore: { alignItems: 'center', backgroundColor: '#23211E', borderRadius: 30, borderWidth: 3, height: 58, justifyContent: 'center', width: 58 },
  reportScoreNumber: { fontSize: 21, fontWeight: '900', lineHeight: 23 },
  reportScoreCaption: { color: '#D5D0C8', fontSize: 7, fontWeight: '900' },
  realDataTitle: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.9, marginTop: 26 },
  reportPanel: { backgroundColor: '#F9F8F5', borderColor: '#E6E1D7', borderRadius: 18, borderWidth: 1, marginTop: 10, overflow: 'hidden', padding: 16 },
  reportPanelTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  reportPanelTitle: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.4 },
  reportPanelSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  gradeBadge: { alignItems: 'center', borderRadius: 10, minWidth: 44, paddingHorizontal: 7, paddingVertical: 5 },
  gradeSmall: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  gradeBig: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', lineHeight: 21 },
  energyCard: { backgroundColor: '#23211E', borderRadius: 13, marginTop: 15, padding: 14 },
  energyLabel: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  energyValue: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 3 },
  energyCaption: { color: '#CCC8BE', fontSize: 10, marginTop: 1 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  nutritionCell: { backgroundColor: '#FFFFFF', borderRadius: 10, minHeight: 62, padding: 10, width: '31.5%' },
  nutritionNumber: { color: colors.text, fontSize: 12, fontWeight: '900' },
  nutritionLabel: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, marginTop: 4 },
  additivesRow: { alignItems: 'center', backgroundColor: '#EEEAE1', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, paddingHorizontal: 11, paddingVertical: 10 },
  additivesLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  additivesValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  sourceNote: { backgroundColor: '#FFF3C4', borderRadius: 10, marginTop: 15, padding: 11 },
  sourceNoteTitle: { color: '#705D00', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  sourceNoteText: { color: '#6B5E28', fontSize: 10, lineHeight: 14, marginTop: 4 },
  missingData: { backgroundColor: '#FFF3C4', borderRadius: 16, marginTop: 10, padding: 17 },
  missingDataTitle: { color: '#705D00', fontSize: 14, fontWeight: '900' },
  missingDataText: { color: '#6B5E28', fontSize: 12, lineHeight: 18, marginTop: 5 },
});
