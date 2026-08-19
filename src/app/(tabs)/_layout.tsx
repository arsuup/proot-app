import { Tabs } from 'expo-router';
import { type ColorValue, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

type TabIconProps = {
  symbol: string;
  color: ColorValue;
};

function TabIcon({ symbol, color }: TabIconProps) {
  return <Text style={[styles.icon, { color }]}>{symbol}</Text>;
}

function ProotTabIcon({ color }: { color: ColorValue }) {
  return (
    <View style={[styles.prootIcon, { opacity: color === colors.primaryDark ? 1 : 0.52 }]}>
      <View style={[styles.scannerCorner, styles.scannerCornerTopLeft, { borderColor: color }]} />
      <View style={[styles.scannerCorner, styles.scannerCornerTopRight, { borderColor: color }]} />
      <View style={[styles.scannerCorner, styles.scannerCornerBottomLeft, { borderColor: color }]} />
      <View style={[styles.scannerCorner, styles.scannerCornerBottomRight, { borderColor: color }]} />
      <View style={styles.prootBarcode}>
        <View style={[styles.prootBar, styles.prootBarThin]} />
        <View style={[styles.prootBar, styles.prootBarWide]} />
        <View style={[styles.prootBar, styles.prootBarMiddle]} />
        <View style={[styles.prootBar, styles.prootBarThin]} />
      </View>
    </View>
  );
}

function GrootTabIcon({ color }: { color: ColorValue }) {
  return (
    <View style={[styles.grootIcon, { opacity: color === colors.primaryDark ? 1 : 0.5 }]}>
      <View style={[styles.grootLeaf, styles.grootLeafLeft]} />
      <View style={[styles.grootLeaf, styles.grootLeafRight]} />
      <View style={styles.grootHead}>
        <View style={styles.grootEyes}><View style={styles.grootEye} /><View style={styles.grootEye} /></View>
        <View style={styles.grootMouth} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 75 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Proot',
          tabBarIcon: ({ color }) => <ProotTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="root-chat"
        options={{
          title: 'Root',
          tabBarIcon: ({ color }) => <TabIcon symbol="√" color={color} />,
        }}
      />
      <Tabs.Screen
        name="groot"
        options={{
          title: 'Groot',
          tabBarIcon: ({ color }) => <GrootTabIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: '#E8E4DC',
    paddingTop: 7,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  icon: {
    fontSize: 20,
    fontWeight: '900',
    height: 24,
    textAlign: 'center',
  },
  prootIcon: { height: 24, position: 'relative', width: 26 },
  scannerCorner: { borderWidth: 2, height: 8, position: 'absolute', width: 8 },
  scannerCornerTopLeft: { borderBottomWidth: 0, borderRightWidth: 0, left: 2, top: 1 },
  scannerCornerTopRight: { borderBottomWidth: 0, borderLeftWidth: 0, right: 2, top: 1 },
  scannerCornerBottomLeft: { borderRightWidth: 0, borderTopWidth: 0, bottom: 1, left: 2 },
  scannerCornerBottomRight: { borderLeftWidth: 0, borderTopWidth: 0, bottom: 1, right: 2 },
  prootBarcode: { alignItems: 'center', flexDirection: 'row', gap: 2, height: 13, justifyContent: 'center', left: 4, position: 'absolute', top: 6, width: 18 },
  prootBar: { backgroundColor: '#F18B22', borderRadius: 2, height: 13 },
  prootBarThin: { width: 2 },
  prootBarMiddle: { width: 3 },
  prootBarWide: { width: 4 },
  grootIcon: { alignItems: 'center', height: 24, justifyContent: 'flex-end', width: 26 },
  grootHead: { alignItems: 'center', backgroundColor: '#9A6A41', borderColor: '#5E3A21', borderRadius: 9, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
  grootLeaf: { backgroundColor: '#5E9A4A', borderColor: '#35662B', borderRadius: 5, borderWidth: 1, height: 9, position: 'absolute', top: 0, width: 5 },
  grootLeafLeft: { left: 6, transform: [{ rotate: '-32deg' }] },
  grootLeafRight: { right: 6, transform: [{ rotate: '32deg' }] },
  grootEyes: { flexDirection: 'row', gap: 4, marginTop: 1 },
  grootEye: { backgroundColor: '#2C1C13', borderRadius: 2, height: 4, width: 3 },
  grootMouth: { backgroundColor: '#2C1C13', borderRadius: 2, height: 2, marginTop: 3, width: 5 },
});
