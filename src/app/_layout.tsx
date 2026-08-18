import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="scanner"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}