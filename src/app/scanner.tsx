import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/theme';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.8;

export default function BarcodeScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const lastScan = useRef(null);
  const sheetRef = useRef(null);

  const snapPoints = useMemo(() => ['90%'], []);

  const handleScan = async ({ data }) => {
    if (scanned || data === lastScan.current) return;
    lastScan.current = data;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json`
      );
      const json = await res.json();

      if (json.status === 1) {
        setProduct({
          productname: json.product.product_name || 'Nom inconnu',
          brand: json.product.brands || '',
          image: json.product.image_front_small_url,
          barcode: data,
        });
      } else {
        setProduct({ productname: 'Produit non trouvé', barcode: data });
      }
    } catch (e) {
      setProduct({ productname: 'Erreur réseau', barcode: data });
    } finally {
      setLoading(false);
      sheetRef.current?.snapToIndex(0);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setProduct(null);
    lastScan.current = null;
    sheetRef.current?.close();
  };

  const handleSheetChange = useCallback((index) => {}, []);

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
        style={StyleSheet.absoluteFillObject}
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

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.contentArea}>
            {loading ? (
              <ActivityIndicator />
            ) : product ? (
              <>
                <Text style={styles.productName}>{product.productname}</Text>
                {product.brand ? (
                  <Text style={styles.productBrand}>{product.brand}</Text>
                ) : null}
                <Text style={styles.barcodeText}>{product.barcode}</Text>
              </>
            ) : (
              <Text style={styles.permText}>Scanne un produit pour voir les infos</Text>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>

      {scanned && (
        <View style={styles.fixedFooter} pointerEvents="box-none" >
          <TouchableOpacity style={styles.button} onPress={resetScan}>
            <Text style={styles.buttonText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        </View>
      )}
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
  overlay: { ...StyleSheet.absoluteFillObject },
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
    flex: 1,
    padding: 24,
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 50,
  },
  fixedFooter: {
    backgroundColor: colors.surface,
    position: 'absolute',
    bottom: 0,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  productName: { fontSize: 20, color: colors.text, fontWeight: '700', marginBottom: 4 },
  productBrand: { fontSize: 14, color: colors.text, marginBottom: 8 },
  barcodeText: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
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