import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = useMemo(() => {
    const state = location.state || {};
    return {
      email: typeof state.email === "string" ? state.email : "",
      password: typeof state.password === "string" ? state.password : "",
    };
  }, [location.state]);

  const [form, setForm] = useState({
    email: prefill.email,
    password: prefill.password,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message ?? "ログインに失敗しました。");
      }
      if (json?.user) {
        let prevAvatar = "";
        try {
          const prev = JSON.parse(window.localStorage.getItem("profile") || "{}");
          prevAvatar = prev?.avatar ?? "";
        } catch {
          prevAvatar = "";
        }
        const saved = {
          name: json.user.name ?? "",
          email: json.user.email ?? "",
          note: "",
          avatar: prevAvatar,
          userId: json.user.id ?? "",
        };
        window.localStorage.setItem("profile", JSON.stringify(saved));
        if (json.user.role) {
          window.localStorage.setItem("role", json.user.role);
        }
      }
      setMessage("ログインしました。");
      navigate("/");
    } catch (err) {
      setMessage(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={title}>ログイン</div>
        <div style={desc}>登録済みメールアドレスとパスワードでログインします。</div>
        {prefill.email && (
          <div style={infoBox}>登録情報を入力済みにしました。</div>
        )}
        <form onSubmit={handleSubmit} style={formGrid}>
          <label style={label}>
            メールアドレス
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              style={input}
              placeholder="example@example.com"
            />
          </label>
          <label style={label}>
            パスワード
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              style={input}
              placeholder="8文字以上"
            />
          </label>
          {message && <div style={infoBox}>{message}</div>}
          <button style={primaryBtn} type="submit" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f8fafc",
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const card = {
  width: "min(520px, 100%)",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  display: "grid",
  gap: 10,
};

const title = {
  fontWeight: 900,
  fontSize: 18,
  color: "#111827",
};

const desc = {
  fontSize: 13,
  color: "#334155",
  lineHeight: "18px",
};

const formGrid = {
  display: "grid",
  gap: 10,
};

const label = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
};

const input = {
  height: 36,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontSize: 14,
};

const infoBox = {
  color: "#0f172a",
  background: "#fff",
  border: "1px solid #e2e8f0",
  padding: 10,
  borderRadius: 10,
  fontSize: 12,
};

const primaryBtn = {
  height: 44,
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
};
