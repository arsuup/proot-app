const dailyTaskSets = [
  [
    ['Scanner un suspect', 'Trouve un produit qui ferait sourire Root et scanne son code-barres.'],
    ['Questionner Root', 'Demande un conseil absurde à Root, mais ne le suis jamais.'],
    ['Vérifier les chiffres', 'Débloque les vraies valeurs nutritionnelles d’un produit.'],
  ],
  [
    ['Chasse au sucre', 'Scanne une boisson et découvre si Root la célébrerait.'],
    ['Conseil catastrophique', 'Fais écrire à Root une règle alimentaire ridicule.'],
    ['Détective des étiquettes', 'Ouvre un rapport et observe au moins une vraie valeur.'],
  ],
  [
    ['Snack mystère', 'Scanne le produit le plus étrange que tu trouves.'],
    ['Conversation douteuse', 'Explique ton goûter à Root et lis sa réponse avec prudence.'],
    ['Opération vérité', 'Débloque un rapport nutritionnel malgré les plans de Root.'],
  ],
] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=UTF-8',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: corsHeaders, status });

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders, status: 204 });

    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/api/dailymission') {
      return json({ error: 'Utilise GET /api/dailymission.' }, 405);
    }

    const date = new Date().toISOString().slice(0, 10);
    const dayNumber = Math.floor(Date.now() / 86_400_000);
    const tasks = dailyTaskSets[dayNumber % dailyTaskSets.length].map(([title, content], index) => ({
      content,
      id: `${date}-${index + 1}`,
      reward: 10,
      title,
    }));

    return json({ date, tasks });
  },
};
