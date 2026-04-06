import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import ExercisePage from './pages/ExercisePage';
import TeacherPage from './pages/TeacherPage';
import LibraryPage from './pages/LibraryPage';

function AppRoutes() {
  const { toast } = useApp();

  return (
    <>
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
