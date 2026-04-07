import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { gradeExercise } from '../services/gemini';

// Exercise type labels
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

export default function ExercisePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { exercises, saveResult, completedExercises, apiKey, showToast } = useApp();

  const exercise = exercises.find((e) => e.id === exerciseId);
  const previousResult = completedExercises[exerciseId];

  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(previousResult || null);

  if (!exercise) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3 className="empty-title">Không tìm thấy bài tập</h3>
          <button className="btn btn-primary" onClick={() => navigate('/student')}>
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const questions = exercise.questions;
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQ) * 100;

  const handleSelectOption = (qIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleTextChange = (qIndex, text) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: text }));
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQ) {
      const confirmed = confirm(`Bạn còn ${totalQ - answeredCount} câu chưa trả lời. Vẫn nộp bài?`);
      if (!confirmed) return;
    }

    setSubmitted(true);

    if (apiKey) {
      setGrading(true);
      try {
        const aiResult = await gradeExercise(questions, answers);
        setResult(aiResult);
        saveResult(exerciseId, aiResult);
        showToast('AI đã chấm điểm xong!', 'success');
      } catch (err) {
        console.error(err);
        const fallback = gradeLocally(questions, answers);
        setResult(fallback);
        saveResult(exerciseId, fallback);
        showToast('Lỗi AI chấm điểm, đã chấm phần trắc nghiệm.', 'error');
      }
      setGrading(false);
    } else {
      const localResult = gradeLocally(questions, answers);
      localResult.overallComment += '\n\n⚠️ Nhập API Key Gemini để AI chấm điểm chi tiết hơn.';
      setResult(localResult);
      saveResult(exerciseId, localResult);
      showToast('Đã chấm điểm xong!', 'success');
    }
  };

  if (grading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">
            🤖 AI đang chấm điểm bài làm của bạn<span className="loading-dots" />
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Quá trình này mất khoảng 5-10 giây
          </p>
        </div>
      </div>
    );
  }

  if (result && submitted) {
    return <ResultView exercise={exercise} questions={questions} answers={answers} result={result} navigate={navigate} />;
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/student')} style={{ marginBottom: '0.5rem' }}>
          ← Quay lại
        </button>
        <h1>{exercise.title}</h1>
        <p className="page-desc">{exercise.description}</p>
      </div>

      <div className="exercise-layout">
        {/* Questions */}
        <div>
          {questions.map((q, i) => (
            <div key={i} className={`question-card ${currentQ === i ? 'active' : ''}`} onClick={() => setCurrentQ(i)}>
              <div className="question-number">
                Câu {i + 1} / {totalQ} — {TYPE_LABELS[q.type] || q.type}
              </div>

              {/* Instruction */}
              {q.instruction && (
                <p className="question-instruction">{q.instruction}</p>
              )}

              {/* Question text */}
              <p className="question-text">{q.question}</p>

              {/* Hints */}
              {q.hints && (
                <p className="question-hint">💡 Gợi ý: {q.hints}</p>
              )}

              {/* Multiple choice */}
              {q.type === 'multiple_choice' ? (
                <div className="question-options">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j); // A, B, C, D...
                    const isSelected = answers[i] === j;
                    return (
                      <button
                        key={j}
                        className={`option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOption(i, j);
                        }}
                      >
                        <span className="option-letter">{letter}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : q.type === 'matching' ? (
                /* Matching exercise */
                <div className="matching-exercise" onClick={(e) => e.stopPropagation()}>
                  <div className="matching-columns">
                    <div className="matching-col">
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Cột A</strong>
                      {q.columnA?.map((item, j) => (
                        <div key={j} className="matching-item">{j + 1}. {item}</div>
                      ))}
                    </div>
                    <div className="matching-col">
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Cột B</strong>
                      {q.columnB?.map((item, j) => (
                        <div key={j} className="matching-item">{String.fromCharCode(97 + j)}. {item}</div>
                      ))}
                    </div>
                  </div>
                  <textarea
                    className="answer-textarea"
                    placeholder="Nhập đáp án nối, ví dụ: 1-c, 2-a, 3-b"
                    value={answers[i] || ''}
                    onChange={(e) => handleTextChange(i, e.target.value)}
                    style={{ minHeight: '60px', marginTop: '0.75rem' }}
                  />
                </div>
              ) : (
                /* All other text-input types */
                <textarea
                  className="answer-textarea"
                  placeholder={getPlaceholder(q.type)}
                  value={answers[i] || ''}
                  onChange={(e) => handleTextChange(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              style={{ flex: 1 }}
            >
              📤 Nộp bài
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar-panel">
          <div className="sidebar-title">📊 Tiến trình</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            {answeredCount} / {totalQ} câu đã trả lời
          </div>

          <div className="question-dots">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`question-dot ${answers[i] !== undefined ? 'answered' : ''} ${currentQ === i ? 'current' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            style={{ width: '100%' }}
          >
            📤 Nộp bài
          </button>
        </aside>
      </div>
    </div>
  );
}

/* ========== Helper: Placeholder text by type ========== */
function getPlaceholder(type) {
  switch (type) {
    case 'write_sentence': return 'Viết câu hoàn chỉnh ở đây...';
    case 'fill_blank': return 'Điền từ/cụm từ vào chỗ trống...';
    case 'rewrite': return 'Viết lại câu ở đây...';
    case 'ordering': return 'Sắp xếp thành câu hoàn chỉnh...';
    case 'short_answer': return 'Viết câu trả lời ngắn ở đây...';
    case 'translation': return 'Viết bản dịch ở đây...';
    default: return 'Viết câu trả lời của bạn ở đây...';
  }
}

/* ========== Local grading (MCQ only, others need AI) ========== */
function gradeLocally(questions, answers) {
  let correct = 0;
  let mcCount = 0;
  const feedback = [];

  questions.forEach((q, i) => {
    if (q.type === 'multiple_choice') {
      mcCount++;
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) correct++;
      feedback.push({
        questionIndex: i,
        score: isCorrect ? 1 : 0,
        maxScore: 1,
        feedback: isCorrect
          ? 'Chính xác! ' + (q.explanation || '')
          : `Sai. Đáp án đúng: ${q.options[q.correctIndex]}. ${q.explanation || ''}`,
      });
    } else {
      feedback.push({
        questionIndex: i,
        score: 0,
        maxScore: 1,
        feedback: 'Cần AI chấm điểm cho loại bài này. Vui lòng nhập API Key.',
        correctedAnswer: q.sampleAnswer || '',
      });
    }
  });

  const totalScore = mcCount > 0
    ? Math.round((correct / questions.length) * 10 * 10) / 10
    : 0;

  return {
    totalScore,
    maxScore: 10,
    overallComment: mcCount > 0
      ? `Bạn trả lời đúng ${correct}/${mcCount} câu trắc nghiệm.`
      : 'Bài tập này cần AI chấm điểm.',
    strengths: correct > mcCount / 2 ? ['Nắm tốt kiến thức cơ bản'] : [],
    weaknesses: correct <= mcCount / 2 && mcCount > 0 ? ['Cần ôn lại kiến thức'] : [],
    suggestions: ['Nhập API Key để AI chấm chi tiết tất cả các loại bài'],
    questionFeedback: feedback,
  };
}

/* ========== Result View ========== */
function ResultView({ exercise, questions, answers, result, navigate }) {
  const scorePercent = (result.totalScore / result.maxScore) * 100;
  const scoreClass = scorePercent >= 80 ? 'excellent' : scorePercent >= 60 ? 'good' : scorePercent >= 40 ? 'average' : 'poor';
  const scoreEmoji = scorePercent >= 80 ? '🎉' : scorePercent >= 60 ? '👍' : scorePercent >= 40 ? '📖' : '💪';

  return (
    <div className="main-content fade-in">
      <div className="results-container">
        <button className="btn btn-ghost" onClick={() => navigate('/student')} style={{ marginBottom: '1rem' }}>
          ← Quay lại danh sách
        </button>

        {/* Score hero */}
        <div className="score-hero">
          <div className={`score-circle ${scoreClass}`}>
            <span className="score-value">{result.totalScore}</span>
            <span className="score-label">/ {result.maxScore}</span>
          </div>
          <h2 className="score-title">
            {scoreEmoji} {scorePercent >= 80 ? 'Xuất sắc!' : scorePercent >= 60 ? 'Khá tốt!' : scorePercent >= 40 ? 'Cần cố gắng thêm' : 'Hãy ôn lại bài nhé'}
          </h2>
          <p className="score-subtitle">{exercise.title}</p>
        </div>

        {/* AI Feedback */}
        <div className="ai-feedback">
          <div className="ai-feedback-header">
            <div className="ai-icon">🤖</div>
            <span>Nhận xét từ AI</span>
          </div>
          <div className="ai-feedback-body">
            <div className="markdown-content">
              <ReactMarkdown>{result.overallComment}</ReactMarkdown>
            </div>

            {result.strengths?.length > 0 && (
              <>
                <p style={{ marginTop: '1rem' }}><strong>💪 Điểm mạnh:</strong></p>
                <ul>
                  {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            )}

            {result.weaknesses?.length > 0 && (
              <>
                <p><strong>⚠️ Cần cải thiện:</strong></p>
                <ul>
                  {result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </>
            )}

            {result.suggestions?.length > 0 && (
              <>
                <p><strong>💡 Gợi ý:</strong></p>
                <ul>
                  {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Question-by-question review */}
        <h3 style={{ marginBottom: '1rem' }}>📋 Chi tiết từng câu</h3>
        {questions.map((q, i) => {
          const fb = result.questionFeedback?.find((f) => f.questionIndex === i);
          return (
            <div key={i} className="question-card" style={{ marginBottom: '1rem' }}>
              <div className="question-number" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Câu {i + 1} — {TYPE_LABELS[q.type] || q.type}</span>
                {fb && (
                  <span className={`badge ${fb.score >= fb.maxScore ? 'badge-emerald' : fb.score > 0 ? 'badge-amber' : 'badge-rose'}`}>
                    {fb.score}/{fb.maxScore} điểm
                  </span>
                )}
              </div>

              {q.instruction && (
                <p className="question-instruction">{q.instruction}</p>
              )}

              <p className="question-text">{q.question}</p>

              {/* MCQ review */}
              {q.type === 'multiple_choice' && (
                <div className="question-options">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j); // A, B, C, D...
                    const isSelected = answers[i] === j;
                    const isCorrect = j === q.correctIndex;
                    let cls = '';
                    if (isCorrect) cls = 'correct';
                    else if (isSelected && !isCorrect) cls = 'incorrect';

                    return (
                      <div key={j} className={`option-btn ${cls}`} style={{ cursor: 'default' }}>
                        <span className="option-letter">{letter}</span>
                        <span>{opt}</span>
                        {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✓ Đáp án đúng</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text-based answer review */}
              {q.type !== 'multiple_choice' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Bài làm của bạn:</p>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    {answers[i] || <em style={{ color: 'var(--text-muted)' }}>Không trả lời</em>}
                  </div>

                  {/* Show correct answer */}
                  {(fb?.correctedAnswer || q.sampleAnswer) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p style={{ color: 'var(--accent-emerald)', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>✅ Đáp án mẫu:</p>
                      <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.9375rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        {fb?.correctedAnswer || q.sampleAnswer}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fb && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  💬 {fb.feedback}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/student')}>
            ← Quay lại danh sách bài tập
          </button>
        </div>
      </div>
    </div>
  );
}
