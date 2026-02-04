import { clamp, hmToMin } from "../lib/time";

export default function FieldTimeline({ fieldName, logs, dayStart, dayEnd, gridHours, nowMin }) {
  // タイムラインの横幅（px）…スマホ前提でスクロールできるように固定幅
  const W = 900;
  const H_ROW = 58;

  const toX = (min) => {
    const pct = (min - dayStart) / (dayEnd - dayStart);
    return clamp(pct, 0, 1) * W;
  };

  const nowInRange = nowMin != null && nowMin >= dayStart && nowMin <= dayEnd;
  const nowX = nowMin == null ? null : Math.max(0, Math.min(W, toX(nowMin)));
  const nowLabel =
    nowMin == null
      ? ""
      : `${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`;

  const atRightEdge = nowX != null && nowX >= W - 2;
  const atLeftEdge = nowX != null && nowX <= 2;

  const labelTransform = atRightEdge ? "translateX(-100%)" : atLeftEdge ? "translateX(0%)" : "translateX(-50%)";

  return (
    <div style={card}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{fieldName}</div>

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ width: W, minWidth: W }}>
          {/* 時間目盛 */}
          <div style={{ position: "relative", height: 26, marginBottom: 10 }}>
            {gridHours.map((h) => {
              const x = toX(h * 60);
              return (
                <div key={h} style={{ position: "absolute", left: x, top: 0 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", transform: "translateX(-50%)" }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                  <div style={{ position: "absolute", left: "50%", top: 18, width: 1, height: 8, background: "#e5e7eb" }} />
                </div>
              );
            })}
          </div>

          {/* 今の時刻ライン（今日だけ） */}
          {nowMin != null && nowMin >= dayStart && nowMin <= dayEnd && (
            <div style={{ position: "relative" }}>
              {/* ラベル */}
              <div
                style={{
                  position: "absolute",
                  left: toX(nowMin),
                  top: -2,
                  transform: labelTransform,
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#ef4444",
                  background: "#fff",
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: "1px solid #fecaca",
                  zIndex: 5,
                  whiteSpace: "nowrap",
                }}
              >
                今
              </div>

              {/* 線（目盛〜ログ最下部まで） */}
              <div
                style={{
                  position: "absolute",
                  left: toX(nowMin),
                  top: 18, // 時刻ラベルの下から
                  width: 2,
                  height: 26 + 10 + logs.length * H_ROW, // 目盛(26) + margin(10) + ログ分
                  background: "#ef4444",
                  opacity: 0.35, // 主張しすぎない
                  zIndex: 2,
                }}
              />
            </div>
          )}

          {/* 今の時刻 */}
          {nowMin != null && (
            <div style={{ position: "relative" }}>
              {/* ラベル */}
              <div
                style={{
                  position: "absolute",
                  left: nowX,
                  top: -2,
                  transform: labelTransform,
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#ef4444",
                  background: "#fff",
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: "1px solid #fecaca",
                  zIndex: 5,
                  whiteSpace: "nowrap",
                }}
              >
                今 {nowLabel}
                {nowInRange ? "" : "（範囲外）"}
              </div>

              {/* 線（範囲内のときだけ） */}
              {nowInRange && (
                <div
                  style={{
                    position: "absolute",
                    left: nowX,
                    top: 18,
                    width: 2,
                    height: 26 + 10 + logs.length * H_ROW,
                    background: "#ef4444",
                    opacity: 0.35,
                    zIndex: 2,
                  }}
                />
              )}
            </div>
          )}

          {/* ログの行 */}
          <div style={{ display: "grid", gap: 8 }}>
            {logs.map((log) => {
              const startMin = hmToMin(log.started_time);
              const endMin = log.ended_time ? hmToMin(log.ended_time) : nowMin;

              const x1 = startMin != null ? toX(startMin) : 0;
              const x2 = endMin != null ? toX(endMin) : x1 + 8;
              const width = Math.max(10, x2 - x1);

              const statusLabel =
                log.status === "running" ? "進行中" : log.status === "paused" ? "一時停止" : "完了";

              return (
                <div
                  key={log.id}
                  style={{
                    position: "relative",
                    zIndex: 3,
                    height: H_ROW,
                    border: "1px solid #f1f5f9",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  {/* 人レーン（左固定） */}
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 8,
                      width: 140,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 14,
                        lineHeight: "18px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {log.user?.name ?? "?"}
                    </div>

                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>#{log.id}</div>
                  </div>

                  {/* 内容レーン */}
                  <div
                    style={{
                      position: "absolute",
                      left: 160,
                      top: 8,
                      right: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800 }}>{log.task_type?.name ?? "作業"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{statusLabel}</div>

                      <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
                        {log.started_time ?? "--:--"}
                        {log.ended_time ? ` → ${log.ended_time}` : ""}
                      </div>
                    </div>

                    {/* バー（ガント風） */}
                    {startMin != null && (
                      <div
                        title={`#${log.id}`}
                        style={{
                          position: "absolute",
                          left: x1,
                          top: 28,
                          height: 12,
                          width,
                          borderRadius: 999,
                          background:
                            log.status === "done" ? "#111827" : log.status === "paused" ? "#f59e0b" : "#2563eb",
                          opacity: 0.9,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
        ※ 横スクロールできます（06:00〜18:00）
      </div>
    </div>
  );
}

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
};
