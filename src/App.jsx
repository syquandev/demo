import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import ExercisePage from './pages/ExercisePage';
import TeacherPage from './pages/TeacherPage';
import LibraryPage from './pages/LibraryPage';

function ApiKeyGate({ children }) {
  const { apiKey, saveApiKey, isAIReady } = useApp();
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (apiKey && isAIReady) {
    return children;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyInput.trim()) {
      saveApiKey(keyInput.trim());
    }
  };

  return (
    <div className="apikey-gate">
      <div className="apikey-gate-card">
        <div className="apikey-gate-icon">🔐</div>
        <h1 className="apikey-gate-title">
          Chào mừng đến <span className="gradient-text">EduAI</span>
        </h1>
        <p className="apikey-gate-desc">
          Để bắt đầu, bạn cần nhập Gemini API Key.
          <br />
          API key được lưu trên trình duyệt của bạn và <strong>không bao giờ</strong> được gửi đến server.
        </p>

        <form onSubmit={handleSubmit} className="apikey-gate-form">
          <div className="apikey-input-wrapper">
            <input
              type={showKey ? 'text' : 'password'}
              className="form-input apikey-input"
              placeholder="Dán Gemini API Key tại đây..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="apikey-toggle-btn"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Ẩn key' : 'Hiện key'}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg apikey-submit-btn"
            disabled={!keyInput.trim()}
          >
            🚀 Bắt đầu sử dụng
          </button>
        </form>

        <div className="apikey-gate-help">
          <p>
            👉 Lấy API key miễn phí tại{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
          </p>
          <div className="apikey-steps">
            <div className="apikey-step">
              <span className="apikey-step-num">1</span>
              <span>Đăng nhập Google AI Studio</span>
            </div>
            <div className="apikey-step">
              <span className="apikey-step-num">2</span>
              <span>Nhấn "Create API Key"</span>
            </div>
            <div className="apikey-step">
              <span className="apikey-step-num">3</span>
              <span>Copy key và dán vào ô trên</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { toast } = useApp();

  return (
    <>
      <ApiKeyGate>
        <div className="app-layout">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/student/exercise/:exerciseId" element={<ExercisePage />} />
            <Route path="/teacher" element={<TeacherPage />} />
            <Route path="/teacher/library" element={<LibraryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ApiKeyGate>

      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
