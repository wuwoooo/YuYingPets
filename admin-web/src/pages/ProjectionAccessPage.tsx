import { useState, type FormEvent } from "react";
import presentationLogo from "../assets/presentation-logo.svg";
import { adminApi } from "../lib/api";
import { setAdminLoginCredentials } from "../lib/session";
import "./ProjectionModePage.css";

type ProjectionAccessPageProps = {
  onAuthorized: (token: string) => void;
};

export function ProjectionAccessPage({ onAuthorized }: ProjectionAccessPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("请输入任意账号和密码");
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminApi.projectionLogin(username, password);
      setAdminLoginCredentials(username, password);
      onAuthorized(response.data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投屏验证失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="projection-access-page">
      <form className="projection-access-card" onSubmit={handleSubmit}>
        <img src={presentationLogo} alt="育英星宠 Logo" />
        <div className="projection-access-title">校园驾驶舱投屏入口</div>
        <label>
          <span>账号</span>
          <input
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          <span>密码</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <div className="projection-access-error">{error}</div> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "验证中..." : "进入投屏"}
        </button>
      </form>
    </div>
  );
}
