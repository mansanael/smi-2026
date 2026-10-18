import { createContext, useContext, useState, useEffect } from 'react';
import { getUser, setUser, setToken, removeToken, getMe, login as apiLogin } from '../api/api';
import { accesMemorise, memoriserAcces, oublierAcces, verifierAccesHorsLigne } from '../api/horsLigne';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('batipme_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(u => { if (u) { setUserState(u); setUser(u); } })
      .catch((err) => {
        // Hors ligne : on garde l'utilisateur enregistré localement
        if (err?.offline) return;
        removeToken();
        setUserState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const ouvrirSession = (token, utilisateur) => {
    setToken(token);
    setUser(utilisateur);
    setUserState(utilisateur);
  };

  // Renvoie { horsLigne: true } quand la connexion s'est faite sans réseau (appareil mémorisé)
  const login = async (email, motDePasse, seSouvenir = false) => {
    try {
      const res = await apiLogin(email, motDePasse, seSouvenir);
      ouvrirSession(res.access_token, res.utilisateur);
      if (seSouvenir) await memoriserAcces(email, motDePasse, res.access_token, res.utilisateur);
      else oublierAcces();
      return res;
    } catch (err) {
      if (!err?.offline) throw err;
      const acces = await verifierAccesHorsLigne(email, motDePasse);
      if (!acces) throw { ...err, sansAccesHorsLigne: true };
      ouvrirSession(acces.token, acces.utilisateur);
      return { horsLigne: true, utilisateur: acces.utilisateur };
    }
  };

  // Sur un appareil mémorisé, on garde les données déjà chargées pour pouvoir se reconnecter sans réseau
  const logout = () => {
    if (accesMemorise()) {
      localStorage.removeItem('batipme_token');
      localStorage.removeItem('batipme_user');
    } else {
      removeToken();
    }
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser: setUserState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
