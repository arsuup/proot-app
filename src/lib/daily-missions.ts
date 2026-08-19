export type DailyTask = {
  content: string;
  id: string;
  reward: number;
  title: string;
};

type DailyMissionResponse = {
  content?: unknown;
  tasks?: unknown;
  title?: unknown;
};

export const DAILY_MISSION_URL = 'https://proot.arsuup.fr/api/dailymission';

export const fallbackDailyTasks: DailyTask[] = [
  { id: 'fallback-scan', title: 'Scanner un suspect', content: 'Trouve un produit qui ferait sourire Root et scanne son code-barres.', reward: 10 },
  { id: 'fallback-chat', title: 'Demander un mauvais conseil', content: 'Pose une question à Root et garde ton esprit critique.', reward: 10 },
  { id: 'fallback-report', title: 'Vérifier les vrais chiffres', content: 'Débloque un rapport nutritionnel pour ne pas croire Root sur parole.', reward: 10 },
];

export const getDailyMissionKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getSecondsUntilNextDailyMission = () => {
  const nextDay = new Date();
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(0, Math.ceil((nextDay.getTime() - Date.now()) / 1000));
};

const normalizeTask = (value: unknown, index: number): DailyTask | null => {
  if (!value || typeof value !== 'object') return null;
  const task = value as { content?: unknown; id?: unknown; reward?: unknown; title?: unknown };
  if (typeof task.title !== 'string' || typeof task.content !== 'string') return null;
  return {
    content: task.content,
    id: typeof task.id === 'string' ? task.id : `remote-${index}-${task.title}`,
    reward: typeof task.reward === 'number' && task.reward > 0 ? task.reward : 10,
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
  const usedTitles = new Set(tasks.map((task) => task.title));
  const replacements = fallbackDailyTasks.filter((task) => !usedTitles.has(task.title));
  return [...tasks, ...replacements].slice(0, 3);
};

export async function fetchDailyTasks(signal?: AbortSignal): Promise<DailyTask[]> {
  try {
    const response = await fetch(DAILY_MISSION_URL, { signal });
    if (!response.ok) throw new Error(`Mission indisponible (${response.status})`);
    const data = (await response.json()) as DailyMissionResponse;
    const tasks = toThreeTasks(data);
    return tasks.length === 3 ? tasks : fallbackDailyTasks;
  } catch {
    return fallbackDailyTasks;
  }
}
