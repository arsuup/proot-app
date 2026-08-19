import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/theme';
import { useAppData } from '../lib/app-data';
import { generateRootAiMessage, isRootAiConfigured } from '../lib/root-ai';
import { getRootVerdict, type RootNutriments } from '../lib/root-score';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.8;
const rootAngry = require('../../assets/images/root-angry.png');
const rootCool = require('../../assets/images/root-cool.png');
const rootGame = require('../../assets/images/root-game.png');
const rootGameDecoy = require('../../assets/images/root-game-decoy.png');

type Product = {
  productname: string;
  brand?: string;
  barcode: string;
  image?: string;
  nutritionGrade?: string;
  nutriments?: RootNutriments;
};

type BarcodeScanEvent = {
  data: string;
};

const gameLanes = [0, 1, 2] as const;
type GameLane = typeof gameLanes[number];
const ROOT_GAME_GOAL = 5;
const ROOT_GAME_DURATION_SECONDS = 10;

const formatAmount = (value?: number) =>
  value === undefined ? '—' : `${value.toLocaleString('fr-FR')} g`;

const formatEnergy = (value?: number) =>
  value === undefined ? '—' : `${Math.round(value).toLocaleString('fr-FR')} kcal`;

const nutritionGradeColors: Record<string, string> = {
  A: '#16803C',
  B: '#4FAE49',
  C: '#F5B90B',
  D: '#F08223',
  E: '#DD2E2E',
};

const barWidth = (value: number | undefined, maximum: number): `${number}%` =>
  `${Math.round(Math.min(Math.max(value ?? 0, 0) / maximum, 1) * 100)}%`;

export default function BarcodeScanner() {
  const { addScan } = useAppData();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiMessageLoading, setIsAiMessageLoading] = useState(false);
  const [isAiUnavailable, setIsAiUnavailable] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [aiRetryVersion, setAiRetryVersion] = useState(0);
  const [isNutritionUnlocked, setIsNutritionUnlocked] = useState(false);
  const [isRootGameVisible, setIsRootGameVisible] = useState(false);
  const [rootCaughtCount, setRootCaughtCount] = useState(0);
  const [rootGameStatus, setRootGameStatus] = useState<'idle' | 'playing' | 'lost'>('idle');
  const [rootGameSecondsLeft, setRootGameSecondsLeft] = useState(ROOT_GAME_DURATION_SECONDS);
  const [rootGameLane, setRootGameLane] = useState<GameLane>(1);
  const [rootDecoyLane, setRootDecoyLane] = useState<GameLane>(0);
  const lastScan = useRef<string | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['100%'], []);

  const saveProductInHistory = (scannedProduct: Product) => {
    const verdict = getRootVerdict(scannedProduct.nutriments, scannedProduct.productname);
    addScan({
      barcode: scannedProduct.barcode,
      productName: scannedProduct.productname,
      brand: scannedProduct.brand,
      image: scannedProduct.image,
      rootScore: verdict.score,
      verdictTitle: verdict.title,
      verdictColor: verdict.color,
      nutritionGrade: scannedProduct.nutritionGrade,
      nutriments: scannedProduct.nutriments,
    });
  };

  const handleScan = async ({ data }: BarcodeScanEvent) => {
    if (scanned || data === lastScan.current) return;
    lastScan.current = data;
    setScanned(true);
    setShowNutritionDetails(false);
    setAiMessage(null);
    setIsAiUnavailable(false);
    setAiErrorMessage(null);
    setAiRetryVersion(0);
    setIsNutritionUnlocked(false);
    setIsRootGameVisible(false);
    setRootCaughtCount(0);
    setRootGameStatus('idle');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json`
      );
      const json = await res.json();

      if (json.status === 1) {
        const scannedProduct = {
          productname: json.product.product_name || 'Nom inconnu',
          brand: json.product.brands || '',
          barcode: data,
          image: json.product.image_front_small_url,
          nutritionGrade: json.product.nutrition_grades,
          nutriments: json.product.nutriments,
        };
        setProduct(scannedProduct);
        saveProductInHistory(scannedProduct);
      } else {
        const scannedProduct = { productname: 'Produit non trouvé', barcode: data };
        setProduct(scannedProduct);
        saveProductInHistory(scannedProduct);
      }
    } catch (e) {
      const scannedProduct = { productname: 'Erreur réseau', barcode: data };
      setProduct(scannedProduct);
      saveProductInHistory(scannedProduct);
    } finally {
      setLoading(false);
      sheetRef.current?.snapToIndex(0);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setProduct(null);
    setShowNutritionDetails(false);
    setAiMessage(null);
    setIsAiUnavailable(false);
    setAiErrorMessage(null);
    setAiRetryVersion(0);
    setIsNutritionUnlocked(false);
    setIsRootGameVisible(false);
    setRootCaughtCount(0);
    setRootGameStatus('idle');
    lastScan.current = null;
    sheetRef.current?.close();
  };

  const rootVerdict = useMemo(
    () => (product ? getRootVerdict(product.nutriments, product.productname) : null),
    [product]
  );
  const rootMascot = rootVerdict && rootVerdict.score >= 50 ? rootCool : rootAngry;

  const moveGameCharacters = () => {
    const nextRootLane = gameLanes[Math.floor(Math.random() * gameLanes.length)];
    const remainingLanes = gameLanes.filter((lane) => lane !== nextRootLane);
    const nextDecoyLane = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
    setRootGameLane(nextRootLane);
    setRootDecoyLane(nextDecoyLane);
  };

  const startRootGame = () => {
    setRootCaughtCount(0);
    setRootGameSecondsLeft(ROOT_GAME_DURATION_SECONDS);
    setRootGameStatus('playing');
    moveGameCharacters();
    setIsRootGameVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const catchRoot = () => {
    const nextCount = rootCaughtCount + 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (nextCount >= ROOT_GAME_GOAL) {
      setRootCaughtCount(ROOT_GAME_GOAL);
      setIsRootGameVisible(false);
      setRootGameStatus('idle');
      setIsNutritionUnlocked(true);
      setShowNutritionDetails(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    setRootCaughtCount(nextCount);
    moveGameCharacters();
  };

  const catchDecoy = () => {
    setRootCaughtCount((count) => Math.max(0, count - 1));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    moveGameCharacters();
  };
  const nutritionMetrics = useMemo(() => product ? [
    { label: 'Sucres', value: product.nutriments?.sugars_100g, maximum: 30, color: '#E65B3D' },
    { label: 'Matières grasses', value: product.nutriments?.fat_100g, maximum: 30, color: '#E4A919' },
    { label: 'Saturées', value: product.nutriments?.['saturated-fat_100g'], maximum: 10, color: '#B764A4' },
    { label: 'Sel', value: product.nutriments?.salt_100g, maximum: 3, color: '#4A82BD' },
  ] : [], [product]);
  const nutritionGrade = product?.nutritionGrade?.toUpperCase();
  const nutritionGradeColor = nutritionGrade ? nutritionGradeColors[nutritionGrade] ?? colors.textMuted : colors.textMuted;

  useEffect(() => {
    if (!product || !rootVerdict || !isRootAiConfigured) {
      setIsAiMessageLoading(false);
      return;
    }

    let cancelled = false;
    setIsAiMessageLoading(true);

    void generateRootAiMessage({
      productName: product.productname,
      rootScore: rootVerdict.score,
      nutriments: product.nutriments,
    }).then(({ message, failed, errorMessage }) => {
      if (!cancelled) {
        setAiMessage(message);
        setIsAiUnavailable(failed);
        setAiErrorMessage(errorMessage ?? null);
      }
    }).finally(() => {
      if (!cancelled) setIsAiMessageLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [aiRetryVersion, product, rootVerdict]);

  useEffect(() => {
    if (rootGameStatus !== 'playing') return;

    const gameEndsAt = Date.now() + ROOT_GAME_DURATION_SECONDS * 1000;
    const clock = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((gameEndsAt - Date.now()) / 1000));
      setRootGameSecondsLeft(secondsLeft);
      if (secondsLeft === 0) {
        setRootGameStatus('lost');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 120);
    const movement = setInterval(() => {
      const nextRootLane = gameLanes[Math.floor(Math.random() * gameLanes.length)];
      const remainingLanes = gameLanes.filter((lane) => lane !== nextRootLane);
      const nextDecoyLane = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
      setRootGameLane(nextRootLane);
      setRootDecoyLane(nextDecoyLane);
    }, 750);

    return () => {
      clearInterval(clock);
      clearInterval(movement);
    };
  }, [rootGameStatus]);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          L'accès à la caméra est nécessaire pour scanner
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.overlayRow} />
        <View style={styles.overlayCenterRow}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayRow} />
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backButtonText}>Accueil</Text>
      </TouchableOpacity>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enablePanDownToClose={false}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <View style={styles.contentArea}>
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
                <Text style={styles.loadingText}>Root inspecte ce produit…</Text>
              </View>
            ) : product ? (
              <View style={styles.resultContent}>
                <Text style={styles.appTitle}>ROOTSCORE</Text>
                <Text style={styles.appSubtitle}>Le pire coach alimentaire</Text>

                <View style={styles.productImageFrame}>
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.imageFallback}>?</Text>
                  )}
                </View>

                <Text style={styles.productName}>{product.productname}</Text>
                {product.brand ? (
                  <Text style={styles.productBrand}>{product.brand}</Text>
                ) : null}
                <Text style={styles.barcodeText}>{product.barcode}</Text>
                {rootVerdict ? (
                  <View style={styles.verdictCard}>
                    <Text style={styles.rootName}>VERDICT DE ROOT</Text>
                    <View style={styles.scoreRow}>
                      <Image source={rootMascot} style={styles.rootMascot} resizeMode="contain" />
                      <View
                        style={[
                          styles.scoreCircle,
                          { borderColor: rootVerdict.color },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreNumber,
                            { color: rootVerdict.color },
                          ]}
                        >
                          {rootVerdict.score}
                        </Text>
                        <Text style={styles.scoreLabel}>/ 100</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.verdictTitle, { color: rootVerdict.color }]}
                    >
                      {rootVerdict.title}
                    </Text>
                    <Text style={styles.verdictMessage}>
                      {isAiMessageLoading
                        ? 'Root prépare son pire conseil…'
                        : aiMessage ?? rootVerdict.message}
                    </Text>
                    {isAiUnavailable ? (
                      <View style={styles.aiIssueBox}>
                        <Text style={styles.aiFallbackNote}>
                          {aiErrorMessage ?? 'L’IA de Root ne répond pas : conseil de secours affiché.'}
                        </Text>
                        <TouchableOpacity style={styles.aiRetryButton} onPress={() => setAiRetryVersion((version) => version + 1)}>
                          <Text style={styles.aiRetryText}>Réessayer l’IA</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    <Text style={styles.disclaimer}>
                      Parodie : les conseils de Root sont volontairement nuls.
                    </Text>
                    <TouchableOpacity
                      style={styles.nutritionToggle}
                      onPress={() => {
                        if (isNutritionUnlocked) setShowNutritionDetails((visible) => !visible);
                        else startRootGame();
                      }}
                    >
                      <Text style={styles.nutritionToggleText}>
                        {isNutritionUnlocked && showNutritionDetails
                          ? 'Masquer les vraies valeurs nutritionnelles'
                          : isNutritionUnlocked
                            ? 'Voir les vraies valeurs nutritionnelles'
                            : 'Débloquer les vraies valeurs'}
                      </Text>
                    </TouchableOpacity>
                    {isRootGameVisible ? (
                      <View style={styles.rootGameCard}>
                        <View style={styles.gameHeader}>
                          <Image source={rootGame} style={styles.gameHeaderRoot} resizeMode="contain" />
                          <View style={styles.gameHeaderCopy}>
                            <Text style={styles.gameKicker}>ROOT VEUT JOUER</Text>
                            <Text style={styles.gameTitle}>Attrape le vrai Root {ROOT_GAME_GOAL} fois avant la fin.</Text>
                          </View>
                        </View>
                        <View style={styles.gameProgress}>
                          {[0, 1, 2, 3, 4].map((step) => <View key={step} style={[styles.gameDot, step < rootCaughtCount && styles.gameDotFilled]} />)}
                          <Text style={styles.gameProgressText}>{rootCaughtCount}/{ROOT_GAME_GOAL} · {rootGameSecondsLeft}s</Text>
                        </View>
                        {rootGameStatus === 'lost' ? (
                          <View style={styles.gameLostCard}>
                            <Text style={styles.gameLostTitle}>ROOT S’EST ÉCHAPPÉ !</Text>
                            <Text style={styles.gameLostText}>Tu as cliqué sur un faux Root, ou il était trop rapide. Recommence.</Text>
                            <TouchableOpacity style={styles.gameReplayButton} onPress={startRootGame}><Text style={styles.gameReplayText}>Rejouer contre Root</Text></TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.gameArena}>
                            <Text style={styles.gameHint}>Attention : le Root orange avec la manette est le vrai. L’autre te fait reculer.</Text>
                            <View style={styles.gameLanes}>
                              {gameLanes.map((lane) => (
                                <View key={lane} style={styles.gameLane}>
                                  {rootGameLane === lane ? (
                                    <TouchableOpacity style={styles.gameRootButton} onPress={catchRoot} activeOpacity={0.75}>
                                      <Image source={rootGame} style={styles.gameRootImage} resizeMode="contain" />
                                    </TouchableOpacity>
                                  ) : rootDecoyLane === lane ? (
                                    <TouchableOpacity style={styles.gameDecoyButton} onPress={catchDecoy} activeOpacity={0.75}>
                                      <Image source={rootGameDecoy} style={styles.gameDecoyImage} resizeMode="contain" />
                                    </TouchableOpacity>
                                  ) : <View style={styles.emptyLane} />}
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    ) : showNutritionDetails ? (
                      <View style={styles.nutritionPanel}>
                        <View style={styles.reportHeader}>
                          <View>
                            <Text style={styles.nutritionTitle}>RAPPORT NUTRITIONNEL</Text>
                            <Text style={styles.nutritionSubtitle}>Données réelles pour 100 g</Text>
                          </View>
                          <View style={[styles.gradeBadge, { backgroundColor: nutritionGradeColor }]}>
                            <Text style={styles.gradeBadgeLabel}>NUTRI</Text>
                            <Text style={styles.gradeBadgeValue}>{nutritionGrade ?? '—'}</Text>
                          </View>
                        </View>

                        <View style={styles.energyCard}>
                          <Text style={styles.energyLabel}>ÉNERGIE</Text>
                          <Text style={styles.energyValue}>{formatEnergy(product.nutriments?.['energy-kcal_100g'])}</Text>
                          <Text style={styles.energyCaption}>pour 100 g de produit</Text>
                        </View>

                        <View style={styles.macroGrid}>
                          <View style={styles.macroCard}>
                            <Text style={styles.macroValue}>{formatAmount(product.nutriments?.proteins_100g)}</Text>
                            <Text style={styles.macroLabel}>Protéines</Text>
                          </View>
                          <View style={styles.macroCard}>
                            <Text style={styles.macroValue}>{formatAmount(product.nutriments?.fiber_100g)}</Text>
                            <Text style={styles.macroLabel}>Fibres</Text>
                          </View>
                          <View style={styles.macroCard}>
                            <Text style={styles.macroValue}>{product.nutriments?.additives_n ?? '—'}</Text>
                            <Text style={styles.macroLabel}>Additifs déclarés</Text>
                          </View>
                        </View>

                        <Text style={styles.breakdownTitle}>COMPOSITION PRINCIPALE</Text>
                        {nutritionMetrics.map((metric) => (
                          <View key={metric.label} style={styles.metric}>
                            <View style={styles.metricTopLine}>
                              <Text style={styles.metricLabel}>{metric.label}</Text>
                              <Text style={styles.metricValue}>{formatAmount(metric.value)}</Text>
                            </View>
                            <View style={styles.metricTrack}>
                              <View style={[styles.metricFill, { backgroundColor: metric.color, width: barWidth(metric.value, metric.maximum) }]} />
                            </View>
                          </View>
                        ))}

                        <View style={styles.sourceNote}>
                          <Text style={styles.sourceNoteTitle}>À LIRE AVANT D’ÉCOUTER ROOT</Text>
                          <Text style={styles.sourceNoteText}>Ces chiffres viennent de la fiche Open Food Facts. Les jauges servent uniquement à comparer les quantités sur cette fiche ; elles ne remplacent pas un avis médical.</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.rescanButton} onPress={resetScan}>
                    <Text style={styles.rescanButtonText}>Scanner encore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)')}>
                    <Text style={styles.homeButtonText}>Retour à l’accueil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.permText}>Scanne un produit pour voir les infos</Text>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permText: { color: '#fff', textAlign: 'center', marginBottom: 16 },
  overlay: { ...StyleSheet.absoluteFill },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(35,33,30,0.82)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    left: 18,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 13,
    paddingTop: 7,
    position: 'absolute',
    top: 54,
  },
  backArrow: { color: '#FFFFFF', fontSize: 28, fontWeight: '400', lineHeight: 20, marginRight: 3 },
  backButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  overlayRow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayCenterRow: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    justifyContent: 'space-between'
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderRadius: 4,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  sheetContent: {
    flexGrow: 1,
    paddingBottom: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  loadingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 500,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  resultContent: {
    alignItems: 'center',
    width: '100%',
  },
  appTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  productImageFrame: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 190,
    justifyContent: 'center',
    marginTop: 24,
    overflow: 'hidden',
    width: '100%',
  },
  productImage: { height: '100%', width: '100%' },
  imageFallback: { color: colors.textMuted, fontSize: 72, fontWeight: '900' },
  verdictCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 20,
  },
  rootName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  scoreRow: { alignItems: 'center', flexDirection: 'row', gap: 18 },
  rootMascot: { height: 104, width: 104 },
  scoreCircle: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 6,
    height: 108,
    justifyContent: 'center',
    width: 108,
  },
  scoreNumber: { fontSize: 42, fontWeight: '900', lineHeight: 46 },
  scoreLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  verdictTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  verdictMessage: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  aiFallbackNote: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  aiIssueBox: { alignItems: 'center', marginTop: 8 },
  aiRetryButton: { borderColor: '#CFC9BE', borderRadius: 8, borderWidth: 1, marginTop: 7, paddingHorizontal: 10, paddingVertical: 6 },
  aiRetryText: { color: colors.textSecondary, fontSize: 10, fontWeight: '900' },
  rootGameCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF0B4',
    borderColor: '#E8C949',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
    padding: 13,
  },
  gameHeader: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  gameHeaderRoot: { height: 58, marginLeft: -3, width: 58 },
  gameHeaderCopy: { flex: 1 },
  gameKicker: { color: '#7A5300', fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  gameTitle: { color: colors.text, fontSize: 13, fontWeight: '900', lineHeight: 17, marginTop: 2 },
  gameProgress: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 9 },
  gameDot: { backgroundColor: '#E8CD6C', borderRadius: 5, height: 9, width: 9 },
  gameDotFilled: { backgroundColor: '#EF7A1C' },
  gameProgressText: { color: '#735D17', fontSize: 10, fontWeight: '800', marginLeft: 3 },
  gameArena: { alignSelf: 'stretch', backgroundColor: '#FFF9DE', borderColor: '#EDD97E', borderRadius: 12, borderWidth: 1, marginTop: 11, minHeight: 154, overflow: 'hidden', padding: 9 },
  gameHint: { color: '#796A37', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  gameLanes: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 3, justifyContent: 'space-between', marginTop: 4 },
  gameLane: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  gameRootButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6BF3C', borderRadius: 31, borderWidth: 2, height: 62, justifyContent: 'center', width: 62 },
  gameRootImage: { height: 68, width: 68 },
  gameDecoyButton: { alignItems: 'center', backgroundColor: '#F6E2E2', borderColor: '#D78989', borderRadius: 28, borderWidth: 2, height: 56, justifyContent: 'center', opacity: 0.82, width: 56 },
  gameDecoyImage: { height: 52, width: 52 },
  emptyLane: { height: 54, width: 54 },
  gameLostCard: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: '#FCE4E4', borderColor: '#DE8B8B', borderRadius: 12, borderWidth: 1, marginTop: 11, padding: 14 },
  gameLostTitle: { color: '#9A3030', fontSize: 13, fontWeight: '900' },
  gameLostText: { color: '#885858', fontSize: 11, lineHeight: 15, marginTop: 4, textAlign: 'center' },
  gameReplayButton: { backgroundColor: '#9A3030', borderRadius: 9, marginTop: 11, paddingHorizontal: 13, paddingVertical: 9 },
  gameReplayText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 16,
    textAlign: 'center',
  },
  productName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
    textAlign: 'center',
  },
  nutritionToggle: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  nutritionToggleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  nutritionPanel: {
    alignSelf: 'stretch',
    backgroundColor: '#F9F8F5',
    borderColor: '#E6E1D7',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
    padding: 16,
  },
  reportHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nutritionTitle: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.4 },
  nutritionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  gradeBadge: {
    alignItems: 'center',
    borderRadius: 10,
    minWidth: 44,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  gradeBadgeLabel: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  gradeBadgeValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', lineHeight: 21 },
  energyCard: { backgroundColor: '#23211E', borderRadius: 13, marginTop: 15, padding: 14 },
  energyLabel: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  energyValue: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 3 },
  energyCaption: { color: '#CCC8BE', fontSize: 10, marginTop: 1 },
  macroGrid: { flexDirection: 'row', gap: 7, marginTop: 8 },
  macroCard: { backgroundColor: '#FFFFFF', borderRadius: 10, flex: 1, minHeight: 65, paddingHorizontal: 8, paddingTop: 11 },
  macroValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  macroLabel: { color: colors.textSecondary, fontSize: 9, lineHeight: 12, marginTop: 4 },
  breakdownTitle: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginTop: 18 },
  metric: { marginTop: 11 },
  metricTopLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  metricValue: { color: colors.text, fontSize: 12, fontWeight: '900' },
  metricTrack: { backgroundColor: '#E7E3DA', borderRadius: 4, height: 7, overflow: 'hidden', width: '100%' },
  metricFill: { borderRadius: 4, height: '100%' },
  sourceNote: { backgroundColor: '#FFF3C4', borderRadius: 10, marginTop: 17, padding: 11 },
  sourceNoteTitle: { color: '#705D00', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  sourceNoteText: { color: '#6B5E28', fontSize: 10, lineHeight: 14, marginTop: 4 },
  productBrand: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  barcodeText: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  resultActions: { flexDirection: 'row', gap: 9, marginTop: 18, width: '100%' },
  rescanButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  rescanButtonText: { color: '#000', fontSize: 12, fontWeight: '900' },
  homeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1.35,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  homeButtonText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonText: { color: '#000', fontWeight: '700' },
});
