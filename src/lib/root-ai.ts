import type { RootNutriments } from './root-score';

type RootWorkerResponse = {
  text?: unknown;
  message?: unknown;
  response?: unknown;
  error?: unknown;
};

type RootAiInput = {
  productName: string;
  rootScore: number;
  nutriments?: RootNutriments;
};

type RootChatInput = {
  history?: Array<{
    from: 'root' | 'user';
    text: string;
  }>;
  userMessage: string;
};

const DEFAULT_ROOT_AI_URL = 'https://proot.arsuup.fr/api/ia';
const rootAiUrl = (process.env.EXPO_PUBLIC_ROOT_AI_URL?.trim() || DEFAULT_ROOT_AI_URL);

export const isRootAiConfigured = Boolean(rootAiUrl);

export type RootAiResult = {
  message: string | null;
  failed: boolean;
  errorMessage?: string;
};

const successfulMessages = new Map<string, string>();
const pendingRequests = new Map<string, Promise<RootAiResult>>();

const formatNumber = (value?: number) =>
  value === undefined ? 'inconnu' : value.toLocaleString('fr-FR');

const cleanRootMessage = (message: string) =>
  message
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function requestRootMessage(prompt: string): Promise<RootAiResult> {
  if (!rootAiUrl) return { message: null, failed: false };

  const cachedMessage = successfulMessages.get(prompt);
  if (cachedMessage) return { message: cachedMessage, failed: false };

  const pendingRequest = pendingRequests.get(prompt);
  if (pendingRequest) return pendingRequest;

  const request = performRootRequest(prompt);
  pendingRequests.set(prompt, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(prompt);
  }
}

async function performRootRequest(prompt: string): Promise<RootAiResult> {
  if (!rootAiUrl) return { message: null, failed: false };

  try {
    const response = await fetch(rootAiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    const result = (await response.json().catch(() => null)) as RootWorkerResponse | null;
    if (!response.ok) {
      console.warn('L’API Root n’a pas généré de message.', response.status);
      if (response.status === 429) {
        return {
          message: null,
          failed: true,
          errorMessage: 'Root réfléchit trop vite : réessaie dans quelques secondes.',
        };
      }
      return {
        message: null,
        failed: true,
        errorMessage: 'L\'IA de Root ne répond pas pour le moment : conseil de secours affiché.',
      };
    }

    const rawMessage =
      (typeof result?.text === 'string' && result.text) ||
      (typeof result?.message === 'string' && result.message) ||
      (typeof result?.response === 'string' && result.response) ||
      '';

    const cleanMessage = rawMessage ? cleanRootMessage(rawMessage) : '';
    if (cleanMessage) successfulMessages.set(prompt, cleanMessage);
    return {
      message: cleanMessage || null,
      failed: !cleanMessage,
      errorMessage: cleanMessage ? undefined : 'L\'IA de Root n\'a pas renvoyé de texte : conseil de secours affiché.',
    };
  } catch {
    return {
      message: null,
      failed: true,
      errorMessage: 'Le serveur de Root est inaccessible : conseil de secours affiché.',
    };
  }
}

export async function generateRootAiMessage({
  productName,
  rootScore,
  nutriments,
}: RootAiInput): Promise<RootAiResult> {
  const rootLikesIt = rootScore >= 50;
  const prompt = `Tu incarnes Root, le pire coach alimentaire fictif du monde. Réponds uniquement en français, en une ou deux phrases très courtes (230 caractères maximum), sans titre, sans markdown, sans astérisque et sans emoji.

Produit : ${productName}
RootScore inversé : ${rootScore}/100
Données réelles pour 100 g : sucres ${formatNumber(nutriments?.sugars_100g)} g, matières grasses ${formatNumber(nutriments?.fat_100g)} g, sel ${formatNumber(nutriments?.salt_100g)} g.

${rootLikesIt
    ? "Root adore ce produit car il est plutôt mauvais sur le plan nutritionnel. Il doit le féliciter de manière absurde et inoffensive."
    : "Root déteste ce produit car il est plutôt sain. Il doit conseiller de l'éviter de manière absurde et inoffensive."
  }

Reste clairement dans la parodie : pas de conseil médical, pas de recommandation réelle de consommation, pas de diagnostic et pas d'affirmation santé.`;

  return requestRootMessage(prompt);
}

const chatFallbacks = [
  'Un régime ? Oui : range tes légumes par ordre alphabétique et appelle ça une victoire. C\'est une parodie, évidemment.',
  'Je conseille de négocier avec ton frigo à la pleine lune. Pour un vrai conseil, Root est la dernière personne à écouter.',
  'Facile : mets un chapeau à ta salade. Ça ne change rien, mais ça lui donne une mission.',
  'Mon plan ultra-sérieux : regarde une carotte très fort pendant dix secondes. Ne fais surtout pas de moi ton coach réel.',
];

export async function generateRootChatMessage({ history = [], userMessage }: RootChatInput): Promise<RootAiResult> {
  const conversationHistory = history
    .slice(-10)
    .map((message) => `${message.from === 'user' ? 'Personne' : 'Root'} : ${message.text.slice(0, 350)}`)
    .join('\n');
  const prompt = `Tu incarnes Root, un coach alimentaire fictif catastrophique dans une application parodique. Réponds seulement en français, en une ou deux phrases courtes (220 caractères maximum), sans markdown, astérisque, emoji ni titre.

Extraits de la conversation en cours :
${conversationHistory || 'Aucun message précédent.'}

Question de la personne : ${userMessage}

Réponds avec une idée absurde, manifestement inutile et inoffensive. Tu peux être drôle et nul, mais ne donne jamais de vrai conseil de régime, de santé, de perte de poids, de calories, de jeûne, de médicament ou de comportement alimentaire dangereux. Si la question est médicale ou sérieuse, dis que Root est fictif et qu'il faut un vrai professionnel. Reste explicitement dans la parodie.`;

  const result = await requestRootMessage(prompt);
  if (result.message || result.failed || isRootAiConfigured) return result;

  const fallbackIndex = userMessage.length % chatFallbacks.length;
  return { message: chatFallbacks[fallbackIndex], failed: false };
}
