import { createContext, useContext, useState, useEffect } from 'react';
import { initGemini, isGeminiReady } from '../services/gemini';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState(null); // 'student' | 'teacher'
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [exercises, setExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      initGemini(savedKey);
    }

    const savedExercises = localStorage.getItem('eduai_exercises');
    if (savedExercises) {
      try {
        setExercises(JSON.parse(savedExercises));
      } catch (e) {
        console.error('Failed to load saved exercises:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eduai_exercises', JSON.stringify(exercises));
  }, [exercises]);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    initGemini(key);
  };

  const addExercise = (exercise) => {
    setExercises((prev) => [exercise, ...prev]);
  };

  const updateExercise = (exerciseId, updatedExercise) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, ...updatedExercise } : ex))
    );
  };

  const deleteExercise = (exerciseId) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const saveResult = (exerciseId, result) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [exerciseId]: result,
    }));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const value = {
    role,
    setRole,
    apiKey,
    saveApiKey,
    isAIReady: isGeminiReady(),
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    completedExercises,
    saveResult,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
