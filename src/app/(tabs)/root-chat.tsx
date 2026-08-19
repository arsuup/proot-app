import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/theme';
import { generateRootChatMessage } from '../../lib/root-ai';

type ChatMessage = {
  id: string;
  from: 'root' | 'user';
  text: string;
};

const rootNormal = require('../../../assets/images/root-cool.png');
const rootThinking = require('../../../assets/images/root-angry.png');

const firstMessage: ChatMessage = {
  id: 'welcome',
  from: 'root',
  text: 'Salut. Je suis Root, ton coach alimentaire de merde. Pose-moi une question, j\'y réponderais mal.',
};

export default function RootChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timeout);
  }, [messages, isThinking]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    setMessages((current) => [...current, { id: `user-${Date.now()}`, from: 'user', text }]);
    setInput('');
    setIsThinking(true);

    const result = await generateRootChatMessage({ userMessage: text });
    const fallback = 'Root a perdu le fil. Essaie de demander si une banane a besoin d\'un permis de conduire.';
    setMessages((current) => [
      ...current,
      { id: `root-${Date.now()}`, from: 'root', text: result.message ?? fallback },
    ]);
    setIsThinking(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.header}>
        <Image source={rootNormal} style={styles.headerRoot} resizeMode="contain" />
        <View>
          <Text style={styles.headerTitle}>√ ROOT</Text>
          <Text style={styles.headerSubtitle}>Coach inutile</Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.map((message) => (
          <View key={message.id} style={[styles.messageRow, message.from === 'user' && styles.userMessageRow]}>
            {message.from === 'root' ? <Image source={rootNormal} style={styles.messageRoot} resizeMode="contain" /> : null}
            <View style={[styles.bubble, message.from === 'user' ? styles.userBubble : styles.rootBubble]}>
              <Text style={[styles.messageText, message.from === 'user' && styles.userMessageText]}>{message.text}</Text>
            </View>
          </View>
        ))}
        {isThinking ? (
          <View style={styles.messageRow}>
            <Image source={rootThinking} style={styles.messageRoot} resizeMode="contain" />
            <View style={styles.thinkingBubble}>
              <Text style={styles.thinkingText}>Root réfléchit très mal…</Text>
              <View style={styles.dots}><Text>● ● ●</Text></View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.disclaimer}><Text style={styles.disclaimerText}>Parodie : Root n'est pas un professionnel de santé.</Text></View>
      <View style={styles.composer}>
        <Image source={rootNormal} style={styles.composerRoot} resizeMode="contain" />
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          editable={!isThinking}
          maxLength={350}
          placeholder="Demande un mauvais conseil à Root…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="send"
        />
        <TouchableOpacity style={[styles.sendButton, (!input.trim() || isThinking) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!input.trim() || isThinking}>
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: colors.background, 
    flex: 1 
  },
  header: { 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    borderBottomColor: '#ECE7DD', 
    borderBottomWidth: 1, 
    flexDirection: 'row', 
    gap: 10, 
    paddingBottom: 14, 
    paddingHorizontal: 18, 
    paddingTop: 18 
  },
  headerRoot: { 
    height: 48, 
    width: 48 
  },
  headerTitle: { 
    color: colors.text, 
    fontSize: 20, 
    fontWeight: '900' 
  },
  headerSubtitle: { 
    color: colors.textSecondary, 
    fontSize: 12, 
    fontWeight: '700', 
    marginTop: 1 
  },
  messages: { 
    gap: 15, 
    padding: 18, 
    paddingBottom: 28 
  },
  messageRow: { 
    alignItems: 'flex-end', 
    flexDirection: 'row', 
    flexShrink: 1,
    gap: 7, 
    maxWidth: '87%' 
  },
  userMessageRow: { 
    alignSelf: 'flex-end', 
    justifyContent: 'flex-end' 
  },
  messageRoot: { 
    height: 31, 
    width: 31 
  },
  bubble: { 
    borderRadius: 20, 
    flexShrink: 1,
    paddingHorizontal: 14, 
    paddingVertical: 11 
  },
  rootBubble: { 
    backgroundColor: colors.surface, 
    borderBottomLeftRadius: 0 
  },
  userBubble: { 
    backgroundColor: '#292722', 
    borderBottomRightRadius: 0 
  },
  messageText: { 
    color: colors.text, 
    flexShrink: 1, 
    fontSize: 15, 
    lineHeight: 21 
  },
  userMessageText: { 
    color: '#FFFFFF' 
  },
  thinkingBubble: { 
    backgroundColor: '#FFF8C9', 
    borderRadius: 20, 
    borderBottomLeftRadius: 0, 
    paddingHorizontal: 14, 
    paddingVertical: 10 
  },
  thinkingText: { 
    color: '#695A00', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  dots: { 
    alignSelf: 'flex-end', 
    marginTop: 3, 
    opacity: 0.5 
  },
  disclaimer: { 
    alignItems: 'center', 
    paddingBottom: 6, 
    paddingHorizontal: 18 
  },
  disclaimerText: { 
    color: colors.textMuted, 
    fontSize: 11, 
    textAlign: 'center' 
  },
  composer: { 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    borderTopColor: '#ECE7DD', 
    borderTopWidth: 1, 
    flexDirection: 'row', 
    gap: 8, 
    paddingHorizontal: 13, 
    paddingVertical: 10 
  },
  composerRoot: { 
    height: 38, 
    width: 38 
  },
  input: { 
    backgroundColor: '#F2F0EB', 
    borderRadius: 22, 
    color: colors.text, 
    flex: 1, 
    fontSize: 14, 
    maxHeight: 90, 
    paddingHorizontal: 15, 
    paddingVertical: 10 
  },
  sendButton: { 
    alignItems: 'center', 
    backgroundColor: colors.primary, 
    borderRadius: 20, 
    height: 40, 
    justifyContent: 'center', 
    width: 40 
  },
  sendButtonDisabled: { 
    backgroundColor: '#E6E1D7' 
  },
  sendText: { 
    color: colors.text, 
    fontSize: 23, 
    fontWeight: '900',
    marginTop: -3 
  },
});
