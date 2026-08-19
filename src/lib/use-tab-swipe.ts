import { router, type Href } from 'expo-router';
import { PanResponder } from 'react-native';
import { useMemo } from 'react';

const tabRoutes: Href[] = ['/(tabs)', '/(tabs)/root-chat', '/(tabs)/groot', '/(tabs)/shop'];

export function useTabSwipe(currentTabIndex: number) {
  return useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 16 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.35,
    onPanResponderRelease: (_, gesture) => {
      const isHorizontalSwipe = Math.abs(gesture.dx) > 64 || Math.abs(gesture.vx) > 0.55;
      if (!isHorizontalSwipe || Math.abs(gesture.dx) <= Math.abs(gesture.dy)) return;

      const nextIndex = gesture.dx < 0 ? currentTabIndex + 1 : currentTabIndex - 1;
      if (nextIndex < 0 || nextIndex >= tabRoutes.length) return;
      router.navigate(tabRoutes[nextIndex]);
    },
  }), [currentTabIndex]);
}
