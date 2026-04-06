import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { gradeExercise } from '../services/gemini';

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

  const handleEssayChange = (qIndex, text) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: text }));
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQ) {
      const confirmed = confirm(`Bạn còn ${totalQ - answeredCount} câu chưa trả lời. Vẫn nộp bài?`);
      if (!confirmed) return;
    }

    setSubmitted(true);

    // Check if there are essay questions and API key is available
    const hasEssay = questions.some((q) => q.type === 'essay');

    if (hasEssay && apiKey) {
      setGrading(true);
      try {
        const aiResult = await gradeExercise(questions, answers);
        setResult(aiResult);
        saveResult(exerciseId, aiResult);
        showToast('AI đã chấm điểm xong!', 'success');
      } catch (err) {
        console.error(err);
        // Fallback: grade multiple choice only
        const fallback = gradeLocally(questions, answers);
        setResult(fallback);
        saveResult(exerciseId, fallback);
        showToast('Lỗi AI, đã chấm trắc nghiệm tự động.', 'error');
      }
      setGrading(false);
    } else {
      // Grade multiple choice locally
      const localResult = gradeLocally(questions, answers);

      if (hasEssay && !apiKey) {
        localResult.overallComment += '\n\n⚠️ Câu hỏi tự luận chưa được chấm vì chưa nhập API Key Gemini.';
      }

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
              <div className="question-number">Câu {i + 1} / {totalQ}</div>
              <p className="question-text">{q.question}</p>

              {q.type === 'multiple_choice' ? (
                <div className="question-options">
                  {q.options.map((opt, j) => {
                    const letters = ['A', 'B', 'C', 'D'];
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
                        <span className="option-letter">{letters[j]}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  className="answer-textarea"
                  placeholder="Viết câu trả lời của bạn ở đây..."
                  value={answers[i] || ''}
                  onChange={(e) => handleEssayChange(i, e.target.value)}
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

/* ========== Local grading (multiple choice only) ========== */
function gradeLocally(questions, answers) {
  let correct = 0;
  const feedback = [];

  questions.forEach((q, i) => {
    if (q.type === 'multiple_choice') {
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) correct++;
      feedback.push({
        questionIndex: i,
        score: isCorrect ? 1 : 0,
        maxScore: 1,
        feedback: isCorrect ? 'Chính xác! ' + (q.explanation || '') : `Sai. Đáp án đúng: ${q.options[q.correctIndex]}. ${q.explanation || ''}`,
      });
    } else {
      feedback.push({
        questionIndex: i,
        score: 0,
        maxScore: 1,
        feedback: 'Câu tự luận cần AI chấm điểm.',
      });
    }
  });

  const mcCount = questions.filter((q) => q.type === 'multiple_choice').length;
  const totalScore = Math.round((correct / questions.length) * 10 * 10) / 10;

  return {
    totalScore,
    maxScore: 10,
    overallComment: `Bạn trả lời đúng ${correct}/${mcCount} câu trắc nghiệm.`,
    strengths: correct > mcCount / 2 ? ['Nắm tốt kiến thức cơ bản'] : [],
    weaknesses: correct <= mcCount / 2 ? ['Cần ôn lại kiến thức'] : [],
    suggestions: ['Đọc kỹ lý thuyết trước khi làm bài', 'Chú ý các chi tiết quan trọng'],
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
                <span>Câu {i + 1}</span>
                {fb && (
                  <span className={`badge ${fb.score >= fb.maxScore ? 'badge-emerald' : 'badge-rose'}`}>
                    {fb.score}/{fb.maxScore} điểm
                  </span>
                )}
              </div>
              <p className="question-text">{q.question}</p>

              {q.type === 'multiple_choice' && (
                <div className="question-options">
                  {q.options.map((opt, j) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = answers[i] === j;
                    const isCorrect = j === q.correctIndex;
                    let cls = '';
                    if (isCorrect) cls = 'correct';
                    else if (isSelected && !isCorrect) cls = 'incorrect';

                    return (
                      <div key={j} className={`option-btn ${cls}`} style={{ cursor: 'default' }}>
                        <span className="option-letter">{letters[j]}</span>
                        <span>{opt}</span>
                        {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✓ Đáp án đúng</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'essay' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Bài làm của bạn:</p>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    {answers[i] || <em style={{ color: 'var(--text-muted)' }}>Không trả lời</em>}
                  </div>
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
