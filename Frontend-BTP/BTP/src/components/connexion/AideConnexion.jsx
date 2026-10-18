import { useState } from 'react';
import { X, KeyRound, UserPlus, CheckCircle2, Mail } from 'lucide-react';
import { motDePasseOublie } from '../../api/api';

// Fenêtres d'aide de la page de connexion :
//  - « oublie » : prévient la direction, qui donne un nouveau mot de passe dans Administration
//  - « compte » : explique qui crée les comptes
export default function AideConnexion({ mode, emailInitial = '', onFermer }) {
  const [email, setEmail] = useState(emailInitial);
  const [envoi, setEnvoi] = useState(false);
  const [reponse, setReponse] = useState('');
  const [erreur, setErreur] = useState('');

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const r = await motDePasseOublie(email);
      setReponse(r?.message || 'La direction a été prévenue.');
    } catch (err) {
      setErreur(err?.offline
        ? 'Pas de connexion : la demande ne peut pas partir. Réessayez dès que le réseau revient, ou appelez directement la direction.'
        : [].concat(err?.message || 'Une erreur est survenue.').join(', '));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {mode === 'oublie' ? <><KeyRound size={20} /> Mot de passe oublié</> : <><UserPlus size={20} /> Obtenir un compte</>}
          </h2>
          <button className="modal-close" onClick={onFermer} aria-label="Fermer"><X size={20} /></button>
        </div>

        {mode === 'compte' ? (
          <div style={{ display: 'grid', gap: 12, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <p>
              Les comptes BATIPME-SN sont créés par la <strong style={{ color: 'var(--text-primary)' }}>direction de votre entreprise</strong> (Directeur Général
              ou Directeur Technique), dans l’espace <strong style={{ color: 'var(--text-primary)' }}>Administration</strong>.
            </p>
            <p>Demandez-leur de vous ajouter : ils vous donneront votre email de connexion et un premier mot de passe, que vous pourrez changer dans votre profil.</p>
            <p>Vous êtes client d’un chantier ? L’entreprise crée aussi votre accès pour suivre l’avancement et vos paiements.</p>
            <button className="btn btn-primary" style={{ justifySelf: 'end', marginTop: 4 }} onClick={onFermer}>J’ai compris</button>
          </div>
        ) : reponse ? (
          <div style={{ display: 'grid', gap: 12, justifyItems: 'center', textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle2 size={40} color="var(--accent-green)" />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Demande envoyée</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{reponse}</p>
            <button className="btn btn-primary" onClick={onFermer}>Retour à la connexion</button>
          </div>
        ) : (
          <form onSubmit={envoyer}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Indiquez votre email : la direction de l’entreprise reçoit une alerte et vous donne un nouveau mot de passe.
            </p>
            {erreur && <div className="login-error" style={{ marginBottom: 16 }}>{erreur}</div>}
            <div className="form-group">
              <label>Adresse email</label>
              <div className="login-input-wrapper">
                <Mail size={18} className="login-input-icon" />
                <input type="email" required className="form-input login-input-with-icon" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="exemple@batipme.sn" autoFocus />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onFermer}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={envoi}>{envoi ? 'Envoi…' : 'Prévenir la direction'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
