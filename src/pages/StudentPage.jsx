import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function StudentPage() {
  const { exercises, completedExercises, apiKey } = useApp();
  const navigate = useNavigate();

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>📝 Danh sách bài tập</h1>
        <p className="page-desc">Chọn bài tập để bắt đầu làm. AI sẽ chấm điểm sau khi bạn nộp bài.</p>
      </div>

      {!apiKey && (
        <div className="api-key-banner">
          <span className="banner-text">
            ⚠️ Hãy nhập Gemini API Key để AI có thể chấm điểm bài tự luận
          </span>
        </div>
      )}

      <div className="content-grid">
        {exercises.map((ex) => {
          const completed = completedExercises[ex.id];
          return (
            <div
              key={ex.id}
              className="exercise-card"
              onClick={() => navigate(`/student/exercise/${ex.id}`)}
            >
              <div className="card-header">
                <h3 className="card-title">{ex.title}</h3>
                {completed ? (
                  <span className="badge badge-emerald">✓ Đã làm</span>
                ) : (
                  <span className="badge badge-blue">Mới</span>
                )}
              </div>
              <p className="card-desc">{ex.description}</p>
              <div className="card-meta">
                <span>📚 {ex.subject}</span>
                <span>📋 {ex.questionCount} câu</span>
                <span className={`badge ${ex.difficulty === 'Dễ' ? 'badge-emerald' : ex.difficulty === 'Trung bình' ? 'badge-amber' : 'badge-rose'}`}>
                  {ex.difficulty}
                </span>
              </div>
              {completed && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(completed.totalScore / completed.maxScore) * 100}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {completed.totalScore}/{completed.maxScore}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {exercises.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">Chưa có bài tập</h3>
          <p className="empty-desc">Giáo viên chưa tạo bài tập nào. Hãy quay lại sau nhé!</p>
        </div>
      )}
    </div>
  );
}
