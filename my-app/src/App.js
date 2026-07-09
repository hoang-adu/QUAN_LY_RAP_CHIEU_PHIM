import { useState } from 'react';
import './App.css';

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={5 + col * 7}
            cy={5 + row * 7}
            r="1.6"
            fill="#5f6368"
          />
        )),
      )}
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <rect
        x="2"
        y="6"
        width="20"
        height="13"
        rx="2"
        fill="none"
        stroke="#4285F4"
        strokeWidth="1.6"
      />
      <rect x="5" y="9" width="2" height="2" fill="#4285F4" />
      <rect x="9" y="9" width="2" height="2" fill="#EA4335" />
      <rect x="13" y="9" width="2" height="2" fill="#FBBC05" />
      <rect x="17" y="9" width="2" height="2" fill="#34A853" />
      <rect x="5" y="13" width="2" height="2" fill="#34A853" />
      <rect x="9" y="13" width="8" height="2" fill="#4285F4" />
      <rect x="17" y="13" width="2" height="2" fill="#EA4335" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"
        fill="#4285F4"
      />
      <path
        d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.08A7 7 0 0 0 19 11z"
        fill="#4285F4"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M9 3 7.5 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9z"
        fill="none"
        stroke="#4285F4"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="13" r="4" fill="none" stroke="#EA4335" strokeWidth="1.6" />
    </svg>
  );
}

function AiSparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"
        fill="url(#ai-gradient)"
      />
      <defs>
        <linearGradient id="ai-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9b72cb" />
          <stop offset="100%" stopColor="#d96570" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function App() {
  const [query, setQuery] = useState('');

  const search = (event, useLucky) => {
    event.preventDefault();
    const q = encodeURIComponent(query.trim());
    if (!q) return;
    const url = useLucky
      ? `https://www.google.com/search?q=${q}&btnI=1`
      : `https://www.google.com/search?q=${q}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="google-home">
      <header className="google-topbar">
        <div className="google-topbar-links">
          <a href="https://mail.google.com" target="_blank" rel="noreferrer">
            Gmail
          </a>
          <a
            href="https://images.google.com"
            target="_blank"
            rel="noreferrer"
          >
            Hình ảnh
          </a>
        </div>
        <button className="icon-btn" aria-label="Ứng dụng Google">
          <GridIcon />
        </button>
        <button className="signin-btn">Đăng nhập</button>
      </header>

      <main className="google-main">
        <h1 className="google-logo" aria-label="Google">
          <span style={{ color: '#4285F4' }}>G</span>
          <span style={{ color: '#EA4335' }}>o</span>
          <span style={{ color: '#FBBC05' }}>o</span>
          <span style={{ color: '#4285F4' }}>g</span>
          <span style={{ color: '#34A853' }}>l</span>
          <span style={{ color: '#EA4335' }}>e</span>
        </h1>

        <form className="search-box" onSubmit={(e) => search(e, false)}>
          <span className="search-icon-left">+</span>
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            autoComplete="off"
            aria-label="Tìm kiếm"
          />
          <div className="search-icons-right">
            <span className="icon-btn small" title="Tìm kiếm bằng giọng nói">
              <KeyboardIcon />
            </span>
            <span className="icon-btn small" title="Tìm kiếm bằng giọng nói">
              <MicIcon />
            </span>
            <span className="icon-btn small" title="Tìm kiếm bằng hình ảnh">
              <CameraIcon />
            </span>
            <button type="button" className="ai-mode-btn">
              <AiSparkleIcon />
              Chế độ AI
            </button>
          </div>
        </form>

        <div className="search-buttons">
          <button onClick={(e) => search(e, false)}>Tìm trên Google</button>
          <button onClick={(e) => search(e, true)}>
            Xem trang đầu tiên tìm được
          </button>
        </div>
      </main>

      <footer className="google-footer">
        <p className="google-lang">
          Google hỗ trợ các ngôn ngữ:{' '}
          <a href="#english">English</a> <a href="#french">Français</a>{' '}
          <a href="#zh-hant">繁體中文</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
