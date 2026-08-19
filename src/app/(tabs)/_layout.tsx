import { Tabs } from 'expo-router';
import { type ColorValue, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

type TabIconProps = {
  symbol: string;
  color: ColorValue;
};

function TabIcon({ symbol, color }: TabIconProps) {
  return <Text style={[styles.icon, { color }]}>{symbol}</Text>;
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
          tabBarIcon: ({ color }) => <TabIcon symbol="●" color={color} />,
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
          tabBarIcon: ({ color }) => <TabIcon symbol="◌" color={color} />,
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
});