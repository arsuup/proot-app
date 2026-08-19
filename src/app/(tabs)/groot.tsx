import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { type ScanHistoryItem, useAppData } from '../../lib/app-data';
import { useTabSwipe } from '../../lib/use-tab-swipe';

const rootNormal = require('../../../assets/images/root-cool.png');

const nutritionGradeColors: Record<string, string> = {
  A: '#16803C', B: '#4FAE49', C: '#F5B90B', D: '#F08223', E: '#DD2E2E',
};

const formatDate = (date: string) => new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(date));

const formatAmount = (value?: number) => value === undefined ? '—' : `${value.toLocaleString('fr-BE')} g`;
const formatEnergy = (value?: number) => value === undefined ? '—' : `${Math.round(value).toLocaleString('fr-BE')} kcal`;

function SwipeableHistoryCard({
  onDelete,
  onFavorite,
  onOpen,
  scan,
}: {
  onDelete: () => void;
  onFavorite: () => void;
  onOpen: () => void;
  scan: ScanHistoryItem;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const resetPosition = useCallback(() => {
    Animated.spring(translateX, { damping: 18, stiffness: 230, toValue: 0, useNativeDriver: true }).start();
  }, [translateX]);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      Math.abs(gesture.dx) > 7 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 7 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => translateX.setValue(Math.max(-108, Math.min(108, gesture.dx))),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx <= -68) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.timing(translateX, { duration: 140, toValue: -94, useNativeDriver: true }).start(({ finished }) => {
          if (!finished) return;
          translateX.setValue(0);
          onFavorite();
        });
        return;
      }
      if (gesture.dx >= 68) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Animated.timing(translateX, { duration: 170, toValue: 360, useNativeDriver: true }).start(({ finished }) => {
          if (finished) onDelete();
        });
        return;
      }
      resetPosition();
    },
    onPanResponderTerminate: resetPosition,
  }), [onDelete, onFavorite, resetPosition, translateX]);

  return (
    <View style={styles.swipeShell}>
      <View style={[styles.swipeAction, styles.deleteAction]}><Text style={styles.swipeActionIcon}>⌫</Text><Text style={styles.swipeActionText}>Supprimer</Text></View>
      <View style={[styles.swipeAction, styles.favoriteAction]}><Text style={styles.swipeActionIcon}>★</Text><Text style={styles.swipeActionText}>Favori</Text></View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.scanCard} onPress={onOpen} activeOpacity={0.82}>
          <View style={styles.productImageFrame}>{scan.image ? <Image source={{ uri: scan.image }} style={styles.productImage} resizeMode="contain" /> : <Text style={styles.noImage}>?</Text>}</View>
          <View style={styles.scanInfo}>
            <View style={styles.productNameRow}>
              <Text numberOfLines={2} style={styles.productName}>{scan.productName}</Text>
              {scan.isFavorite ? <Text accessibilityLabel="Produit favori" style={styles.favoriteStar}>★</Text> : null}
            </View>
            {scan.brand ? <Text numberOfLines={1} style={styles.brand}>{scan.brand}</Text> : null}
            <Text style={styles.date}>{formatDate(scan.scannedAt)} · Appuie pour le rapport</Text>
          </View>
          <View style={[styles.score, { borderColor: scan.verdictColor }]}><Text style={[styles.scoreNumber, { color: scan.verdictColor }]}>{scan.rootScore}</Text><Text style={styles.scoreLabel}>ROOT</Text></View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function HistoryReport({ scan, onClose }: { scan: ScanHistoryItem; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const grade = scan.nutritionGrade?.toUpperCase();
  const gradeColor = grade ? nutritionGradeColors[grade] ?? colors.overlay : colors.overlay;
  const nutrients = scan.nutriments;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.reportScreen}>
        <View style={[styles.reportNav, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>‹</Text></TouchableOpacity>
          <Text style={styles.reportNavTitle}>RAPPORT DU SCAN</Text>
          <View style={styles.closeButtonPlaceholder} />
        </View>
        <ScrollView contentContainerStyle={styles.reportContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reportProductTop}>
            <View style={styles.reportProductImageFrame}>{scan.image ? <Image source={{ uri: scan.image }} style={styles.reportProductImage} resizeMode="contain" /> : <Text style={styles.noImage}>?</Text>}</View>
            <View style={styles.reportProductInfo}>
              <Text style={styles.reportProductName}>{scan.productName}</Text>
              {scan.brand ? <Text style={styles.reportBrand}>{scan.brand}</Text> : null}
              <Text style={styles.reportDate}>Scanné le {formatDate(scan.scannedAt)}</Text>
            </View>
          </View>
          <View style={styles.rootScoreCard}>
            <Image source={rootNormal} style={styles.reportRoot} resizeMode="contain" />
            <View style={styles.rootScoreCopy}><Text style={styles.rootScoreLabel}>LE VERDICT DE ROOT</Text><Text style={[styles.rootScoreTitle, { color: scan.verdictColor }]}>{scan.verdictTitle}</Text></View>
            <View style={[styles.reportScore, { borderColor: scan.verdictColor }]}><Text style={[styles.reportScoreNumber, { color: scan.verdictColor }]}>{scan.rootScore}</Text><Text style={[styles.reportScoreCaption, { color: scan.verdictColor }]}>ROOT</Text></View>
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
            </View>
          ) : <View style={styles.missingData}><Text style={styles.missingDataTitle}>Rapport non disponible pour ce vieux scan.</Text><Text style={styles.missingDataText}>Les nouveaux scans sauvegardent toutes les valeurs réelles. Rescanne ce produit pour mettre sa fiche à jour.</Text></View>}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GrootScreen() {
  const insets = useSafeAreaInsets();
  const { clearHistory, favoriteHistoryScan, history, recordMissionActivity, removeHistoryScan, user } = useAppData();
  const tabSwipe = useTabSwipe(2);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr-BE');
  const filteredHistory = normalizedSearchQuery
    ? history.filter((scan) => `${scan.productName} ${scan.brand ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-BE').includes(normalizedSearchQuery))
    : history;

  useFocusEffect(useCallback(() => {
    const timer = setInterval(() => recordMissionActivity('historySeconds'), 1_000);
    return () => clearInterval(timer);
  }, [recordMissionActivity]));

  const confirmClearHistory = () => {
    Alert.alert('Effacer l’historique ?', 'Les scans enregistrés sur cet appareil seront supprimés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => void clearHistory() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 18 }]} {...tabSwipe.panHandlers}>
      <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.title}>GROOT</Text><Text style={styles.subtitle}>Tes scans passés</Text></View></View>
      {user ? <View style={styles.profileRow}><Image source={user.picture ? { uri: user.picture } : rootNormal} style={styles.profileImage} resizeMode="cover" /><View><Text style={styles.profileName}>{user.name}</Text><Text style={styles.profileCaption}>Historique local du téléphone</Text></View></View> : null}
      {history.length ? <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un produit ou une marque" placeholderTextColor={colors.textMuted} style={styles.searchInput} /><TouchableOpacity accessibilityLabel="Effacer la recherche" disabled={!searchQuery} onPress={() => setSearchQuery('')} style={[styles.clearSearchButton, !searchQuery && styles.clearSearchButtonHidden]}><Text style={styles.clearSearchText}>×</Text></TouchableOpacity></View> : null}
      <View style={styles.historyHeading}>
        <Text style={styles.historyTitle}>{history.length ? normalizedSearchQuery ? `${filteredHistory.length} résultat${filteredHistory.length > 1 ? 's' : ''}` : `${history.length} produit${history.length > 1 ? 's' : ''}` : 'Aucun scan'}</Text>
        {history.length ? <TouchableOpacity onPress={confirmClearHistory}><Text style={styles.clearText}>Effacer</Text></TouchableOpacity> : null}
      </View>
      {history.length === 0 ? <View style={styles.emptyState}><Image source={rootNormal} style={styles.emptyRoot} resizeMode="contain" /><Text style={styles.emptyTitle}>Groot attend ton premier scan.</Text><Text style={styles.emptyText}>Retourne dans Proot, scanne un produit et son rapport apparaîtra ici.</Text></View> : filteredHistory.length === 0 ? <View style={styles.searchEmpty}><Text style={styles.searchEmptyTitle}>Aucun produit trouvé.</Text><Text style={styles.searchEmptyText}>Essaie avec un autre nom ou une autre marque.</Text></View> : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredHistory.map((scan) => <SwipeableHistoryCard key={scan.id} scan={scan} onOpen={() => setSelectedScan(scan)} onFavorite={() => favoriteHistoryScan(scan.id)} onDelete={() => { if (selectedScan?.id === scan.id) setSelectedScan(null); removeHistoryScan(scan.id); }} />)}
        </ScrollView>
      )}
      {selectedScan ? <HistoryReport scan={selectedScan} onClose={() => setSelectedScan(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { alignItems: 'center', flexDirection: 'row' }, headerCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 }, subtitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: -2 },
  profileRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 18, padding: 10 },
  profileImage: { backgroundColor: colors.surfaceSecondary, borderRadius: 22, height: 44, width: 44 }, profileName: { color: colors.text, fontSize: 13, fontWeight: '900' }, profileCaption: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2 },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginTop: 17, paddingHorizontal: 12 }, searchIcon: { color: colors.textMuted, fontSize: 24, lineHeight: 28, marginRight: 7, marginTop: -1 }, searchInput: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '700', minHeight: 44, minWidth: 0, paddingVertical: 9 }, clearSearchButton: { alignItems: 'center', backgroundColor: '#EEEAE2', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 }, clearSearchButtonHidden: { opacity: 0 }, clearSearchText: { color: colors.textSecondary, fontSize: 18, lineHeight: 21 },
  historyHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 24 }, historyTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, clearText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 55, paddingHorizontal: 35 }, emptyRoot: { height: 150, width: 150 }, emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 12, textAlign: 'center' }, emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  searchEmpty: { alignItems: 'center', marginTop: 42, paddingHorizontal: 32 }, searchEmptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }, searchEmptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  list: { gap: 11, paddingBottom: 26 }, swipeShell: { backgroundColor: '#E7E1D7', borderRadius: 18, overflow: 'hidden', position: 'relative' },
  swipeAction: { alignItems: 'center', bottom: 0, justifyContent: 'center', position: 'absolute', top: 0, width: 104 }, deleteAction: { backgroundColor: '#D95050', left: 0 }, favoriteAction: { backgroundColor: '#D5A52C', right: 0 }, swipeActionIcon: { color: '#FFFFFF', fontSize: 20 }, swipeActionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', marginTop: 3 },
  scanCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 10 }, productImageFrame: { alignItems: 'center', backgroundColor: '#F5F4F0', borderRadius: 12, height: 62, justifyContent: 'center', overflow: 'hidden', width: 55 }, productImage: { height: 56, width: 49 }, noImage: { color: colors.textMuted, fontSize: 25, fontWeight: '900' },
  scanInfo: { flex: 1, minWidth: 0 }, productNameRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 5 }, productName: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '900', lineHeight: 18 }, favoriteStar: { color: '#D29A17', fontSize: 16, lineHeight: 18 }, brand: { color: colors.textSecondary, fontSize: 12, marginTop: 2 }, date: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  score: { alignItems: 'center', borderRadius: 10, borderWidth: 2, justifyContent: 'center', minHeight: 49, minWidth: 49, paddingHorizontal: 3 }, scoreNumber: { fontSize: 17, fontWeight: '900', lineHeight: 19 }, scoreLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '900' },
  reportScreen: { backgroundColor: colors.background, flex: 1 }, reportNav: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14, paddingHorizontal: 18, paddingTop: 50 }, closeButton: { alignItems: 'center', backgroundColor: colors.button, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 }, closeText: { color: colors.text, fontSize: 36, lineHeight: 23, marginTop: -3, top: -4 }, closeButtonPlaceholder: { width: 36 }, reportNavTitle: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  reportContent: { padding: 18, paddingBottom: 42 }, reportProductTop: { alignItems: 'center', flexDirection: 'row', gap: 14 }, reportProductImageFrame: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, height: 93, justifyContent: 'center', overflow: 'hidden', width: 83 }, reportProductImage: { height: 86, width: 76 }, reportProductInfo: { flex: 1 }, reportProductName: { color: colors.text, fontSize: 19, fontWeight: '900', lineHeight: 23 }, reportBrand: { color: colors.textSecondary, fontSize: 13, marginTop: 3 }, reportDate: { color: colors.textMuted, fontSize: 11, marginTop: 8 },
  rootScoreCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginTop: 18, minHeight: 104, overflow: 'hidden', padding: 12 }, reportRoot: { height: 88, marginLeft: -11, width: 88 }, rootScoreCopy: { flex: 1 }, rootScoreLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' }, rootScoreTitle: { fontSize: 14, fontWeight: '900', lineHeight: 18, marginTop: 2 }, reportScore: { alignItems: 'center', borderRadius: 30, borderWidth: 3, height: 58, justifyContent: 'center', width: 58 }, reportScoreNumber: { fontSize: 21, fontWeight: '900', lineHeight: 23 }, reportScoreCaption: { fontSize: 7, fontWeight: '900' },
  realDataTitle: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.9, marginTop: 26 }, reportPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 10, overflow: 'hidden', padding: 16 }, reportPanelTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, reportPanelTitle: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.4 }, reportPanelSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 }, gradeBadge: { alignItems: 'center', borderRadius: 10, minWidth: 44, paddingHorizontal: 12, paddingVertical: 5 }, gradeSmall: { color: colors.text, fontSize: 10, fontWeight: '800' }, gradeBig: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 21 },
  energyCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 13, marginTop: 15, padding: 14 }, energyLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '900', letterSpacing: 1 }, energyValue: { color: colors.text, fontSize: 27, fontWeight: '900' }, energyCaption: { color: colors.textSecondary, fontSize: 10, marginTop: 1 }, nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }, nutritionCell: { backgroundColor: colors.surfaceSecondary, borderRadius: 10, minHeight: 62, padding: 10, width: '31.5%' }, nutritionNumber: { color: colors.text, fontSize: 12, fontWeight: '900' }, nutritionLabel: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, marginTop: 4 }, additivesRow: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, paddingHorizontal: 11, paddingVertical: 10 }, additivesLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, additivesValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  missingData: { backgroundColor: '#FFF3C4', borderRadius: 16, marginTop: 10, padding: 17 }, missingDataTitle: { color: '#705D00', fontSize: 14, fontWeight: '900' }, missingDataText: { color: '#6B5E28', fontSize: 12, lineHeight: 18, marginTop: 5 },
});
