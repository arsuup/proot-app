import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/theme';
import { useAppData } from '../lib/app-data';

WebBrowser.maybeCompleteAuthSession();

const rootNormal = require('../../assets/images/root-cool.png');

type GoogleProfile = {
  email?: string;
  name?: string;
  picture?: string;
};

export default function AppEntry() {
  return <Redirect href="/(tabs)" />;
}

export function LoginScreen() {
  const { signIn } = useAppData();
  const [isConnecting, setIsConnecting] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    const accessToken = response.authentication?.accessToken ?? response.params.access_token;
    if (!accessToken) {
      setIsConnecting(false);
      Alert.alert('Connexion Google', 'Google n’a pas renvoyé de jeton. Réessaie une fois.');
      return;
    }

    void fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(async (profileResponse) => {
      if (!profileResponse.ok) throw new Error('Profil Google inaccessible');
      return profileResponse.json() as Promise<GoogleProfile>;
    }).then(async (profile) => {
      await signIn({
        name: profile.name || profile.email?.split('@')[0] || 'Ami de Root',
        email: profile.email,
        picture: profile.picture,
      });
      router.replace('/(tabs)/groot');
    }).catch(() => {
      Alert.alert('Connexion Google', 'Impossible de lire le profil Google. Tu peux continuer sans compte.');
    }).finally(() => setIsConnecting(false));
  }, [response, signIn]);

  const connectWithGoogle = () => {
    if (!request) {
      Alert.alert('Google pas encore configuré', 'Ajoute tes IDs client Google dans le fichier .env, puis relance Expo.');
      return;
    }

    setIsConnecting(true);
    void promptAsync().catch(() => {
      setIsConnecting(false);
      Alert.alert('Connexion Google', 'Google ne s’est pas ouvert. Réessaie une fois.');
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Retour">
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Image source={rootNormal} style={styles.root} resizeMode="contain" />
        <Text style={styles.kicker}>BIENVENUE CHEZ</Text>
        <Text style={styles.title}>PROOT</Text>
        <Text style={styles.subtitle}>Garde tes scans sur ce téléphone et laisse Root commenter tes choix douteux.</Text>

        <TouchableOpacity style={[styles.googleButton, isConnecting && styles.buttonDisabled]} onPress={connectWithGoogle} disabled={isConnecting} activeOpacity={0.85}>
          {isConnecting ? <ActivityIndicator color="#24211E" /> : <Text style={styles.googleLogo}>G</Text>}
          <Text style={styles.googleText}>{isConnecting ? 'Connexion...' : 'Continuer avec Google'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.guestText}>Continuer sans compte</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Le compte est facultatif. L’historique reste local pour le prototype.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFF9ED', flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  backButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6DDD0', borderRadius: 20, borderWidth: 1, height: 40, justifyContent: 'center', left: 20, position: 'absolute', top: 20, width: 40 },
  backText: { color: colors.text, fontSize: 34, fontWeight: '400', lineHeight: 35, marginTop: -4 },
  root: { height: 156, marginBottom: 4, width: 156 },
  kicker: { color: colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 2.4 },
  title: { color: colors.primaryDark, fontSize: 47, fontWeight: '900', letterSpacing: -2, marginTop: -2 },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 315, textAlign: 'center' },
  googleButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D9D4CA', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 11, justifyContent: 'center', marginTop: 34, minHeight: 55, paddingHorizontal: 20, width: '100%' },
  buttonDisabled: { opacity: 0.65 },
  googleLogo: { color: '#4285F4', fontSize: 20, fontWeight: '900' },
  googleText: { color: '#24211E', fontSize: 15, fontWeight: '800' },
  guestButton: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10 },
  guestText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 22, maxWidth: 285, textAlign: 'center' },
});
