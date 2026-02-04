import { useEffect, useMemo, useState } from "react";
import FieldTimeline from "../components/FieldTimeline";
import { ymd } from "../lib/time";

const BASE_URL = "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [date, setDate] = useState(() => new Date());
  const dateYmd = useMemo(() => ymd(date), [date]);

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/work-logs/dashboard?date=${dateYmd}`, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateYmd]);

  const activeSections = data?.active ?? [];
  const doneSections = data?.done ?? [];
  const activeCount = (data?.active ?? []).reduce((sum, sec) => sum + (sec.logs?.length ?? 0), 0);
  const doneCount = (data?.done ?? []).reduce((sum, sec) => sum + (sec.logs?.length ?? 0), 0);

  // タイムライン範囲（06:00〜18:00）
  const DAY_START = 6 * 60;
  const DAY_END = 18 * 60;
  const GRID_HOURS = Array.from({ length: 13 }, (_, i) => 6 + i); // 6..18

  // 今時刻（表示中の日付が今日なら使う）
  const nowMin = (() => {
    const today = ymd(new Date());
    if (today !== dateYmd) return null;
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setDate(new Date(date.getTime() - 86400000))} style={iconBtn}>
            ◀
          </button>
          <div style={{ fontWeight: 900 }}>{dateYmd}</div>
          <button onClick={() => setDate(new Date(date.getTime() + 86400000))} style={iconBtn}>
            ▶
          </button>
        </div>

        <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
          <div style={summaryRow}>
            <div style={summaryItem}>
              <div style={summaryLabel}>進行中</div>
              <div style={summaryValue}>{activeCount}</div>
            </div>
            <div style={summaryItem}>
              <div style={summaryLabel}>今日完了</div>
              <div style={summaryValue}>{doneCount}</div>
            </div>
            <div style={summaryRight}>更新: 3秒</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 12, display: "grid", gap: 12 }}>
        {err && (
          <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 12, borderRadius: 12 }}>
            {err}
          </div>
        )}

        {loading && !data && <div style={{ color: "#6b7280" }}>読み込み中...</div>}

        {activeSections.length > 0 && (
          <div style={{ fontWeight: 900, color: "#111827", marginTop: 4 }}>進行中</div>
        )}
        {activeSections.map((sec) => (
          <FieldTimeline
            key={`active-${sec.field?.id ?? Math.random()}`}
            fieldName={sec.field?.name ?? "圃場"}
            logs={sec.logs ?? []}
            dayStart={DAY_START}
            dayEnd={DAY_END}
            gridHours={GRID_HOURS}
            nowMin={nowMin}
          />
        ))}

        {doneSections.length > 0 && (
          <div style={{ fontWeight: 900, color: "#111827", marginTop: 8 }}>今日完了</div>
        )}
        {doneSections.map((sec) => (
          <FieldTimeline
            key={`done-${sec.field?.id ?? Math.random()}`}
            fieldName={sec.field?.name ?? "圃場"}
            logs={sec.logs ?? []}
            dayStart={DAY_START}
            dayEnd={DAY_END}
            gridHours={GRID_HOURS}
            nowMin={nowMin}
          />
        ))}

        {!loading && activeSections.length === 0 && doneSections.length === 0 && (
          <div style={{ color: "#6b7280" }}>この日のデータはありません</div>
        )}
      </div>

      {/* FAB */}
      <button
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 16,
          height: 52,
          borderRadius: 16,
          background: "#111827",
          color: "#fff",
          fontWeight: 900,
          border: "none",
          boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
        }}
      >
        ＋ 作業開始（次で実装）
      </button>
    </div>
  );
}

const iconBtn = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontWeight: 900,
};

const summaryRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const summaryItem = {
  minWidth: 84,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const summaryLabel = {
  fontSize: 11,
  color: "#6b7280",
  fontWeight: 700,
};

const summaryValue = {
  fontSize: 16,
  fontWeight: 900,
  color: "#111827",
};

const summaryRight = {
  marginLeft: "auto",
  fontSize: 12,
  color: "#6b7280",
};
