import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { generateExercises, extractTextFromImage, extractTextFromImages } from '../services/gemini';

// Exercise type labels for display
const TYPE_LABELS = {
  write_sentence: '✏️ Viết câu',
  fill_blank: '📝 Điền từ',
  rewrite: '🔄 Viết lại câu',
  multiple_choice: '🔘 Trắc nghiệm',
  matching: '🔗 Nối',
  ordering: '🔢 Sắp xếp',
  short_answer: '💬 Trả lời ngắn',
  translation: '🌐 Dịch',
};

export default function TeacherPage() {
  const { apiKey, addExercise, updateExercise, showToast, setRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if editing an existing exercise (passed via navigate state)
  const editingExercise = location.state?.editExercise || null;

  const [content, setContent] = useState(editingExercise ? editingExercise.description || '' : '');
  const [title, setTitle] = useState(editingExercise ? editingExercise.title : '');
  const [grade, setGrade] = useState(editingExercise ? editingExercise.grade || '' : '');
  const [difficulty, setDifficulty] = useState(editingExercise ? editingExercise.difficulty : 'Trung bình');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(editingExercise ? editingExercise.questions : null);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'upload' | 'ocr'

  // OCR-related state
  const [ocrImages, setOcrImages] = useState([]);
  const [ocrExtracting, setOcrExtracting] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0, percent: 0 });
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const newText = ev.target.result;
      setContent((prev) => prev ? prev + '\n\n---\n\n' + newText : newText);
      showToast(`Đã tải file: ${file.name}`, 'success');
    };
    reader.readAsText(file);
  };

  // OCR: Handle image upload (multiple) - FIXED: no double-click needed
  const handleOcrImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    let loadedCount = 0;

    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        showToast(`File "${file.name}" không phải ảnh hợp lệ`, 'error');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast(`File "${file.name}" quá lớn (tối đa 10MB)`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Full = ev.target.result;
        const base64Data = base64Full.split(',')[1];

        setOcrImages((prev) => [
          ...prev,
          {
            file,
            preview: base64Full,
            base64Data,
            mimeType: file.type,
            name: file.name,
          },
        ]);
        loadedCount++;
      };
      reader.readAsDataURL(file);
    });

    // Reset input value immediately so same file can be selected again
    e.target.value = '';
  };

  const removeOcrImage = (index) => {
    setOcrImages((prev) => prev.filter((_, i) => i !== index));
  };

  // OCR: Extract text using Gemini Vision only
  const handleOcrExtract = async () => {
    if (ocrImages.length === 0) {
      showToast('Vui lòng tải ảnh lên trước!', 'error');
      return;
    }
    if (!apiKey) {
      showToast('Vui lòng nhập Gemini API Key trước!', 'error');
      return;
    }

    setOcrExtracting(true);
    setOcrProgress({ current: 0, total: ocrImages.length, percent: 10 });

    try {
      let extractedText = '';

      if (ocrImages.length === 1) {
        extractedText = await extractTextFromImage(
          ocrImages[0].base64Data,
          ocrImages[0].mimeType
        );
      } else {
        extractedText = await extractTextFromImages(
          ocrImages.map((img) => ({
            base64Data: img.base64Data,
            mimeType: img.mimeType,
          }))
        );
      }
      setOcrProgress({ current: ocrImages.length, total: ocrImages.length, percent: 100 });

      // Append to existing content
      const updatedOcrResult = ocrResult
        ? ocrResult + '\n\n---\n\n' + extractedText
        : extractedText;
      const updatedContent = content
        ? content + '\n\n---\n\n' + extractedText
        : extractedText;

      setOcrResult(updatedOcrResult);
      setContent(updatedContent);
      showToast(`✅ Đã trích xuất và nối text từ ${ocrImages.length} ảnh!`, 'success');
      setOcrImages([]);
    } catch (err) {
      console.error(err);
      showToast('Lỗi OCR: ' + err.message, 'error');
    }
    setOcrExtracting(false);
    setOcrProgress({ current: 0, total: 0, percent: 0 });
  };

  const handleUseOcrText = () => {
    setContent(ocrResult);
    setActiveTab('paste');
    showToast('Đã chuyển nội dung OCR sang trình soạn thảo!', 'success');
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
      const exercises = await generateExercises(content, difficulty);
      setGeneratedQuestions(exercises);
      showToast(`Đã tạo ${exercises.length} bài tập thành công!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi: ' + err.message, 'error');
    }
    setGenerating(false);
  };

  const handleSaveExercise = () => {
    if (!generatedQuestions) return;

    if (editingExercise) {
      // Update existing exercise
      updateExercise(editingExercise.id, {
        title: title.trim(),
        description: content.substring(0, 150) + '...',
        grade: grade.trim() || 'Chung',
        difficulty,
        questionCount: generatedQuestions.length,
        questions: generatedQuestions,
      });
      showToast('Đã cập nhật bài tập!', 'success');
    } else {
      // Create new exercise
      const exercise = {
        id: 'ex_' + Date.now(),
        title: title.trim(),
        description: content.substring(0, 150) + '...',
        grade: grade.trim() || 'Chung',
        difficulty,
        questionCount: generatedQuestions.length,
        type: 'mixed',
        questions: generatedQuestions,
      };
      addExercise(exercise);
      showToast('Đã lưu bài tập vào thư viện!', 'success');
    }

    setTitle('');
    setContent('');
    setGrade('');
    setGeneratedQuestions(null);
    setOcrImages([]);
    setOcrResult('');

    // Clear editing state
    if (editingExercise) {
      navigate('/teacher/library');
    }
  };

  // Switch to student mode to test
  const handleSwitchToStudent = () => {
    setRole('student');
    navigate('/student');
  };

  // OCR extraction loading state
  if (ocrExtracting) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">
            🔍 Gemini Vision đang đọc ảnh<span className="loading-dots" />
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Đang phân tích {ocrProgress.total} ảnh bằng AI
          </p>

          <div className="ocr-progress-wrapper">
            <div className="progress-bar" style={{ height: '8px', marginBottom: '0.5rem' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${ocrProgress.percent}%` }}
              />
            </div>
            <span className="ocr-progress-text">{ocrProgress.percent}%</span>
          </div>

          <div className="ocr-loading-images">
            {ocrImages.map((img, i) => (
              <div
                key={i}
                className={`ocr-loading-thumb ${i < ocrProgress.current ? 'done' : 'active'}`}
              >
                <img src={img.preview} alt={`OCR ${i + 1}`} />
                <div className="ocr-loading-overlay">
                  {i < ocrProgress.current ? (
                    <span style={{ fontSize: '1.25rem' }}>✅</span>
                  ) : (
                    <div className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">
            🤖 AI đang phân tích và tạo bài tập<span className="loading-dots" />
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            AI sẽ tự động chọn loại bài tập phù hợp với nội dung
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{editingExercise ? '✏️ Chỉnh sửa bài tập' : '📚 Tạo bài tập bằng AI'}</h1>
          <p className="page-desc">
            {editingExercise
              ? `Đang chỉnh sửa: ${editingExercise.title}`
              : 'Nhập nội dung hoặc upload ảnh để AI tự động tạo bài tập phù hợp.'}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleSwitchToStudent}
        >
          🎓 Chuyển sang Student (Test bài)
        </button>
      </div>

      {!apiKey && (
        <div className="api-key-banner">
          <span className="banner-text">
            ⚠️ Bạn cần nhập Gemini API Key để sử dụng tính năng tạo bài tập AI
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
              <button
                className={`tab-btn ${activeTab === 'ocr' ? 'active' : ''}`}
                onClick={() => setActiveTab('ocr')}
              >
                📷 Ảnh (OCR)
              </button>
            </div>

            {activeTab === 'paste' ? (
              <textarea
                className="form-textarea"
                style={{ minHeight: '300px' }}
                placeholder={"Dán nội dung bài giảng vào đây...\n\nVí dụ:\n1. every day / get up / at half past seven\n2. once a week / watch a film / at the cinema\n3. often / eat fast food / for lunch"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : activeTab === 'upload' ? (
              <div className="upload-area">
                <div className="upload-icon">📤</div>
                <p className="upload-text">Kéo thả hoặc click để upload</p>
                <p className="upload-hint">Hỗ trợ: .txt, .md (text files) — Nội dung sẽ được nối vào</p>
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              /* OCR Tab */
              <div className="ocr-section">
                {ocrResult && (
                  <div className="ocr-accumulated-banner">
                    <span>📋 Đã có {ocrResult.length} ký tự từ OCR trước đó</span>
                    <span className="ocr-accumulated-hint">Upload thêm ảnh → text sẽ được nối tiếp</span>
                  </div>
                )}

                {/* Upload area - click opens file dialog directly */}
                <div
                  className="upload-area ocr-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">📷</div>
                  <p className="upload-text">
                    {ocrResult ? 'Tải thêm ảnh để nối nội dung' : 'Tải ảnh lên để trích xuất văn bản'}
                  </p>
                  <p className="upload-hint">
                    Hỗ trợ: PNG, JPG, WEBP, GIF — Tối đa 10MB/ảnh — Có thể chọn nhiều ảnh
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  multiple
                  onChange={handleOcrImageUpload}
                  style={{ display: 'none' }}
                />

                {/* Image preview grid */}
                {ocrImages.length > 0 && (
                  <div className="ocr-preview-section">
                    <div className="ocr-preview-header">
                      <span className="ocr-preview-count">
                        📸 {ocrImages.length} ảnh mới chờ xử lý
                      </span>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        + Thêm ảnh
                      </button>
                    </div>

                    <div className="ocr-preview-grid">
                      {ocrImages.map((img, i) => (
                        <div key={i} className="ocr-preview-item">
                          <img src={img.preview} alt={img.name} />
                          <button
                            className="ocr-preview-remove"
                            onClick={() => removeOcrImage(i)}
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                          <div className="ocr-preview-name">{img.name}</div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={handleOcrExtract}
                      disabled={!apiKey}
                    >
                      🔍 Trích xuất văn bản (Gemini Vision)
                    </button>
                    {!apiKey && (
                      <p style={{ textAlign: 'center', color: 'var(--accent-amber)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Cần nhập API Key để sử dụng Gemini Vision OCR
                      </p>
                    )}
                  </div>
                )}

                {/* OCR Result */}
                {ocrResult && (
                  <div className="ocr-result-section slide-in">
                    <div className="ocr-result-header">
                      <h4>✅ Nội dung đã trích xuất</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => { setOcrResult(''); setContent(''); }}
                          title="Xóa hết nội dung OCR"
                        >
                          🗑️ Xóa hết
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={handleUseOcrText}
                        >
                          ✏️ Chỉnh sửa
                        </button>
                      </div>
                    </div>
                    <div className="ocr-result-content">
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: '200px' }}
                        value={ocrResult}
                        onChange={(e) => {
                          setOcrResult(e.target.value);
                          setContent(e.target.value);
                        }}
                      />
                    </div>
                    <p className="ocr-result-hint">
                      💡 Upload thêm ảnh ở trên → nội dung sẽ tự động nối vào cuối
                    </p>
                  </div>
                )}
              </div>
            )}

            {content && (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                📏 Tổng cộng {content.length} ký tự
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
                placeholder="VD: Unit 5 - Present Simple"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lớp học</label>
              <input
                className="form-input"
                placeholder="VD: Lớp 6, Lớp 10A1..."
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
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

            {/* AI info */}
            <div className="ai-generate-info">
              <p className="ai-generate-info-title">🤖 AI sẽ tự động:</p>
              <ul>
                <li>Phân tích nội dung bài giảng</li>
                <li>Chọn loại bài tập phù hợp</li>
                <li>Tạo bao nhiêu câu tùy nội dung</li>
              </ul>
              <p className="ai-generate-info-types">
                Viết câu • Điền từ • Viết lại • Trắc nghiệm • Nối • Sắp xếp • Dịch...
              </p>
            </div>

            {/* Flow indicator */}
            <div className="ocr-flow-indicator">
              <div className={`flow-step ${content ? 'completed' : 'active'}`}>
                <div className="flow-step-number">1</div>
                <div className="flow-step-text">
                  <span className="flow-step-title">Nội dung</span>
                  <span className="flow-step-desc">
                    {content ? `✅ ${content.length} ký tự` : 'Nhập / Upload / OCR'}
                  </span>
                </div>
              </div>
              <div className="flow-connector" />
              <div className={`flow-step ${content && title ? 'completed' : content ? 'active' : ''}`}>
                <div className="flow-step-number">2</div>
                <div className="flow-step-text">
                  <span className="flow-step-title">Cấu hình</span>
                  <span className="flow-step-desc">
                    {title ? `✅ ${title}` : 'Tiêu đề & cài đặt'}
                  </span>
                </div>
              </div>
              <div className="flow-connector" />
              <div className={`flow-step ${generatedQuestions ? 'completed' : ''}`}>
                <div className="flow-step-number">3</div>
                <div className="flow-step-text">
                  <span className="flow-step-title">Tạo AI</span>
                  <span className="flow-step-desc">Tự động sinh bài tập</span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={handleGenerate}
              disabled={!content.trim() || !title.trim() || !apiKey}
            >
              🤖 {editingExercise ? 'Tạo lại bài tập' : 'Tạo bài tập bằng AI'}
            </button>

            {!apiKey && (
              <p style={{ textAlign: 'center', color: 'var(--accent-amber)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
                Nhập API Key ở nút "🤖 Nhập API Key" trên header
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Generated exercises preview */
        <div className="slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2>✅ Đã tạo {generatedQuestions.length} bài tập</h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setGeneratedQuestions(null)}>
                ← Quay lại
              </button>
              <button className="btn btn-success btn-lg" onClick={handleSaveExercise}>
                💾 {editingExercise ? 'Cập nhật' : 'Lưu vào thư viện'}
              </button>
            </div>
          </div>

          <div className="generated-questions">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="generated-question-item">
                <div className="q-number">
                  Câu {i + 1} — {TYPE_LABELS[q.type] || '📝 ' + q.type}
                </div>
                {q.instruction && (
                  <p className="q-instruction">{q.instruction}</p>
                )}
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

                {q.type === 'matching' && q.columnA && (
                  <div className="q-matching">
                    <div className="q-matching-col">
                      <strong>Cột A:</strong>
                      {q.columnA.map((item, j) => <div key={j}>{j + 1}. {item}</div>)}
                    </div>
                    <div className="q-matching-col">
                      <strong>Cột B:</strong>
                      {q.columnB.map((item, j) => <div key={j}>{String.fromCharCode(97 + j)}. {item}</div>)}
                    </div>
                  </div>
                )}

                {q.sampleAnswer && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <p><strong style={{ color: 'var(--accent-emerald)' }}>Đáp án mẫu:</strong> {q.sampleAnswer}</p>
                  </div>
                )}

                {q.hints && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem', fontStyle: 'italic' }}>
                    💡 {q.hints}
                  </div>
                )}

                {q.explanation && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem', fontStyle: 'italic' }}>
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
