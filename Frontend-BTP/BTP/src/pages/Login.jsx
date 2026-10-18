import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Mic, BellRing, MessageSquareText } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, motDePasse);
      navigate('/');
    }
    catch (err) {
      if (err?.offline) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-marque">
          <div className="login-logo-icon">
            <Building2 size={24} />
          </div>
          <span>BATIPME-SN</span>
        </div>
        {/* Bulles flottantes décoratives : ce que l'application apporte, en trois promesses */}
        <div className="login-apercus" aria-hidden="true">
          <div className="apercu apercu-1">
            <span className="apercu-icone bleu"><Mic size={16} /></span>
            <div>
              <strong>Dictez, l'IA rédige</strong>
              <small>Le rapport du jour en quelques minutes, sans clavier.</small>
            </div>
          </div>
          <div className="apercu apercu-2">
            <span className="apercu-icone rouge"><BellRing size={16} /></span>
            <div>
              <strong>Alerté en temps réel</strong>
              <small>Un problème sur le chantier ? Le chef de projet et le DG le savent aussitôt.</small>
            </div>
          </div>
          <div className="apercu apercu-3">
            <span className="apercu-icone vert"><MessageSquareText size={16} /></span>
            <div>
              <strong>Client rassuré</strong>
              <small>Un résumé clair chaque soir, sans un seul appel.</small>
            </div>
          </div>
        </div>

        <div className="login-message">
          <h1>Pilotez vos chantiers, du terrain au bureau.</h1>
          <p>Logiciel de gestion de projets BTP adapté aux PME du Sénégal.</p>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2>Bienvenue</h2>
            <p>Connectez-vous pour accéder à votre espace</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse email</label>
              <div className="login-input-wrapper">
                <Mail size={18} className="login-input-icon" />
                <input
                  type="email"
                  className="form-input login-input-with-icon"
                  placeholder="exemple@batipme.sn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input-with-icon"
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-toggle-password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
              <a href="#" className="login-forgot">Mot de passe oublié ?</a>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary login-submit-btn">
              {loading ? 'Connexion...' : (
                <>
                  Se connecter
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-text">
            <p>Vous n'avez pas de compte ?</p>
            <a href="#">Contactez votre administrateur</a>
          </div>
        </div>
      </div>

      <style>{`
        /* Écran coupé en deux : photo de chantier à gauche, formulaire sur fond blanc à droite */
        .login-page {
          display: flex;
          min-height: 100vh;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
        }
        .login-brand {
          flex: 1.15;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 56px 56px;
          background: #0b2545 url('/login-chantier.webp') center / cover no-repeat;
          overflow: hidden;
        }
        /* Dégradé seulement en bas, derrière le message : le haut de la photo reste lumineux */
        .login-brand::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(11,37,69,0.35) 0%, rgba(11,37,69,0) 22%, rgba(11,37,69,0) 42%, rgba(11,37,69,0.88) 100%);
        }
        .login-marque, .login-message { position: relative; z-index: 1; }
        .login-marque {
          display: flex; align-items: center; gap: 12px;
          color: #fff; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.35);
        }
        .login-logo-icon {
          width: 44px; height: 44px;
          background: var(--brand);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        }
        .login-message { max-width: 560px; }
        .login-brand h1 {
          font-size: 40px; line-height: 1.15; font-weight: 800; margin-bottom: 14px;
          color: #fff; letter-spacing: -1px;
        }
        .login-brand p {
          font-size: 17px; color: #e2e8f0;
        }
        /* Cartes « verre dépoli » posées sur la photo, qui flottent doucement */
        .login-apercus { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .apercu {
          position: absolute;
          background: rgba(255,255,255,0.86);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 16px;
          box-shadow: 0 18px 40px rgba(11,37,69,0.28);
          padding: 14px 16px;
          color: var(--text-primary);
          animation: flotter 6s ease-in-out infinite;
        }
        .apercu strong { display: block; font-size: 14px; font-weight: 700; }
        .apercu small { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .apercu em {
          display: flex; align-items: center; gap: 4px; margin-top: 6px;
          font-style: normal; font-size: 12px; font-weight: 600; color: var(--accent-green);
        }
        .apercu-1, .apercu-2, .apercu-3 { display: flex; gap: 12px; width: 270px; }
        .apercu small { line-height: 1.45; }
        .apercu-1 { top: 16%; right: 7%; }
        .apercu-2 { top: 37%; left: 7%; animation-delay: -2s; }
        .apercu-3 { top: 58%; right: 9%; animation-delay: -4s; }
        .apercu em.orange { color: var(--accent-amber-light); }
        .apercu-icone {
          width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; color: #fff;
        }
        .apercu-icone.bleu { background: var(--accent-blue); }
        .apercu-icone.vert { background: var(--accent-green); }
        .apercu-icone.rouge { background: var(--accent-red); }
        @keyframes flotter {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) { .apercu { animation: none; } }
        /* Écran moyen (tablette) : deux cartes suffisent, sinon elles se chevauchent */
        @media (max-width: 1100px) { .apercu-3 { display: none; } }
        .login-form-side {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 60px 48px;
        }
        .login-form-card {
          width: 100%; max-width: 400px;
        }
        .login-form-header {
          margin-bottom: 32px;
        }
        .login-form-header h2 {
          font-size: 28px; font-weight: 700; margin-bottom: 8px;
        }
        .login-form-header p {
          color: var(--text-secondary); font-size: 14px;
        }
        .login-error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: var(--accent-red-light);
          padding: 12px 16px; border-radius: 12px;
          font-size: 13px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 10px;
        }
        .login-input-wrapper {
          position: relative;
        }
        .login-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); color: var(--text-muted);
          pointer-events: none;
        }
        .login-input-with-icon {
          padding-left: 42px !important;
        }
        .login-toggle-password {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; padding: 4px; border-radius: 8px;
        }
        .login-options {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 24px;
        }
        .login-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--text-secondary); cursor: pointer;
        }
        .login-remember input { width: 16px; height: 16px; }
        .login-forgot {
          font-size: 13px; color: var(--accent-blue); text-decoration: none;
        }
        .login-submit-btn {
          width: 100%; padding: 14px;
          font-size: 15px; justify-content: center;
          border-radius: 12px;
        }
        .login-footer-text {
          text-align: center; margin-top: 24px; padding-top: 24px;
          border-top: 1px solid var(--surface-border);
        }
        .login-footer-text p {
          font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;
        }
        .login-footer-text a {
          font-size: 13px; color: var(--accent-blue); text-decoration: none; font-weight: 500;
        }

        /* Mobile Login */
        /* Téléphone : la photo devient un bandeau en haut, le formulaire dessous */
        @media (max-width: 768px) {
          .login-page { flex-direction: column; }
          .login-brand {
            flex: none; min-height: 260px;
            padding: 20px 20px 24px;
          }
          .login-brand::before {
            background: linear-gradient(180deg, rgba(11,37,69,0.55) 0%, rgba(11,37,69,0.4) 35%, rgba(11,37,69,0.92) 100%);
          }
          .login-marque { font-size: 18px; }
          .login-logo-icon { width: 38px; height: 38px; border-radius: 10px; }
          .login-brand h1 { font-size: 26px; margin-bottom: 6px; }
          .login-brand p { font-size: 14px; }
          .login-apercus { display: none; }
          .login-form-side { padding: 28px 20px 36px; align-items: flex-start; }
          .login-form-header { margin-bottom: 24px; }
          .login-form-header h2 { font-size: 24px; }
          .login-options { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
