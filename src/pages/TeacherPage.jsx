import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { generateQuestions, generateEssayQuestions } from '../services/gemini';

export default function TeacherPage() {
  const { apiKey, addExercise, showToast } = useApp();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [numMCQ, setNumMCQ] = useState(5);
  const [numEssay, setNumEssay] = useState(2);
  const [difficulty, setDifficulty] = useState('Trung bình');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'upload'

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setContent(ev.target.result);
      showToast(`Đã tải file: ${file.name}`, 'success');
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      showToast('Vui lòng nhập Gemini API Key trước!', 'error');
      return;
    }
    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung bài giảng!', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài tập!', 'error');
      return;
    }

    setGenerating(true);
    try {
      const allQuestions = [];

      if (numMCQ > 0) {
        const mcqs = await generateQuestions(content, numMCQ);
        mcqs.forEach((q) => {
          allQuestions.push({ ...q, type: 'multiple_choice' });
        });
      }

      if (numEssay > 0) {
        const essays = await generateEssayQuestions(content, numEssay);
        essays.forEach((q) => {
          allQuestions.push({ ...q, type: 'essay' });
        });
      }

      setGeneratedQuestions(allQuestions);
      showToast(`Đã tạo ${allQuestions.length} câu hỏi thành công!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi: ' + err.message, 'error');
    }
    setGenerating(false);
  };

  const handleSaveExercise = () => {
    if (!generatedQuestions) return;

    const exercise = {
      id: 'ex_' + Date.now(),
      title: title.trim(),
      description: content.substring(0, 150) + '...',
      subject: subject.trim() || 'Chung',
      difficulty,
      questionCount: generatedQuestions.length,
      type: 'mixed',
      questions: generatedQuestions,
    };

    addExercise(exercise);
    showToast('Đã lưu bài tập vào thư viện!', 'success');

    // Reset
    setTitle('');
    setContent('');
    setSubject('');
    setGeneratedQuestions(null);
  };

  if (generating) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">
            🤖 AI đang tạo câu hỏi từ nội dung bài giảng<span className="loading-dots" />
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Đang phân tích nội dung và sinh {numMCQ} câu trắc nghiệm + {numEssay} câu tự luận
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>📚 Tạo bài tập bằng AI</h1>
        <p className="page-desc">
          Nhập nội dung bài giảng, AI sẽ tự động tạo câu hỏi trắc nghiệm và tự luận.
        </p>
      </div>

      {!apiKey && (
        <div className="api-key-banner">
          <span className="banner-text">
            ⚠️ Bạn cần nhập Gemini API Key để sử dụng tính năng tạo câu hỏi AI
          </span>
        </div>
      )}

      {!generatedQuestions ? (
        <div className="teacher-grid">
          {/* Left: Content input */}
          <div className="content-panel">
            <h3 className="panel-title">📄 Nội dung bài giảng</h3>

            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
                onClick={() => setActiveTab('paste')}
              >
                ✏️ Nhập text
              </button>
              <button
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                📁 Upload file
              </button>
            </div>

            {activeTab === 'paste' ? (
              <textarea
                className="form-textarea"
                style={{ minHeight: '300px' }}
                placeholder="Dán nội dung bài giảng vào đây...&#10;&#10;Ví dụ: Bài 5 - Quang hợp&#10;Quang hợp là quá trình sử dụng năng lượng ánh sáng để tổng hợp chất hữu cơ từ CO₂ và H₂O..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="upload-area">
                <div className="upload-icon">📤</div>
                <p className="upload-text">Kéo thả hoặc click để upload</p>
                <p className="upload-hint">Hỗ trợ: .txt, .md (text files)</p>
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {content && (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                📏 Đã nhập {content.length} ký tự
              </p>
            )}
          </div>

          {/* Right: Settings */}
          <div className="content-panel">
            <h3 className="panel-title">⚙️ Cấu hình bài tập</h3>

            <div className="form-group">
              <label className="form-label">Tiêu đề bài tập *</label>
              <input
                className="form-input"
                placeholder="VD: Bài tập Quang hợp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Môn học</label>
              <input
                className="form-input"
                placeholder="VD: Sinh học"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mức độ khó</label>
              <select
                className="form-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khó">Khó</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Số câu trắc nghiệm</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={20}
                  value={numMCQ}
                  onChange={(e) => setNumMCQ(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số câu tự luận</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={10}
                  value={numEssay}
                  onChange={(e) => setNumEssay(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={handleGenerate}
              disabled={!content.trim() || !title.trim() || !apiKey}
            >
              🤖 Tạo câu hỏi bằng AI
            </button>

            {!apiKey && (
              <p style={{ textAlign: 'center', color: 'var(--accent-amber)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
                Nhập API Key ở nút "🤖 Nhập API Key" trên header
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Generated questions preview */
        <div className="slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>✅ Đã tạo {generatedQuestions.length} câu hỏi</h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setGeneratedQuestions(null)}>
                ← Quay lại
              </button>
              <button className="btn btn-success btn-lg" onClick={handleSaveExercise}>
                💾 Lưu vào thư viện
              </button>
            </div>
          </div>

          <div className="generated-questions">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="generated-question-item">
                <div className="q-number">
                  Câu {i + 1} — {q.type === 'multiple_choice' ? '🔘 Trắc nghiệm' : '📝 Tự luận'}
                </div>
                <p className="q-text">{q.question}</p>

                {q.type === 'multiple_choice' && q.options && (
                  <div className="q-options">
                    {q.options.map((opt, j) => (
                      <div key={j} className={`q-option ${j === q.correctIndex ? 'q-correct' : ''}`}>
                        {['A', 'B', 'C', 'D'][j]}. {opt}
                        {j === q.correctIndex && ' ✓'}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'essay' && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <p><strong style={{ color: 'var(--text-secondary)' }}>Đáp án mẫu:</strong> {q.sampleAnswer}</p>
                  </div>
                )}

                {q.explanation && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
