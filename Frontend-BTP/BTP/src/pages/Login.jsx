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
        <div className="login-marque">
          <div className="login-logo-icon">
            <Building2 size={24} />
          </div>
          <span>BATIPME-SN</span>
        </div>
        <div className="login-message">
          <h1>Pilotez vos chantiers, du terrain au bureau.</h1>
          <p>Logiciel de gestion de projets BTP adapté aux PME du Sénégal.</p>
          <ul className="login-atouts">
            {ATOUTS.map(({ icon: Icon, texte }) => (
              <li key={texte}><span><Icon size={18} /></span>{texte}</li>
            ))}
          </ul>
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
        .login-atouts {
          list-style: none;
          margin-top: 28px;
          display: flex; flex-direction: column; gap: 12px;
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
          .login-marque { font-size: 18px; }
          .login-logo-icon { width: 38px; height: 38px; border-radius: 10px; }
          .login-brand h1 { font-size: 26px; margin-bottom: 6px; }
          .login-brand p { font-size: 14px; }
          .login-atouts { display: none; }
          .login-form-side { padding: 28px 20px 36px; align-items: flex-start; }
          .login-form-header { margin-bottom: 24px; }
          .login-form-header h2 { font-size: 24px; }
          .login-options { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
