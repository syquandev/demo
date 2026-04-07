import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// Exercise type labels
const TYPE_LABELS = {
  write_sentence: '✏️ Viết câu',
  fill_blank: '📝 Điền từ',
  rewrite: '🔄 Viết lại',
  multiple_choice: '🔘 Trắc nghiệm',
  matching: '🔗 Nối',
  ordering: '🔢 Sắp xếp',
  short_answer: '💬 Trả lời ngắn',
  translation: '🌐 Dịch',
};

export default function LibraryPage() {
  const { exercises, deleteExercise, showToast } = useApp();
  const navigate = useNavigate();

  const handleEdit = (exercise) => {
    navigate('/teacher', { state: { editExercise: exercise } });
  };

  const handleDelete = (exerciseId, title) => {
    if (confirm(`Bạn có chắc muốn xóa bài tập "${title}"?`)) {
      deleteExercise(exerciseId);
      showToast('Đã xóa bài tập!', 'success');
    }
  };

  // Count exercise types
  const getTypeSummary = (questions) => {
    if (!questions) return '';
    const counts = {};
    questions.forEach((q) => {
      const label = TYPE_LABELS[q.type] || q.type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => `${count} ${label}`)
      .join(' • ');
  };

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>🗂️ Thư viện bài tập</h1>
        <p className="page-desc">
          Quản lý bài tập đã tạo. Chọn bài để chỉnh sửa hoặc xóa.
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
            <div key={ex.id} className="exercise-card library-card">
              <div className="card-header">
                <h3 className="card-title">{ex.title}</h3>
                <span className={`badge ${ex.difficulty === 'Dễ' ? 'badge-emerald' : ex.difficulty === 'Trung bình' ? 'badge-amber' : 'badge-rose'}`}>
                  {ex.difficulty}
                </span>
              </div>
              <p className="card-desc">{ex.description}</p>
              <div className="card-meta">
                <span>🏫 {ex.grade || ex.subject || 'Chung'}</span>
                <span>📋 {ex.questionCount} câu</span>
              </div>

              {/* Type breakdown */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {getTypeSummary(ex.questions)}
              </p>

              {/* Action buttons */}
              <div className="library-card-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(ex)}
                >
                  ✏️ Chỉnh sửa
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(ex.id, ex.title)}
                >
                  🗑️ Xóa
                </button>
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
