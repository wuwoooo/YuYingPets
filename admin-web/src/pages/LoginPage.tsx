import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import presentationLogo from '../assets/presentation-logo.svg';
import { adminApi } from '../lib/api';

type LoginPageProps = {
  onLoggedIn: (token: string) => void;
};

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('superadmin_demo');
  const [password, setPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await adminApi.login(username, password);
      onLoggedIn(response.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      <section className="login-left">
        <span className="deco-star">✦</span>
        <span className="deco-star">✧</span>
        <span className="deco-star">✦</span>
        <div className="deco-shape" />
        <div className="deco-shape" />
        <div className="deco-shape" />
        <div className="login-brand">
          <div className="login-logo">
            <img src={presentationLogo} alt="育英星宠 Logo" />
          </div>
          <h1>育英星宠</h1>
          <p>校园荣誉体系下的萌宠成长激励平台</p>
          <div className="deco-line" />
        </div>
      </section>
      <section className="login-right">
        <div className="login-card">
          <h2>管理后台登录</h2>
          <p className="sub">大理海东育英实验学校</p>
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <span className="icon">◉</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
            </div>
            <div className="login-field">
              <span className="icon">◌</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                type="password"
              />
            </div>
            <button className="login-btn" type="submit" disabled={submitting}>
              {submitting ? '登录中...' : '登 录'}
            </button>
          </form>
          {error ? <div className="status-card error">{error}</div> : null}
          <div className="login-footer">
            <a href="/">忘记密码?</a>
            <span>© 2026 育英星宠</span>
          </div>
        </div>
      </section>
    </div>
  );
}

