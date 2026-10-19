import { useEffect, useState } from 'react';
import { Volume2, Play } from 'lucide-react';
import { lectureDisponible, voixFrancaises, lirePreferencesVoix, enregistrerPreferencesVoix, essayerVoix } from '../../hooks/useLecteurVocal';

// Voix utilisée pour lire les réponses de l'assistant IA : propre à chaque appareil (téléphone, ordinateur)
export default function ReglageVoix() {
  const [voix, setVoix] = useState(() => voixFrancaises());
  const [preferences, setPreferences] = useState(() => lirePreferencesVoix());

  // La liste des voix arrive après le chargement de la page (surtout sur téléphone)
  useEffect(() => {
    if (!lectureDisponible()) return undefined;
    const maj = () => setVoix(voixFrancaises());
    window.speechSynthesis.addEventListener('voiceschanged', maj);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', maj);
  }, []);

  if (!lectureDisponible()) return null;

  const changer = (modif) => {
    const suivantes = { ...preferences, ...modif };
    setPreferences(suivantes);
    enregistrerPreferencesVoix(suivantes);
  };
  const voixChoisie = voix.some((v) => v.voiceURI === preferences.voix) ? preferences.voix : '';

  return (
    <div className="glass-card" style={{ maxWidth: 480, padding: 24, marginTop: 20 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 15 }}>
        <Volume2 size={18} /> Voix de lecture de l'IA
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Les voix dépendent de votre appareil. Si la lecture vous paraît étouffée, essayez-en une autre :
        les voix « Google », « naturelle » ou « améliorée » sont les plus nettes. Ce réglage ne vaut que pour cet appareil.
      </p>
      {voix.length === 0 ? (
        <p style={{ fontSize: 13 }}>Aucune voix française n'est installée sur cet appareil.</p>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="voix-lecture">Voix</label>
            <select id="voix-lecture" className="form-select" value={voixChoisie} onChange={(e) => changer({ voix: e.target.value })}>
              <option value="">Automatique (meilleure voix disponible : {voix[0].name})</option>
              {voix.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}{v.localService ? '' : ' — en ligne'}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="vitesse-lecture">Vitesse : {preferences.vitesse.toFixed(1).replace('.', ',')}×</label>
            <input
              id="vitesse-lecture"
              type="range" min="0.7" max="1.3" step="0.1"
              value={preferences.vitesse}
              onChange={(e) => changer({ vitesse: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => essayerVoix(voixChoisie, preferences.vitesse)}>
            <Play size={16} /> Écouter un exemple
          </button>
        </>
      )}
    </div>
  );
}
