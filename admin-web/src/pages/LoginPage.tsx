import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import presentationLogo from "../assets/presentation-logo.svg";
import { adminApi } from "../lib/api";
import {
  getAdminLoginCredentials,
  setAdminLoginCredentials,
  setAdminToken,
} from "../lib/session";

type LoginPageProps = {
  onLoggedIn: (token: string) => void;
};

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const navigate = useNavigate();
  const storedCredentials = getAdminLoginCredentials();
  const [username, setUsername] = useState(
    storedCredentials?.username ?? "admin",
  );
  const [password, setPassword] = useState(
    storedCredentials?.password ?? "123456",
  );
  const [submitting, setSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setIsExiting(true);
    setError(null);

    try {
      const response = await adminApi.login(username, password);
      setAdminLoginCredentials(username, password);
      setAdminToken(response.data.token);
      onLoggedIn(response.data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setIsExiting(false);
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`admin-login${isExiting ? " is-exiting" : ""}`}>
      <section className="login-left">
        <div className="login-stars login-stars-far" />
        <div className="login-stars login-stars-mid" />
        <div className="login-nebula login-nebula-a" />
        <div className="login-nebula login-nebula-b" />
        <div className="login-scanline" />
        <div className="login-hud login-hud-a" />
        <div className="login-hud login-hud-b" />
        <div className="login-hud-corner login-hud-corner-a" />
        <div className="login-hud-corner login-hud-corner-b" />
        <div className="login-aurora login-aurora-a" />
        <div className="login-aurora login-aurora-b" />
        <div className="login-grid" />
        <span className="deco-orbit deco-orbit-a" />
        <span className="deco-orbit deco-orbit-b" />
        <span className="deco-shooting deco-shooting-a" />
        <span className="deco-shooting deco-shooting-b" />
        <span className="deco-star deco-star-a">✦</span>
        <span className="deco-star deco-star-b">✧</span>
        <span className="deco-star deco-star-c">✦</span>
        <div className="deco-shape deco-shape-a" />
        <div className="deco-shape deco-shape-b" />
        <div className="deco-shape deco-shape-c" />
        <span className="deco-particle deco-particle-a" />
        <span className="deco-particle deco-particle-b" />
        <span className="deco-particle deco-particle-c" />
        <div className="login-brand">
          <div className="login-logo">
            <img src={presentationLogo} alt="育英星宠 Logo" />
          </div>
          <h1>育英星宠</h1>
          <p>校园荣誉体系下的学生成长激励平台</p>
          <div className="deco-line" />
        </div>
      </section>
      <section className="login-right">
        <div className="login-card">
          <div className="login-card-panel login-card-panel-a" />
          <div className="login-card-panel login-card-panel-b" />
          <div className="login-card-head">
            <span className="login-card-kicker">YUYING CONTROL NODE</span>
            <span className="login-card-status">● SECURE LINK</span>
          </div>
          <h2>管理后台登录</h2>
          <p className="sub">大理海东育英实验学校</p>
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <span className="login-field-label">账号或手机号 / ACCOUNT</span>
              <span className="icon">◉</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入账号或手机号"
              />
            </div>
            <div className="login-field">
              <span className="login-field-label">密钥 / PASSWORD</span>
              <span className="icon">◌</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                type="password"
              />
            </div>
            <button className="login-btn" type="submit" disabled={submitting}>
              {submitting ? "登录中..." : "登 录"}
            </button>
          </form>
          {error ? <div className="status-card error">{error}</div> : null}
          {/* <div className="login-footer">
            <a href="/">忘记密码?</a>
            <span>© 2026 育英星宠</span>
          </div> */}
          <div className="login-beian">
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=53290102000783"
              target="_blank"
              rel="noreferrer"
            >
              滇公网安备53290102000783号
            </a>
          </div>
          <div className="login-card-tail">
            <span>AUTH CHANNEL · ONLINE</span>
            <span>01 / SYSTEM ACCESS</span>
          </div>
        </div>
      </section>
    </div>
  );
}
