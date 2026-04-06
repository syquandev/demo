import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function LibraryPage() {
  const { exercises } = useApp();
  const navigate = useNavigate();

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>🗂️ Thư viện bài tập</h1>
        <p className="page-desc">
          Tất cả bài tập đã tạo. Học viên có thể truy cập và làm bài.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('/teacher')}>
          + Tạo bài tập mới
        </button>
      </div>

      {exercises.length > 0 ? (
        <div className="content-grid">
          {exercises.map((ex) => (
            <div key={ex.id} className="exercise-card" style={{ cursor: 'default' }}>
              <div className="card-header">
                <h3 className="card-title">{ex.title}</h3>
                <span className={`badge ${ex.difficulty === 'Dễ' ? 'badge-emerald' : ex.difficulty === 'Trung bình' ? 'badge-amber' : 'badge-rose'}`}>
                  {ex.difficulty}
                </span>
              </div>
              <p className="card-desc">{ex.description}</p>
              <div className="card-meta">
                <span>📚 {ex.subject}</span>
                <span>📋 {ex.questionCount} câu</span>
                <span>
                  {ex.questions?.filter((q) => q.type === 'multiple_choice').length || 0} TN +{' '}
                  {ex.questions?.filter((q) => q.type === 'essay').length || 0} TL
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">Chưa có bài tập nào</h3>
          <p className="empty-desc">Hãy tạo bài tập đầu tiên bằng cách upload nội dung bài giảng.</p>
          <button className="btn btn-primary" onClick={() => navigate('/teacher')}>
            📚 Tạo bài tập
          </button>
        </div>
      )}
    </div>
  );
}
