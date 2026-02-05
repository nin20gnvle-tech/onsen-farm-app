import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [inviteStatus, setInviteStatus] = useState("loading"); // loading | valid | invalid
  const [inviteMessage, setInviteMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    avatar: "",
  });
  const [submitErr, setSubmitErr] = useState("");
  const [submitOk, setSubmitOk] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const masked = useMemo(() => {
    if (!token) return "";
    if (token.length <= 8) return token;
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const checkInvite = async () => {
      if (!token) {
        setInviteStatus("invalid");
        setInviteMessage("招待トークンが見つかりません");
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/invites/${token}`, {
          headers: { Accept: "application/json" },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message ?? `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setInviteStatus("valid");
          setInviteMessage(json?.message ?? "招待を確認しました");
        }
      } catch (e) {
        if (!cancelled) {
          setInviteStatus("invalid");
          setInviteMessage(String(e?.message ?? e));
        }
      }
    };
    checkInvite();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr("");
    setSubmitOk("");
    if (!form.name || !form.email || !form.password) {
      setSubmitErr("必須項目を入力してください");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setSubmitErr("パスワードが一致しません");
      return;
    }
    if (!token) {
      setSubmitErr("招待トークンがありません");
      return;
    }
    setSubmitting(true);
    try {
      const { avatar, ...payload } = form;
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...payload, token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message ?? `HTTP ${res.status}`);
      }
      window.localStorage.setItem(
        "profile",
        JSON.stringify({
          name: form.name,
          email: form.email,
          note: "",
          avatar: form.avatar || "",
        })
      );
      setSubmitOk("登録が完了しました。ログイン画面へ移動します。");
      navigate("/login", { state: { email: form.email, password: form.password } });
    } catch (e) {
      setSubmitErr(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={title}>会員登録</div>
        <div style={desc}>
          管理者から届いた招待URLで開いています。
          {masked && (
            <>
              <br />
              招待トークン: <span style={mono}>{masked}</span>
            </>
          )}
        </div>
        {inviteStatus === "invalid" && (
          <div style={errorBox}>招待の確認に失敗しました: {inviteMessage}</div>
        )}
        {inviteStatus === "valid" && inviteMessage && (
          <div style={infoBox}>{inviteMessage}</div>
        )}
        {inviteStatus === "loading" && <div style={note}>招待を確認中...</div>}

        {inviteStatus === "valid" && (
          <form onSubmit={handleSubmit} style={formGrid}>
            <label style={label}>
              氏名
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                style={input}
                placeholder="例: 山田 太郎"
              />
            </label>
            <label style={label}>
              アイコン
              <div style={avatarRow}>
                <div style={avatarPreview}>
                  {form.avatar ? (
                    <img src={form.avatar} alt="アイコン" style={avatarImage} />
                  ) : (
                    <span style={avatarPlaceholder}>未設定</span>
                  )}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={avatarInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleAvatarChange(file);
                      e.target.value = "";
                    }}
                  />
                  {form.avatar && (
                    <button
                      type="button"
                      style={avatarRemoveBtn}
                      onClick={() => setForm((prev) => ({ ...prev, avatar: "" }))}
                    >
                      画像を削除
                    </button>
                  )}
                </div>
              </div>
            </label>
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
            <label style={label}>
              パスワード（確認）
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                style={input}
                placeholder="もう一度入力"
              />
            </label>

            {submitErr && <div style={errorBox}>{submitErr}</div>}
            {submitOk && <div style={infoBox}>{submitOk}</div>}

            <button style={primaryBtn} disabled={submitting}>
              {submitting ? "登録中..." : "登録する"}
            </button>
          </form>
        )}
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

const note = {
  fontSize: 12,
  color: "#64748b",
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

const avatarRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatarPreview = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const avatarImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarPlaceholder = {
  fontSize: 11,
  color: "#94a3b8",
  fontWeight: 700,
};

const avatarInput = {
  height: 36,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontSize: 13,
};

const avatarRemoveBtn = {
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#475569",
  fontWeight: 700,
  fontSize: 12,
};

const errorBox = {
  color: "#b91c1c",
  background: "#fff",
  border: "1px solid #fecaca",
  padding: 10,
  borderRadius: 10,
  fontSize: 12,
};

const infoBox = {
  color: "#0f172a",
  background: "#fff",
  border: "1px solid #e2e8f0",
  padding: 10,
  borderRadius: 10,
  fontSize: 12,
};

const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
