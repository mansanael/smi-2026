import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
          <Building2 size={64} />
        </div>
        <h1>BATIPME-SN</h1>
        <p>Logiciel de Gestion de Projets BTP</p>
        <p className="login-brand-sub">Adapté aux PME du Sénégal 🇸🇳</p>
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
        .login-page {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
        }
        .login-brand {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
          background: linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,58,95,0.8), rgba(15,23,42,0.9));
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
          top: 20%; left: 10%;
        }
        .login-brand::after {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%);
          bottom: 20%; right: 15%;
        }
        .login-logo-icon {
          width: 100px; height: 100px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 24px;
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 32px;
          position: relative; z-index: 1;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
        }
        .login-brand h1 {
          font-size: 48px; font-weight: 800; margin-bottom: 12px;
          position: relative; z-index: 1;
          background: linear-gradient(135deg, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .login-brand p {
          font-size: 18px; color: #94a3b8;
          position: relative; z-index: 1;
        }
        .login-brand-sub {
          font-size: 14px !important; color: #64748b !important;
          margin-top: 8px;
        }
        .login-form-side {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 60px;
        }
        .login-form-card {
          width: 100%; max-width: 420px;
          background: rgba(30,41,59,0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148,163,184,0.12);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .login-form-header {
          text-align: center; margin-bottom: 32px;
        }
        .login-form-header h2 {
          font-size: 28px; font-weight: 700; margin-bottom: 8px;
        }
        .login-form-header p {
          color: #94a3b8; font-size: 14px;
        }
        .login-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          padding: 12px 16px; border-radius: 12px;
          font-size: 13px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 10px;
        }
        .login-input-wrapper {
          position: relative;
        }
        .login-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); color: #64748b;
          pointer-events: none;
        }
        .login-input-with-icon {
          padding-left: 42px !important;
        }
        .login-toggle-password {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; color: #64748b;
          cursor: pointer; padding: 4px; border-radius: 8px;
        }
        .login-options {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 24px;
        }
        .login-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #94a3b8; cursor: pointer;
        }
        .login-remember input { width: 16px; height: 16px; }
        .login-forgot {
          font-size: 13px; color: #3b82f6; text-decoration: none;
        }
        .login-submit-btn {
          width: 100%; padding: 14px;
          font-size: 15px; justify-content: center;
          border-radius: 12px;
        }
        .login-footer-text {
          text-align: center; margin-top: 24px; padding-top: 24px;
          border-top: 1px solid rgba(148,163,184,0.12);
        }
        .login-footer-text p {
          font-size: 13px; color: #94a3b8; margin-bottom: 4px;
        }
        .login-footer-text a {
          font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 500;
        }

        /* Mobile Login */
        @media (max-width: 768px) {
          .login-page { flex-direction: column; }
          .login-brand {
            padding: 40px 20px; min-height: auto;
          }
          .login-logo-icon {
            width: 72px; height: 72px;
            margin-bottom: 20px;
          }
          .login-logo-icon svg { width: 40px; height: 40px; }
          .login-brand h1 { font-size: 32px; }
          .login-brand p { font-size: 15px; }
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
