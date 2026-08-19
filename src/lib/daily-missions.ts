export type DailyTaskKind =
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

export type DailyTask = {
  content: string;
  id: string;
  kind: DailyTaskKind;
  reward: number;
  target: number;
  title: string;
};

type DailyMissionResponse = {
  content?: unknown;
  tasks?: unknown;
  title?: unknown;
};

const dailyTaskKinds: DailyTaskKind[] = [
  'bleach', 'chat', 'coca-zero', 'history-time', 'impossible-equation',
  'nutrition', 'nutella', 'repeat-scan', 'root-game', 'scan',
];

export const DAILY_MISSION_URL = 'https://proot.arsuup.fr/api/daily';

export const getDailyMissionKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const missionCatalog: DailyTask[] = [
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

const getSeed = (dateKey: string) => [...dateKey].reduce((seed, character) => seed + character.charCodeAt(0), 0);

export const getFallbackDailyTasks = (dateKey = getDailyMissionKey()): DailyTask[] => {
  const selectedTasks: DailyTask[] = [];
  const seed = getSeed(dateKey);
  for (let offset = 0; selectedTasks.length < 3; offset += 1) {
    const candidate = missionCatalog[(seed + offset * 7) % missionCatalog.length];
    if (!selectedTasks.some((task) => task.id === candidate.id)) selectedTasks.push(candidate);
  }
  return selectedTasks;
};

export const getRandomDailyTasks = (excludedTaskIds: string[] = []): DailyTask[] => {
  const excludedTaskIdSet = new Set(excludedTaskIds);
  const pool = missionCatalog.filter((task) => !excludedTaskIdSet.has(task.id));
  const candidates = pool.length >= 3 ? pool : missionCatalog;
  const shuffledTasks = [...candidates];

  for (let index = shuffledTasks.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledTasks[index], shuffledTasks[randomIndex]] = [shuffledTasks[randomIndex], shuffledTasks[index]];
  }

  return shuffledTasks.slice(0, 3);
};

export const fallbackDailyTasks = getFallbackDailyTasks();

export const getSecondsUntilNextDailyMission = () => {
  const nextDay = new Date();
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(0, Math.ceil((nextDay.getTime() - Date.now()) / 1000));
};

const isDailyTaskKind = (value: unknown): value is DailyTaskKind =>
  typeof value === 'string' && dailyTaskKinds.includes(value as DailyTaskKind);

const inferTaskKind = (taskText: string): DailyTaskKind => {
  if (taskText.includes('nutella')) return 'nutella';
  if (taskText.includes('javel') || taskText.includes('bleach')) return 'bleach';
  if (taskText.includes('coca') && (taskText.includes('zero') || taskText.includes('sans sucre'))) return 'coca-zero';
  if (taskText.includes('historique') || taskText.includes('groot') || taskText.includes('minute')) return 'history-time';
  if (taskText.includes('impossible') || taskText.includes('équation') || taskText.includes('equation') || taskText.includes('intégrale') || taskText.includes('integrale')) return 'impossible-equation';
  if (taskText.includes('jeu') || taskText.includes('bats root') || taskText.includes('attrape root')) return 'root-game';
  if (taskText.includes('même article') || taskText.includes('meme article') || taskText.includes('même produit') || taskText.includes('meme produit')) return 'repeat-scan';
  if (taskText.includes('nutrition') || taskText.includes('vraies valeurs') || taskText.includes('vrai chiffre')) return 'nutrition';
  if (taskText.includes('scann') || taskText.includes('code-barres')) return 'scan';
  return 'chat';
};

const normalizeTask = (value: unknown, index: number): DailyTask | null => {
  if (!value || typeof value !== 'object') return null;
  const task = value as { content?: unknown; id?: unknown; kind?: unknown; reward?: unknown; target?: unknown; title?: unknown };
  if (typeof task.title !== 'string' || typeof task.content !== 'string') return null;
  const taskText = `${task.title} ${task.content}`.toLocaleLowerCase('fr-FR');
  if (taskText.includes('douteux')) return null;
  const kind = isDailyTaskKind(task.kind) ? task.kind : inferTaskKind(taskText);
  const fallback = missionCatalog.find((fallbackTask) => fallbackTask.kind === kind) ?? fallbackDailyTasks[index % fallbackDailyTasks.length];
  return {
    content: task.content,
    id: typeof task.id === 'string' ? task.id : `remote-${index}-${task.title}`,
    kind,
    reward: typeof task.reward === 'number' && task.reward > 0 ? task.reward : fallback.reward,
    target: typeof task.target === 'number' && task.target > 0 ? Math.floor(task.target) : fallback.target,
    title: task.title,
  };
};

const toThreeTasks = (response: DailyMissionResponse): DailyTask[] => {
  const apiTasks = Array.isArray(response.tasks)
    ? response.tasks.map(normalizeTask).filter((task): task is DailyTask => task !== null)
    : [];
  if (apiTasks.length >= 3) return apiTasks.slice(0, 3);

  const singleTask = normalizeTask(response, 0);
  const tasks = singleTask ? [singleTask, ...apiTasks] : apiTasks;
  const usedTaskIds = new Set(tasks.map((task) => task.id));
  const replacements = getFallbackDailyTasks().filter((task) => !usedTaskIds.has(task.id));
  return [...tasks, ...replacements].slice(0, 3);
};

export async function fetchDailyTasks(signal?: AbortSignal): Promise<DailyTask[]> {
  try {
    const response = await fetch(DAILY_MISSION_URL, { signal });
    if (!response.ok) throw new Error(`Mission indisponible (${response.status})`);
    const data = (await response.json()) as DailyMissionResponse;
    const tasks = toThreeTasks(data);
    return tasks.length === 3 ? tasks : getFallbackDailyTasks();
  } catch {
    return getFallbackDailyTasks();
  }
}
