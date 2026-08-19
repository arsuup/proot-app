import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useTabSwipe } from '../../lib/use-tab-swipe';

type ChatMessage = {
  id: string;
  from: 'root' | 'user';
  text: string;
};

type RootConversation = {
  createdAt: string;
  id: string;
  messages: ChatMessage[];
  title: string;
  updatedAt: string;
};

type SavedRootConversations = {
  activeConversationId?: string;
  conversations?: RootConversation[];
};

const ROOT_CONVERSATIONS_STORAGE_KEY = '@proot/root-conversations-v1';
const NEW_CONVERSATION_TITLE = 'Nouvelle discussion';
const rootNormal = require('../../../assets/images/root-cool.png');
const rootThinking = require('../../../assets/images/root-angry.png');

const firstMessage: ChatMessage = {
  id: 'welcome',
  from: 'root',
  text: 'Salut. Je suis Root, ton coach alimentaire de merde. Pose-moi une question, j\'y répondrai mal.',
};

const createConversation = (): RootConversation => {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    id: `root-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    messages: [{ ...firstMessage, id: `welcome-${Date.now()}` }],
    title: NEW_CONVERSATION_TITLE,
    updatedAt: now,
  };
};

const sortConversations = (conversations: RootConversation[]) =>
  [...conversations].sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt));

const formatConversationDate = (date: string) => new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit',
  month: 'short',
}).format(new Date(date));

export default function RootChat() {
  const tabSwipe = useTabSwipe(1);
  const [conversations, setConversations] = useState<RootConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isConversationsReady, setIsConversationsReady] = useState(false);
  const [isConversationPickerVisible, setIsConversationPickerVisible] = useState(false);
  const [input, setInput] = useState('');
  const [thinkingConversationId, setThinkingConversationId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;

    void AsyncStorage.getItem(ROOT_CONVERSATIONS_STORAGE_KEY).then((storedValue) => {
      if (cancelled) return;

      try {
        const saved = storedValue ? (JSON.parse(storedValue) as SavedRootConversations) : null;
        const storedConversations = Array.isArray(saved?.conversations)
          ? saved.conversations.filter((conversation) =>
            conversation &&
            typeof conversation.id === 'string' &&
            Array.isArray(conversation.messages) &&
            typeof conversation.updatedAt === 'string')
          : [];
        const nextConversations = storedConversations.length ? sortConversations(storedConversations) : [createConversation()];
        const savedActiveId = saved?.activeConversationId;
        setConversations(nextConversations);
        setActiveConversationId(nextConversations.some((conversation) => conversation.id === savedActiveId)
          ? savedActiveId ?? null
          : nextConversations[0].id);
      } catch {
        const firstConversation = createConversation();
        setConversations([firstConversation]);
        setActiveConversationId(firstConversation.id);
      } finally {
        setIsConversationsReady(true);
      }
    }).catch(() => {
      if (cancelled) return;
      const firstConversation = createConversation();
      setConversations([firstConversation]);
      setActiveConversationId(firstConversation.id);
      setIsConversationsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isConversationsReady || !activeConversationId || conversations.length === 0) return;
    void AsyncStorage.setItem(ROOT_CONVERSATIONS_STORAGE_KEY, JSON.stringify({
      activeConversationId,
      conversations,
    }));
  }, [activeConversationId, conversations, isConversationsReady]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0],
    [activeConversationId, conversations]
  );
  const isThinking = thinkingConversationId !== null;
  const isActiveConversationThinking = thinkingConversationId === activeConversation?.id;

  useEffect(() => {
    const timeout = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timeout);
  }, [activeConversation?.messages, isActiveConversationThinking]);

  const updateConversation = (conversationId: string, update: (conversation: RootConversation) => RootConversation) => {
    setConversations((current) => sortConversations(current.map((conversation) =>
      conversation.id === conversationId ? update(conversation) : conversation
    )));
  };

  const appendMessage = (conversationId: string, message: ChatMessage) => {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, message],
      title: message.from === 'user' && conversation.title === NEW_CONVERSATION_TITLE
        ? message.text.slice(0, 30) + (message.text.length > 30 ? '…' : '')
        : conversation.title,
      updatedAt: new Date().toISOString(),
    }));
  };

  const createNewConversation = () => {
    const conversation = createConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setInput('');
    setIsConversationPickerVisible(false);
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setInput('');
    setIsConversationPickerVisible(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isThinking || !activeConversation) return;

    const conversationId = activeConversation.id;
    const conversationHistory = activeConversation.messages;
    appendMessage(conversationId, { id: `user-${Date.now()}`, from: 'user', text });
    setInput('');
    setThinkingConversationId(conversationId);

    try {
      const result = await generateRootChatMessage({ history: conversationHistory, userMessage: text });
      const fallback = 'Root a perdu le fil. Essaie de demander si une banane a besoin d’un permis de conduire.';
      appendMessage(conversationId, {
        id: `root-${Date.now()}`,
        from: 'root',
        text: result.message ?? fallback,
      });
    } finally {
      setThinkingConversationId(null);
    }
  };

  if (!isConversationsReady || !activeConversation) {
    return <View style={styles.loadingScreen}><ActivityIndicator color={colors.primaryDark} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.container} {...tabSwipe.panHandlers}>
        <View style={styles.header}>
          <Image source={rootNormal} style={styles.headerRoot} resizeMode="contain" />
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>√ ROOT</Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>{activeConversation.title} · mémoire activée</Text>
          </View>
          <TouchableOpacity style={styles.conversationButton} onPress={() => setIsConversationPickerVisible(true)} activeOpacity={0.8} accessibilityLabel="Changer de discussion">
            <Text style={styles.conversationButtonText}>☰</Text>
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {activeConversation.messages.map((message) => (
            <View key={message.id} style={[styles.messageRow, message.from === 'user' && styles.userMessageRow]}>
              {message.from === 'root' ? <Image source={rootNormal} style={styles.messageRoot} resizeMode="contain" /> : null}
              <View style={[styles.bubble, message.from === 'user' ? styles.userBubble : styles.rootBubble]}>
                <Text style={[styles.messageText, message.from === 'user' && styles.userMessageText]}>{message.text}</Text>
              </View>
            </View>
          ))}
          {isActiveConversationThinking ? (
            <View style={styles.messageRow}>
              <Image source={rootThinking} style={styles.messageRoot} resizeMode="contain" />
              <View style={styles.thinkingBubble}>
                <Text style={styles.thinkingText}>Root réfléchit très mal…</Text>
                <View style={styles.dots}><Text>● ● ●</Text></View>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.disclaimer}><Text style={styles.disclaimerText}>Parodie : Root n’est pas un professionnel de santé.</Text></View>
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

        <Modal visible={isConversationPickerVisible} animationType="slide" transparent onRequestClose={() => setIsConversationPickerVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.conversationSheet}>
              <View style={styles.sheetHeader}>
                <View><Text style={styles.sheetTitle}>DISCUSSIONS ROOT</Text><Text style={styles.sheetSubtitle}>Root se souvient de chaque discussion.</Text></View>
                <TouchableOpacity style={styles.sheetCloseButton} onPress={() => setIsConversationPickerVisible(false)}><Text style={styles.sheetCloseText}>×</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.newConversationButton} onPress={createNewConversation} activeOpacity={0.82}>
                <Text style={styles.newConversationText}>＋ Nouvelle discussion</Text>
              </TouchableOpacity>
              <ScrollView contentContainerStyle={styles.conversationList} showsVerticalScrollIndicator={false}>
                {conversations.map((conversation) => (
                  <TouchableOpacity
                    key={conversation.id}
                    style={[styles.conversationRow, conversation.id === activeConversation.id && styles.activeConversationRow]}
                    onPress={() => selectConversation(conversation.id)}
                    activeOpacity={0.78}
                  >
                    <Image source={rootNormal} style={styles.conversationRoot} resizeMode="contain" />
                    <View style={styles.conversationCopy}>
                      <Text numberOfLines={1} style={styles.conversationTitle}>{conversation.title}</Text>
                      <Text numberOfLines={1} style={styles.conversationPreview}>{conversation.messages.at(-1)?.text ?? 'Root attend.'}</Text>
                    </View>
                    <Text style={styles.conversationDate}>{formatConversationDate(conversation.updatedAt)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { backgroundColor: colors.background, flex: 1 },
  loadingScreen: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: '#ECE7DD', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingBottom: 14, paddingHorizontal: 18, paddingTop: 18 },
  headerRoot: { height: 48, width: 48 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 1 },
  conversationButton: { alignItems: 'center', backgroundColor: '#F2F0EB', borderRadius: 16, height: 36, justifyContent: 'center', width: 36, borderWidth: 1, borderColor: colors.border },
  conversationButtonText: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: -2 },
  messages: { gap: 15, padding: 18, paddingBottom: 28 },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', flexShrink: 1, gap: 7, maxWidth: '87%' },
  userMessageRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageRoot: { height: 31, width: 31 },
  bubble: { borderRadius: 20, flexShrink: 1, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: colors.border },
  rootBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 0 },
  userBubble: { backgroundColor: '#292722', borderBottomRightRadius: 0 },
  messageText: { color: colors.text, flexShrink: 1, fontSize: 15, lineHeight: 21 },
  userMessageText: { color: '#FFFFFF' },
  thinkingBubble: { backgroundColor: '#FFF8C9', borderBottomLeftRadius: 0, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  thinkingText: { color: '#695A00', fontSize: 13, fontWeight: '700' },
  dots: { alignSelf: 'flex-end', marginTop: 3, opacity: 0.5 },
  disclaimer: { alignItems: 'center', paddingBottom: 6, paddingHorizontal: 18 },
  disclaimerText: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  composer: { alignItems: 'center', backgroundColor: colors.surface, borderTopColor: '#ECE7DD', borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 13, paddingVertical: 10 },
  composerRoot: { height: 38, width: 38 },
  input: { backgroundColor: '#F2F0EB', borderRadius: 22, color: colors.text, flex: 1, fontSize: 14, maxHeight: 90, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  sendButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, height: 40, justifyContent: 'center', width: 40, borderWidth: 1, borderColor: colors.border },
  sendButtonDisabled: { backgroundColor: '#E6E1D7' },
  sendText: { color: colors.text, fontSize: 23, fontWeight: '900', marginTop: -3 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.35)', flex: 1, justifyContent: 'flex-end' },
  conversationSheet: { backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '76%', minHeight: 340, padding: 20, paddingBottom: 30 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitle: { color: colors.text, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 },
  sheetSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  sheetCloseButton: { alignItems: 'center', backgroundColor: '#EEEAE2', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  sheetCloseText: { color: colors.text, fontSize: 22, fontWeight: '400', lineHeight: 24 },
  newConversationButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, marginTop: 17, paddingVertical: 12, borderWidth: 1, borderColor: colors.border },
  newConversationText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  conversationList: { gap: 8, paddingTop: 13 },
  conversationRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E6E1D7', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 10 },
  activeConversationRow: { backgroundColor: '#FFF3C4', borderColor: '#E7C84D' },
  conversationRoot: { height: 34, width: 34 },
  conversationCopy: { flex: 1, minWidth: 0 },
  conversationTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  conversationPreview: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  conversationDate: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
});
