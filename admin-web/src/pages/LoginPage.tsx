import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import beianIcon from "../assets/beian.png";
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

const COMMON_WEAK_PASSWORDS = new Set([
  "123456",
  "12345678",
  "123456789",
  "111111",
  "000000",
  "666666",
  "888888",
  "password",
  "qwerty",
  "abc123",
  "admin",
]);

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const navigate = useNavigate();
  const storedCredentials = getAdminLoginCredentials();
  const [username, setUsername] = useState(storedCredentials?.username ?? "");
  const [password, setPassword] = useState(storedCredentials?.password ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [temporaryToken, setTemporaryToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordChangeRequired = Boolean(temporaryToken);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setIsExiting(true);
    setError(null);

    try {
      const response = await adminApi.login(username, password);
      if (response.data.user.passwordChangeRequired) {
        setTemporaryToken(response.data.token);
        setIsExiting(false);
        return;
      }
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

  async function handleForcedPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!temporaryToken) {
      setError("临时登录状态已失效，请重新登录");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码至少 6 位");
      return;
    }
    if (newPassword === password) {
      setError("新密码不能与临时密码相同");
      return;
    }
    if (COMMON_WEAK_PASSWORDS.has(newPassword.trim().toLowerCase())) {
      setError("新密码过于简单，请避免使用 123456 等常见弱口令");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setChangingPassword(true);
    try {
      await adminApi.changePassword(temporaryToken, {
        currentPassword: password,
        newPassword,
      });
      setAdminLoginCredentials(username, newPassword);
      setAdminToken(temporaryToken);
      onLoggedIn(temporaryToken);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "密码修改失败");
    } finally {
      setChangingPassword(false);
    }
  }

  function handleBackToLogin() {
    setTemporaryToken(null);
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setIsExiting(false);
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
        <div className={`login-card${passwordChangeRequired ? " login-card-password-change" : ""}`}>
          <div className="login-card-panel login-card-panel-a" />
          <div className="login-card-panel login-card-panel-b" />
          <div className="login-card-head">
            <span className="login-card-kicker">
              {passwordChangeRequired ? "PASSWORD RESET CHECKPOINT" : "YUYING CONTROL NODE"}
            </span>
            <span className="login-card-status">
              {passwordChangeRequired ? "● ACTION REQUIRED" : "● SECURE LINK"}
            </span>
          </div>
          <h2>{passwordChangeRequired ? "必须先修改密码" : "管理后台登录"}</h2>
          <p className="sub">{passwordChangeRequired ? "检测到临时密码登录，请先完成安全设置后再进入系统" : "大理海东育英实验学校"}</p>
          {passwordChangeRequired ? (
            <form onSubmit={handleForcedPasswordChange}>
              <div className="login-password-alert">
                <div className="login-password-alert-badge">首次登录 / 强制改密</div>
                <strong>当前账号 {username || "本次登录账号"} 正在使用临时密码。</strong>
                <p>请设置一个新的正式密码。修改完成后才会进入工作台。</p>
              </div>
              <div className="login-field">
                <span className="login-field-label">新密码 / NEW PASSWORD</span>
                <span className="icon">◌</span>
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="请输入新密码"
                  type="password"
                />
              </div>
              <div className="login-field">
                <span className="login-field-label">确认新密码 / CONFIRM</span>
                <span className="icon">◌</span>
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="请再次输入新密码"
                  type="password"
                />
              </div>
              <button className="login-btn" type="submit" disabled={changingPassword}>
                {changingPassword ? "更新中..." : "更新密码并进入"}
              </button>
              <button className="login-alt-btn" type="button" onClick={handleBackToLogin} disabled={changingPassword}>
                返回登录页
              </button>
            </form>
          ) : (
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
          )}
          {error ? <div className="status-card error">{error}</div> : null}
          {/* <div className="login-footer">
            <a href="/">忘记密码?</a>
            <span>© 2026 育英星宠</span>
          </div> */}
          <div className="login-beian">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
            >
              滇ICP备2020007229号-4
            </a>
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=53290102000783"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={beianIcon}
                alt=""
                className="login-beian-icon"
                width={13}
                height={14}
              />
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
