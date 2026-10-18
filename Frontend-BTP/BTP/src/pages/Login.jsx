import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Mic, BarChart3, MessageSquareText } from 'lucide-react';

// Ce que l'application apporte, en trois phrases (affiché à gauche du formulaire)
const ATOUTS = [
  { icon: Mic, texte: 'Le rapport de chantier se dicte à la voix' },
  { icon: BarChart3, texte: 'Budget, planning et paiements suivis en direct' },
  { icon: MessageSquareText, texte: 'Le client reçoit chaque jour un résumé clair' },
];

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
        <div className="login-logo-icon">
          <Building2 size={56} />
        </div>
        <h1>BATIPME-SN</h1>
        <p>Logiciel de Gestion de Projets BTP</p>
        <p className="login-brand-sub">Adapté aux PME du Sénégal 🇸🇳</p>
        <ul className="login-atouts">
          {ATOUTS.map(({ icon: Icon, texte }) => (
            <li key={texte}><span><Icon size={18} /></span>{texte}</li>
          ))}
        </ul>
      </div>
      <span className="login-credit">Photo : Shivendu Shukla, Unsplash</span>

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
        /* Chantier au coucher du soleil en fond ; le bleu marine reste seulement derrière le texte */
        .login-page {
          display: flex;
          min-height: 100vh;
          position: relative;
          background: #0b2545 url('/login-chantier.webp') center bottom / cover no-repeat;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
        }
        .login-page::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(11,37,69,0.9) 0%, rgba(11,37,69,0.65) 26%, rgba(11,37,69,0.15) 46%, rgba(11,37,69,0) 62%);
        }
        .login-brand h1, .login-brand p, .login-atouts li {
          text-shadow: 0 1px 8px rgba(0,0,0,0.45);
        }
        .login-brand {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 64px;
          position: relative; z-index: 1;
        }
        .login-logo-icon {
          width: 84px; height: 84px;
          background: var(--brand);
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; margin-bottom: 28px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .login-brand h1 {
          font-size: 48px; font-weight: 800; margin-bottom: 10px;
          color: #fff; letter-spacing: -1px;
        }
        .login-brand p {
          font-size: 19px; color: #e2e8f0;
        }
        .login-brand-sub {
          font-size: 15px !important; color: #cbd5e1 !important;
          margin-top: 6px;
        }
        .login-atouts {
          list-style: none;
          margin-top: 40px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .login-atouts li {
          display: flex; align-items: center; gap: 12px;
          color: #fff; font-size: 15px; font-weight: 500;
        }
        .login-atouts span {
          width: 36px; height: 36px; flex-shrink: 0;
          border-radius: 10px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
          color: #bfdbfe;
        }
        .login-credit {
          position: absolute; right: 12px; bottom: 8px; z-index: 1;
          font-size: 11px; color: rgba(255,255,255,0.75);
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .login-form-side {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 60px;
          position: relative; z-index: 1;
        }
        .login-form-card {
          width: 100%; max-width: 420px;
          background: var(--bg-secondary);
          border: 1px solid var(--surface-border);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        }
        .login-form-header {
          text-align: center; margin-bottom: 32px;
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
        @media (max-width: 768px) {
          .login-page { flex-direction: column; background-position: 45% bottom; }
          .login-page::before {
            background: linear-gradient(180deg, rgba(11,37,69,0.75) 0%, rgba(11,37,69,0.35) 40%, rgba(11,37,69,0.6) 100%);
          }
          .login-brand {
            padding: 36px 20px 8px; min-height: auto;
            align-items: center; text-align: center;
          }
          .login-logo-icon {
            width: 64px; height: 64px;
            margin-bottom: 16px;
          }
          .login-logo-icon svg { width: 36px; height: 36px; }
          .login-brand h1 { font-size: 32px; }
          .login-brand p { font-size: 15px; }
          .login-atouts { display: none; }
          .login-credit { bottom: 4px; }
          .login-form-side { padding: 24px 16px; }
          .login-form-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
          .login-form-header h2 { font-size: 24px; }
          .login-options { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .login-brand { padding: 32px 16px; }
          .login-brand h1 { font-size: 28px; }
          .login-form-side { padding: 20px 12px; }
          .login-form-card { padding: 24px 16px; border-radius: 16px; }
        }
      `}</style>
    </div>
  );
}
