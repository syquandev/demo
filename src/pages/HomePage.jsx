import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const handlePickRole = (role) => {
    setRole(role);
    navigate(role === 'student' ? '/student' : '/teacher');
  };

  return (
    <div className="fade-in">
      <section className="hero-section">
        <h1 className="hero-title">
          Nền tảng học tập với <span className="gradient-text">AI thông minh</span>
        </h1>
        <p className="hero-subtitle">
          Giáo viên upload bài giảng — AI tự tạo câu hỏi. Học viên làm bài — AI chấm điểm tức thì.
          Powered by Google Gemini.
        </p>

        <div className="role-cards">
          {/* Student card */}
          <div className="role-card student" onClick={() => handlePickRole('student')}>
            <span className="role-icon">👨‍🎓</span>
            <h2 className="role-title">Học viên</h2>
            <p className="role-desc">Làm bài tập và nhận phản hồi AI ngay lập tức</p>
            <ul className="role-features">
              <li>
                <span className="check-icon">✓</span> Làm bài trắc nghiệm & tự luận
              </li>
              <li>
                <span className="check-icon">✓</span> AI chấm điểm chi tiết
              </li>
              <li>
                <span className="check-icon">✓</span> Nhận xét & gợi ý cải thiện
              </li>
              <li>
                <span className="check-icon">✓</span> Theo dõi tiến trình học tập
              </li>
            </ul>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.5rem' }}>
              Bắt đầu học →
            </button>
          </div>

          {/* Teacher card */}
          <div className="role-card teacher" onClick={() => handlePickRole('teacher')}>
            <span className="role-icon">👩‍🏫</span>
            <h2 className="role-title">Giáo viên</h2>
            <p className="role-desc">Tạo bài tập tự động từ nội dung giảng dạy</p>
            <ul className="role-features">
              <li>
                <span className="check-icon">✓</span> Upload nội dung bài giảng
              </li>
              <li>
                <span className="check-icon">✓</span> AI tự tạo câu hỏi trắc nghiệm
              </li>
              <li>
                <span className="check-icon">✓</span> AI tạo câu hỏi tự luận
              </li>
              <li>
                <span className="check-icon">✓</span> Quản lý thư viện bài tập
              </li>
            </ul>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.5rem' }}>
              Bắt đầu tạo bài →
            </button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          ✨ Tính năng nổi bật
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
          <FeatureCard
            icon="🧠"
            title="AI Gemini miễn phí"
            desc="Sử dụng Google Gemini API hoàn toàn miễn phí để tạo câu hỏi và chấm điểm."
          />
          <FeatureCard
            icon="⚡"
            title="Tức thì & chính xác"
            desc="Kết quả chấm điểm trong vài giây với nhận xét chi tiết từ AI."
          />
          <FeatureCard
            icon="📊"
            title="Phân tích chi tiết"
            desc="AI phân tích điểm mạnh, điểm yếu và đưa gợi ý cải thiện cụ thể."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-card interactive" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{desc}</p>
    </div>
  );
}
