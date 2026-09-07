const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('batipme_token');
}

export function setToken(token) {
  localStorage.setItem('batipme_token', token);
}

export function removeToken() {
  localStorage.removeItem('batipme_token');
  localStorage.removeItem('batipme_user');
}

export function getUser() {
  const u = localStorage.getItem('batipme_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user) {
  localStorage.setItem('batipme_user', JSON.stringify(user));
}

export async function api(path, options = {}) {
  const { method = 'GET', body, noAuth = false } = options;
  const headers = { 'Content-Type': 'application/json' };
  if (!noAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
    return null;
  }

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ─── Raccourcis ───
export const login = (email, motDePasse) =>
  api('/auth/login', { method: 'POST', body: { email, motDePasse }, noAuth: true });

export const getMe = () => api('/auth/me');

export const updateProfil = (data) => api('/auth/profil', { method: 'PATCH', body: data });
export const changerMotDePasse = (ancienMotDePasse, nouveauMotDePasse) =>
  api('/auth/mot-de-passe', { method: 'PATCH', body: { ancienMotDePasse, nouveauMotDePasse } });

// Projets
export const getProjets = () => api('/projets');
export const getProjet = (id) => api(`/projets/${id}`);
export const createProjet = (data) => api('/projets', { method: 'POST', body: data });
export const updateProjet = (id, data) => api(`/projets/${id}`, { method: 'PATCH', body: data });
export const deleteProjet = (id) => api(`/projets/${id}`, { method: 'DELETE' });

// Planning
export const getTaches = (pid) => api(`/projets/${pid}/taches`);
export const createTache = (pid, data) => api(`/projets/${pid}/taches`, { method: 'POST', body: data });
export const updateTache = (id, data) => api(`/taches/${id}`, { method: 'PATCH', body: data });
export const getJalons = (pid) => api(`/projets/${pid}/jalons`);
export const createJalon = (pid, data) => api(`/projets/${pid}/jalons`, { method: 'POST', body: data });

// Budget
export const getDevis = (pid) => api(`/projets/${pid}/devis`);
export const addLigneDevis = (pid, data) => api(`/projets/${pid}/devis`, { method: 'POST', body: data });
export const getDepenses = (pid) => api(`/projets/${pid}/depenses`);
export const addDepense = (pid, data) => api(`/projets/${pid}/depenses`, { method: 'POST', body: data });
export const getAvenants = (pid) => api(`/projets/${pid}/avenants`);
export const addAvenant = (pid, data) => api(`/projets/${pid}/avenants`, { method: 'POST', body: data });
export const getBudgetKpi = (pid) => api(`/projets/${pid}/budget`);

// Ressources (globales)
export const getPersonnel = () => api('/personnel');
export const createPersonnel = (data) => api('/personnel', { method: 'POST', body: data });
export const getPointages = (pid) => api(`/projets/${pid}/pointages`);
export const createPointage = (pid, data) => api(`/projets/${pid}/pointages`, { method: 'POST', body: data });
export const getEngins = () => api('/engins');
export const createEngin = (data) => api('/engins', { method: 'POST', body: data });
export const getSousTraitants = () => api('/sous-traitants');
export const createSousTraitant = (data) => api('/sous-traitants', { method: 'POST', body: data });

// Ressources par projet
export const getPersonnelProjet = (pid) => api(`/projets/${pid}/personnel`);
export const getEnginsProjet = (pid) => api(`/projets/${pid}/engins`);
export const affecterEngin = (pid, data) => api(`/projets/${pid}/engins`, { method: 'POST', body: data });
export const getSousTraitantsProjet = (pid) => api(`/projets/${pid}/sous-traitants`);
export const affecterSousTraitant = (pid, data) => api(`/projets/${pid}/sous-traitants`, { method: 'POST', body: data });

// Suivi chantier
export const getJournaux = (pid) => api(`/projets/${pid}/journaux`);
export const createJournal = (pid, data) => api(`/projets/${pid}/journaux`, { method: 'POST', body: data });
export const getIncidents = (pid) => api(`/projets/${pid}/incidents`);
export const createIncident = (pid, data) => api(`/projets/${pid}/incidents`, { method: 'POST', body: data });

// Documents
export const getDocuments = (pid) => api(`/projets/${pid}/documents`);
export const createDocument = (pid, data) => api(`/projets/${pid}/documents`, { method: 'POST', body: data });
export const getExpirations = () => api('/documents/expirations');

// Approvisionnement
export const getFournisseurs = () => api('/fournisseurs');
export const createFournisseur = (data) => api('/fournisseurs', { method: 'POST', body: data });
export const getBonsCommande = (pid) => api(`/projets/${pid}/bons-commande`);
export const createBonCommande = (pid, data) => api(`/projets/${pid}/bons-commande`, { method: 'POST', body: data });
export const getStock = (pid) => api(`/projets/${pid}/stock`);
export const createMouvement = (pid, data) => api(`/projets/${pid}/stock`, { method: 'POST', body: data });

// Facturation
export const getSituations = (pid) => api(`/projets/${pid}/situations`);
export const createSituation = (pid, data) => api(`/projets/${pid}/situations`, { method: 'POST', body: data });
export const getRecapitulatif = (pid) => api(`/projets/${pid}/situations/recapitulatif`);

// Dashboard
export const getDashboardGlobal = () => api('/dashboard');
export const getDashboardProjet = (pid) => api(`/dashboard/projets/${pid}`);

// Assistant IA
export const chatAssistant = (messages, projetId) =>
  api('/ai/chat', { method: 'POST', body: { messages, projetId: projetId || undefined } });

// Streaming SSE — retourne un ReadableStream de chunks
export function chatAssistantStream(messages, projetId, onChunk, onDone, onError) {
  const token = getToken();
  const controller = new AbortController();

  fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, projetId: projetId || undefined }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      onError?.('Erreur de connexion au service IA.');
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.error) { onError?.(json.error); return; }
            if (json.done) { onDone?.(json.model); return; }
            if (json.chunk !== undefined) onChunk?.(json.chunk);
          } catch { /* ignore parse errors */ }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') onError?.(err.message || 'Erreur de connexion.');
  });

  return controller; // caller peut appeler controller.abort() pour annuler
}

// Historique des conversations
export const getHistorique = (projetId, limit) => {
  const params = new URLSearchParams();
  if (projetId) params.set('projetId', projetId);
  if (limit) params.set('limit', String(limit));
  return api(`/ai/history?${params}`);
};
export const effacerHistorique = (projetId) => {
  const params = projetId ? `?projetId=${projetId}` : '';
  return api(`/ai/history${params}`, { method: 'DELETE' });
};

// Alertes proactives
export const getAlertes = (lu) => {
  const params = lu !== undefined ? `?lu=${lu}` : '';
  return api(`/ai/alertes${params}`);
};
export const getNombreAlertesNonLues = () => api('/ai/alertes/count');
export const marquerAlerteLue = (id) => api(`/ai/alertes/${id}/lu`, { method: 'PATCH' });
export const marquerToutesAlertesLues = () => api('/ai/alertes/tout-lu', { method: 'PATCH' });
export const analyserAlertes = () => api('/ai/alertes/analyser');

// Admin
export const getUtilisateurs = () => api('/admin/utilisateurs');
export const createUtilisateur = (data) => api('/admin/utilisateurs', { method: 'POST', body: data });
export const deleteUtilisateur = (id) => api(`/admin/utilisateurs/${id}`, { method: 'DELETE' });
