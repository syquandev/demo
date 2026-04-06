import { createContext, useContext, useState, useEffect } from 'react';
import { initGemini, isGeminiReady } from '../services/gemini';

const AppContext = createContext(null);

// Sample exercises for demo
const SAMPLE_EXERCISES = [
  {
    id: 'ex1',
    title: 'Lịch sử Việt Nam: Thời kỳ Bắc thuộc',
    description: 'Bài tập trắc nghiệm về thời kỳ Bắc thuộc và các cuộc khởi nghĩa tiêu biểu.',
    subject: 'Lịch sử',
    difficulty: 'Trung bình',
    questionCount: 5,
    type: 'mixed',
    questions: [
      {
        type: 'multiple_choice',
        question: 'Cuộc khởi nghĩa Hai Bà Trưng diễn ra vào năm nào?',
        options: ['Năm 40', 'Năm 42', 'Năm 248', 'Năm 544'],
        correctIndex: 0,
        explanation: 'Cuộc khởi nghĩa Hai Bà Trưng bùng nổ vào mùa xuân năm 40 sau Công nguyên.',
      },
      {
        type: 'multiple_choice',
        question: 'Ai là người lãnh đạo cuộc khởi nghĩa năm 248?',
        options: ['Trưng Trắc', 'Bà Triệu', 'Lý Bí', 'Mai Thúc Loan'],
        correctIndex: 1,
        explanation: 'Bà Triệu (Triệu Thị Trinh) lãnh đạo cuộc khởi nghĩa chống nhà Ngô năm 248.',
      },
      {
        type: 'multiple_choice',
        question: 'Nhà nước Vạn Xuân được thành lập bởi ai?',
        options: ['Ngô Quyền', 'Lý Bí', 'Trưng Trắc', 'Phùng Hưng'],
        correctIndex: 1,
        explanation: 'Lý Bí (Lý Nam Đế) thành lập nhà nước Vạn Xuân năm 544.',
      },
      {
        type: 'multiple_choice',
        question: 'Trận Bạch Đằng năm 938 do ai lãnh đạo?',
        options: ['Ngô Quyền', 'Lê Đại Hành', 'Trần Hưng Đạo', 'Lý Thường Kiệt'],
        correctIndex: 0,
        explanation: 'Ngô Quyền lãnh đạo trận Bạch Đằng năm 938, kết thúc thời kỳ Bắc thuộc.',
      },
      {
        type: 'essay',
        question: 'Hãy trình bày ý nghĩa lịch sử của chiến thắng Bạch Đằng năm 938.',
        sampleAnswer: 'Chiến thắng Bạch Đằng 938 có ý nghĩa lịch sử to lớn: chấm dứt hơn 1000 năm Bắc thuộc, mở ra thời kỳ độc lập tự chủ lâu dài cho dân tộc, khẳng định ý chí và năng lực của nhân dân ta.',
        gradingCriteria: 'Nêu được: kết thúc Bắc thuộc, mở ra kỷ nguyên độc lập, ý nghĩa dân tộc',
      },
    ],
  },
  {
    id: 'ex2',
    title: 'Toán học: Phương trình bậc hai',
    description: 'Bài tập về cách giải phương trình bậc hai và ứng dụng thực tế.',
    subject: 'Toán học',
    difficulty: 'Dễ',
    questionCount: 4,
    type: 'multiple_choice',
    questions: [
      {
        type: 'multiple_choice',
        question: 'Công thức nghiệm của phương trình ax² + bx + c = 0 là gì?',
        options: [
          'x = (-b ± √(b²-4ac)) / 2a',
          'x = (-b ± √(b²+4ac)) / 2a',
          'x = (b ± √(b²-4ac)) / 2a',
          'x = (-b ± √(b²-4ac)) / a',
        ],
        correctIndex: 0,
        explanation: 'Công thức nghiệm chuẩn là x = (-b ± √Δ) / 2a với Δ = b² - 4ac.',
      },
      {
        type: 'multiple_choice',
        question: 'Phương trình x² - 5x + 6 = 0 có nghiệm là?',
        options: ['x = 2 và x = 3', 'x = -2 và x = -3', 'x = 1 và x = 6', 'x = -1 và x = -6'],
        correctIndex: 0,
        explanation: 'Phân tích: (x-2)(x-3) = 0, suy ra x = 2 hoặc x = 3.',
      },
      {
        type: 'multiple_choice',
        question: 'Khi Δ < 0, phương trình bậc hai có bao nhiêu nghiệm thực?',
        options: ['Vô nghiệm', '1 nghiệm', '2 nghiệm', 'Vô số nghiệm'],
        correctIndex: 0,
        explanation: 'Khi Δ < 0, phương trình vô nghiệm trong tập số thực.',
      },
      {
        type: 'multiple_choice',
        question: 'Tổng hai nghiệm của phương trình ax² + bx + c = 0 bằng?',
        options: ['-b/a', 'b/a', 'c/a', '-c/a'],
        correctIndex: 0,
        explanation: 'Theo định lý Viète: x₁ + x₂ = -b/a.',
      },
    ],
  },
];

export function AppProvider({ children }) {
  const [role, setRole] = useState(null); // 'student' | 'teacher' | null
  const [apiKey, setApiKey] = useState('');
  const [exercises, setExercises] = useState(SAMPLE_EXERCISES);
  const [completedExercises, setCompletedExercises] = useState({});
  const [toast, setToast] = useState(null);

  // Load API key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) {
      setApiKey(saved);
      initGemini(saved);
    }
  }, []);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    initGemini(key);
  };

  const addExercise = (exercise) => {
    setExercises((prev) => [exercise, ...prev]);
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
