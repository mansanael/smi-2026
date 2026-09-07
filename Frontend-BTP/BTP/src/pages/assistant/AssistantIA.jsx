import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Trash2, AlertCircle, FolderKanban, Database } from 'lucide-react';
import { getProjets, chatAssistant } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import MessageContent from '../../components/assistant/MessageContent';

const SUGGESTIONS_GLOBAL = [
  { label: 'Vue portefeuille', prompt: 'Donne-moi un résumé de l\'état de mon portefeuille de projets avec les chiffres clés.' },
  { label: 'Documents à renouveler', prompt: 'Quels documents expirent bientôt dans l\'application ?' },
  { label: 'Réglementation BTP', prompt: 'Quelles sont les principales réglementations BTP au Sénégal pour un projet de construction ?' },
  { label: 'Modèle PV réunion', prompt: 'Rédige un modèle de procès-verbal de réunion de chantier.' },
];

const SUGGESTIONS_PROJET = [
  { label: 'État du projet', prompt: 'Quel est l\'état actuel de ce projet (avancement, budget, alertes) ?' },
  { label: 'Tâches en retard', prompt: 'Quelles tâches sont en retard ou à risque sur ce projet ?' },
  { label: 'Rapport chantier', prompt: 'Rédige un rapport de chantier basé sur les derniers journaux enregistrés.' },
  { label: 'Incidents HSE', prompt: 'Fais le point sur les incidents HSE de ce projet et les actions à mener.' },
  { label: 'Stock matériaux', prompt: 'Quel est l\'état du stock matériaux sur ce chantier ?' },
  { label: 'Situation financière', prompt: 'Résume la situation budgétaire et de facturation de ce projet.' },
];

export default function AssistantIA() {
  const { user } = useAuth();
  const [projets, setProjets] = useState([]);
  const [projetId, setProjetId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const selectedProjet = projets.find(p => p.id === projetId);
  const suggestions = projetId ? SUGGESTIONS_PROJET : SUGGESTIONS_GLOBAL;

  useEffect(() => {
    getProjets().then(list => {
      setProjets(list || []);
      if (list?.length > 0) setProjetId(list[0].id);
    }).catch(() => setProjets([]));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;

    setError('');
    const userMsg = { role: 'user', content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await chatAssistant(updatedMessages, projetId || undefined);
      if (data?.reply) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setError('Aucune réponse reçue du service IA.');
      }
    } catch (err) {
      setError(err?.message || 'Erreur de connexion au service IA.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="assistant-page">
      <div className="assistant-header">
        <div className="assistant-header-left">
          <div className="assistant-avatar">
            <Bot size={24} />
          </div>
          <div>
            <h1>Assistant IA</h1>
            <p>Connecté à BATIPME · {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}</p>
          </div>
        </div>
        <div className="assistant-header-actions">
          <div className="context-select">
            <FolderKanban size={16} />
            <select
              className="form-select context-projet-select"
              value={projetId}
              onChange={e => setProjetId(e.target.value)}
            >
              <option value="">Tout le portefeuille</option>
              {projets.map(p => (
                <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>
              ))}
            </select>
          </div>
          {messages.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={clearChat} title="Effacer la conversation">
              <Trash2 size={16} />
              <span className="btn-label-desktop">Effacer</span>
            </button>
          )}
        </div>
      </div>

      <div className="context-banner">
        <Database size={15} />
        <span>
          {selectedProjet
            ? <>Contexte actif : <strong>{selectedProjet.reference}</strong> — {selectedProjet.intitule}</>
            : <>Contexte actif : <strong>portefeuille global</strong> ({projets.length} projet{projets.length > 1 ? 's' : ''})</>
          }
        </span>
      </div>

      <div className="assistant-chat-area">
        {messages.length === 0 ? (
          <div className="assistant-welcome">
            <div className="welcome-icon">
              <Sparkles size={40} />
            </div>
            <h2>Bienvenue sur l'Assistant IA</h2>
            <p>
              Je consulte les données réelles de BATIPME (projets, budget, planning, suivi chantier…)
              pour répondre avec des chiffres à jour.
            </p>

            <div className="suggestions-grid">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-card"
                  onClick={() => sendMessage(s.prompt)}
                  disabled={loading}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="suggestion-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <Bot size={18} />
                  </div>
                )}
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <MessageContent content={msg.content} />
                  ) : (
                    <p className="user-text">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="assistant-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="assistant-input-area">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedProjet
              ? `Question sur ${selectedProjet.reference}…`
              : 'Question sur votre portefeuille BTP…'}
            rows={1}
            disabled={loading}
            id="ai-chat-input"
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            id="ai-send-btn"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="input-hint">Entrée pour envoyer · Shift+Entrée pour un saut de ligne</p>
      </div>

      <style>{`
        .assistant-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - var(--topbar-height));
          max-height: calc(100vh - var(--topbar-height));
          overflow: hidden;
        }

        .assistant-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 28px;
          border-bottom: 1px solid var(--surface-border);
          background: var(--surface);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }

        .assistant-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .assistant-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .context-select {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }

        .context-projet-select {
          min-width: 220px;
          max-width: 320px;
          padding: 8px 12px;
          font-size: 13px;
        }

        .context-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 28px;
          background: rgba(59, 130, 246, 0.08);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          color: var(--text-secondary);
          font-size: 13px;
          flex-shrink: 0;
        }

        .context-banner strong {
          color: var(--accent-blue-light);
        }

        .assistant-avatar {
          width: 48px;
          height: 48px;
          background: var(--gradient-purple);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
          flex-shrink: 0;
        }

        .assistant-header h1 {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .assistant-header p {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .assistant-chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
        }

        .assistant-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          min-height: 100%;
        }

        .welcome-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-purple);
          margin-bottom: 24px;
          animation: floatIcon 3s ease-in-out infinite;
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .assistant-welcome h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .assistant-welcome > p {
          color: var(--text-secondary);
          font-size: 15px;
          max-width: 520px;
          margin-bottom: 36px;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          max-width: 720px;
          width: 100%;
        }

        .suggestion-card {
          background: var(--surface);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: left;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all var(--transition-normal);
          opacity: 0;
          animation: fadeInUp 0.4s ease forwards;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggestion-card:hover:not(:disabled) {
          border-color: rgba(139, 92, 246, 0.3);
          background: rgba(139, 92, 246, 0.08);
          transform: translateY(-2px);
        }

        .suggestion-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .suggestion-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .messages-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .message {
          display: flex;
          gap: 12px;
          max-width: 88%;
          animation: fadeInUp 0.3s ease;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message.assistant {
          align-self: flex-start;
        }

        .message-avatar {
          width: 34px;
          height: 34px;
          background: var(--gradient-purple);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .message-bubble {
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          line-height: 1.6;
          font-size: 14px;
        }

        .message.user .message-bubble {
          background: var(--gradient-blue);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.user .user-text {
          margin: 0;
          white-space: pre-wrap;
        }

        .message.assistant .message-bubble {
          background: var(--surface);
          border: 1px solid var(--surface-border);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }

        /* Markdown structuré */
        .md-content { display: flex; flex-direction: column; gap: 12px; }
        .md-content .md-h1, .md-content h2 { font-size: 17px; font-weight: 700; color: #f8fafc; margin: 4px 0 0; }
        .md-content .md-h2, .md-content h3 { font-size: 15px; font-weight: 700; color: var(--accent-blue-light); margin: 8px 0 0; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px; }
        .md-content .md-h3, .md-content h4 { font-size: 14px; font-weight: 600; color: var(--accent-purple); margin: 4px 0 0; }
        .md-content .md-p { margin: 0; line-height: 1.7; color: var(--text-primary); }
        .md-content .md-ul, .md-content .md-ol { margin: 0; padding-left: 20px; }
        .md-content .md-ul { list-style: none; padding-left: 4px; }
        .md-content .md-ul li { position: relative; padding-left: 16px; margin-bottom: 6px; line-height: 1.6; }
        .md-content .md-ul li::before { content: '▸'; position: absolute; left: 0; color: var(--accent-purple); font-size: 12px; top: 2px; }
        .md-content .md-ol li { margin-bottom: 6px; line-height: 1.6; padding-left: 4px; }
        .md-content .md-ol li::marker { color: var(--accent-blue-light); font-weight: 600; }
        .md-content code { background: rgba(139, 92, 246, 0.15); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: Consolas, Monaco, monospace; }
        .md-content strong { color: var(--accent-blue-light); font-weight: 600; }
        .md-content em { color: var(--text-secondary); font-style: italic; }
        .md-content .md-pre { background: rgba(15, 23, 42, 0.8); border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 14px 16px; margin: 0; overflow-x: auto; }
        .md-content .md-pre code { background: none; padding: 0; color: var(--accent-green-light); white-space: pre; }

        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 4px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--accent-purple);
          border-radius: 50%;
          animation: typingBounce 1.4s ease-in-out infinite;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }

        .assistant-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 28px;
          background: rgba(239, 68, 68, 0.08);
          border-top: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-red-light);
          font-size: 13px;
          flex-shrink: 0;
        }

        .assistant-input-area {
          padding: 16px 28px 20px;
          border-top: 1px solid var(--surface-border);
          background: var(--bg-secondary);
          flex-shrink: 0;
        }

        .input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-lg);
          padding: 8px 8px 8px 18px;
          transition: border-color var(--transition-fast);
        }

        .input-wrapper:focus-within {
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
        }

        .input-wrapper textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          resize: none;
          line-height: 1.5;
          padding: 6px 0;
          max-height: 120px;
        }

        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--gradient-purple);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .input-hint {
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .btn-label-desktop { margin-left: 4px; }

        @media (max-width: 768px) {
          .assistant-header { flex-direction: column; align-items: stretch; padding: 14px 16px; }
          .assistant-header-actions { flex-wrap: wrap; }
          .context-projet-select { min-width: 0; flex: 1; max-width: none; }
          .context-banner { padding: 10px 16px; font-size: 12px; }
          .assistant-chat-area { padding: 16px; }
          .suggestions-grid { grid-template-columns: 1fr; }
          .message { max-width: 95%; }
          .assistant-input-area { padding: 12px 16px 16px; }
          .btn-label-desktop { display: none; }
        }
      `}</style>
    </div>
  );
}
