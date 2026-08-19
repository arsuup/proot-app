import { Tabs } from 'expo-router';
import { type ColorValue, StyleSheet, Text } from 'react-native';
import { colors } from '../../../constants/theme';

type TabIconProps = {
  symbol: string;
  color: ColorValue;
};

function TabIcon({ symbol, color }: TabIconProps) {
  return <Text style={[styles.icon, { color }]}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
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
          title: '√',
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
    height: 68,
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
