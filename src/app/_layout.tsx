import { Stack } from 'expo-router';
import { AppDataProvider } from '../lib/app-data';

export default function Layout() {
  return (
    <AppDataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="missions" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="login" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen
          name="scanner"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </AppDataProvider>
  );
}
