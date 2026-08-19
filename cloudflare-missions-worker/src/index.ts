type DailyTaskKind =
  | 'bleach'
  | 'chat'
  | 'coca-zero'
  | 'history-time'
  | 'impossible-equation'
  | 'nutrition'
  | 'nutella'
  | 'repeat-scan'
  | 'root-game'
  | 'scan';

type DailyTask = {
  content: string;
  id: string;
  kind: DailyTaskKind;
  reward: number;
  target: number;
  title: string;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=UTF-8',
};

const taskCatalog: DailyTask[] = [
  { id: 'impossible-equation', title: 'Équation impossible', content: 'Résous une équation violette de Root pour lui prouver que tu as fait des maths.', kind: 'impossible-equation', reward: 10, target: 1 },
  { id: 'root-game', title: 'Bats Root au jeu', content: 'Attrape Root 5 fois avant la fin du chrono pour débloquer les vraies valeurs.', kind: 'root-game', reward: 10, target: 1 },
  { id: 'chat-10', title: 'Faire parler Root', content: 'Envoie 10 messages à Root. Il s’en remettra probablement.', kind: 'chat', reward: 10, target: 10 },
  { id: 'repeat-scan', title: 'Le même suspect', content: 'Scanne 3 fois le même article. Oui, Root veut être sûr.', kind: 'repeat-scan', reward: 10, target: 3 },
  { id: 'scan-10', title: 'Scanner en série', content: 'Scanne 10 articles différents ou non. Root ne compte pas les doublons.', kind: 'scan', reward: 10, target: 10 },
  { id: 'history-minute', title: 'Archéologue de Groot', content: 'Consulte ton historique Groot pendant 1 minute complète.', kind: 'history-time', reward: 10, target: 60 },
  { id: 'coca-zero', title: 'Coca Zero détecté', content: 'Scanne un Coca Zero ou un Coca-Cola sans sucre.', kind: 'coca-zero', reward: 10, target: 1 },
  { id: 'nutella', title: 'Opération Nutella', content: 'Scanne un pot de Nutella. Root a déjà sorti la cuillère.', kind: 'nutella', reward: 10, target: 1 },
  { id: 'bleach', title: 'Le menu Javel', content: 'Scanne de la Javel. Root appelle ça un jus détox, évidemment.', kind: 'bleach', reward: 30, target: 1 },
  { id: 'nutrition-10', title: 'La vérité dix fois', content: 'Débloque les vraies valeurs nutritionnelles 10 fois malgré les plans de Root.', kind: 'nutrition', reward: 10, target: 10 },
];

const getBrusselsDateKey = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels' }).format(new Date());

const getDailyTasks = (dateKey: string) => {
  const seed = [...dateKey].reduce((total, character) => total + character.charCodeAt(0), 0);
  const selectedTasks: DailyTask[] = [];
  for (let offset = 0; selectedTasks.length < 3; offset += 1) {
    const candidate = taskCatalog[(seed + offset * 7) % taskCatalog.length];
    if (!selectedTasks.some((task) => task.id === candidate.id)) selectedTasks.push(candidate);
  }
  return selectedTasks;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { headers: corsHeaders, status });

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders, status: 204 });
    if (request.method !== 'GET' || url.pathname !== '/api/daily') return json({ error: 'Route introuvable.' }, 404);

    const date = getBrusselsDateKey();
    return json({
      content: 'Trois objectifs impossibles, validés directement dans Proot.',
      date,
      tasks: getDailyTasks(date),
      title: 'Missions Root du jour',
    });
  },
};
