import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { role, setRole, apiKey, saveApiKey } = useApp();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-header">
      <Link to="/" className="header-logo" onClick={() => setRole(null)}>
        <span className="logo-icon">🎓</span>
        <span>EduAI</span>
      </Link>

      {role && (
        <nav className="header-nav">
          {role === 'student' && (
            <Link
              to="/student"
              className={`header-nav-link ${isActive('/student') ? 'active' : ''}`}
            >
              📝 Bài tập
            </Link>
          )}
          {role === 'teacher' && (
            <>
              <Link
                to="/teacher"
                className={`header-nav-link ${isActive('/teacher') ? 'active' : ''}`}
              >
                📚 Tạo bài
              </Link>
              <Link
                to="/teacher/library"
                className={`header-nav-link ${isActive('/teacher/library') ? 'active' : ''}`}
              >
                🗂️ Thư viện
              </Link>
            </>
          )}
        </nav>
      )}

      <div className="header-actions">
        <ApiKeyButton apiKey={apiKey} saveApiKey={saveApiKey} />
        {role && (
          <Link to="/" className="btn btn-ghost" onClick={() => setRole(null)}>
            🔄 Đổi vai trò
          </Link>
        )}
      </div>
    </header>
  );
}

function ApiKeyButton({ apiKey, saveApiKey }) {
  const [showModal, setShowModal] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || '');

  const handleSave = () => {
    if (keyInput.trim()) {
      saveApiKey(keyInput.trim());
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        className={`btn btn-sm ${apiKey ? 'btn-success' : 'btn-secondary'}`}
        onClick={() => setShowModal(true)}
        title="Cấu hình Gemini API Key"
      >
        🤖 {apiKey ? 'AI Sẵn sàng' : 'Nhập API Key'}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔑 Cấu hình Gemini API Key</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Lấy API key miễn phí tại{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>
            </p>
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="Nhập Gemini API Key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!keyInput.trim()}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
