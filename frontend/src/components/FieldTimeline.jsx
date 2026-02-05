import { clamp, hmToMin } from "../lib/time";

export default function FieldTimeline({ fieldName, logs, dayStart, dayEnd, gridHours, nowMin, showDoneDetails }) {
  // タイムラインの横幅（px）…スマホ前提でスクロールできるように固定幅
  const W = 900;
  const LANE_LEFT = 160;
  const LANE_RIGHT = 10;
  const LANE_W = W - LANE_LEFT - LANE_RIGHT;
  const H_ROW = 58;

  const toLaneX = (min) => {
    const pct = (min - dayStart) / (dayEnd - dayStart);
    return clamp(pct, 0, 1) * LANE_W;
  };

  const toAxisX = (min) => LANE_LEFT + toLaneX(min);

  const nowInRange = nowMin != null && nowMin >= dayStart && nowMin <= dayEnd;
  const nowX =
    nowMin == null
      ? null
      : Math.max(LANE_LEFT, Math.min(LANE_LEFT + LANE_W, toAxisX(nowMin)));
  const nowLabel =
    nowMin == null
      ? ""
      : `${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`;

  const atRightEdge = nowX != null && nowX >= LANE_LEFT + LANE_W - 2;
  const atLeftEdge = nowX != null && nowX <= LANE_LEFT + 2;

  const labelTransform = atRightEdge ? "translateX(-100%)" : atLeftEdge ? "translateX(0%)" : "translateX(-50%)";

  const buildPauseSegments = (log, startMin, endMin) => {
    if (!log?.pause_events || !Array.isArray(log.pause_events)) return [];
    if (startMin == null || endMin == null) return [];

    let pauseStart = null;
    const segments = [];

    for (const ev of log.pause_events) {
      const t = hmToMin(ev.time);
      if (t == null) continue;
      if (ev.action === "pause") {
        pauseStart = t;
      } else if (ev.action === "resume" && pauseStart != null) {
        segments.push({ start: pauseStart, end: t });
        pauseStart = null;
      }
    }

    if (pauseStart != null) {
      segments.push({ start: pauseStart, end: endMin });
    }

    return segments
      .map((seg) => ({
        start: Math.max(startMin, seg.start),
        end: Math.min(endMin, seg.end),
      }))
      .filter((seg) => seg.end > seg.start);
  };

  return (
    <div style={card}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{fieldName}</div>

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ width: W, minWidth: W, position: "relative" }}>
          {/* 時間目盛 */}
          <div style={{ position: "relative", height: 26, marginBottom: 10 }}>
            {gridHours.map((h) => {
              const x = toAxisX(h * 60);
              return (
                <div key={h} style={{ position: "absolute", left: x, top: 0 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", transform: "translateX(-50%)" }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                  
                </div>
              );
            })}
          </div>

          {/* グリッドライン（時間に合わせて縦線） */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 18,
              width: W,
              height: 26 + 10 + logs.length * H_ROW,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {gridHours.map((h) => (
              <div
                key={`grid-${h}`}
                style={{
                  position: "absolute",
                  left: toAxisX(h * 60),
                  top: 0,
                  width: 1,
                  height: "100%",
                  background: "#f1f5f9",
                }}
              />
            ))}
          </div>

          {/* 今の時刻ライン（今日だけ） */}
          {nowMin != null && nowMin >= dayStart && nowMin <= dayEnd && (
            <div style={{ position: "relative" }}>
              {/* ラベル */}
              <div
                style={{
                  position: "absolute",
                  left: toAxisX(nowMin),
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
                  left: toAxisX(nowMin),
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
          {nowMin != null && nowInRange && (
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
              </div>

              {/* 線（範囲内のときだけ） */}
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
            </div>
          )}

          {/* ログの行 */}
          <div style={{ display: "grid", gap: 8 }}>
            {logs.map((log) => {
              const startMin = hmToMin(log.started_time);
              const endMin = log.ended_time ? hmToMin(log.ended_time) : nowMin;

              const x1 = startMin != null ? toLaneX(startMin) : 0;
              const x2 = endMin != null ? toLaneX(endMin) : x1 + 8;
              const width = Math.max(10, x2 - x1);
              const pauseSegments = buildPauseSegments(log, startMin, endMin);
              const timeText = `${log.started_time ?? "--:--"} → ${log.ended_time ?? "--:--"}`;

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
                  {/* 左レーンの背景（作業者/作業名とタイムテーブルを分離） */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: LANE_LEFT,
                      height: "100%",
                      borderRight: "1px solid #e5e7eb",
                      background: "#f8fafc",
                      borderTopLeftRadius: 12,
                      borderBottomLeftRadius: 12,
                    }}
                  />
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
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#111827",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {log.user?.name ?? "?"}は
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {log.task_type?.name ?? "作業"}
                      {log.status === "done" ? "完了" : "中"}です
                    </div>
                  </div>

                  {/* 内容レーン */}
                  <div
                    style={{
                      position: "absolute",
                      left: LANE_LEFT,
                      top: 8,
                      right: LANE_RIGHT,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }} />

                    {/* バー（ガント風） */}
                    {startMin != null && (
                      <>
                        <div
                          title={`#${log.id}`}
                          style={{
                            position: "absolute",
                            left: x1,
                            top: 24,
                            height: 24,
                            width,
                            borderRadius: 999,
                            background:
                              log.status === "done" ? "#334155" : log.status === "paused" ? "#f97316" : "#06b6d4",
                            opacity: 0.9,
                            boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {timeText}
                          {pauseSegments.map((seg, idx) => {
                            const segLeft = toLaneX(seg.start) - x1;
                            const segWidth = Math.max(2, toLaneX(seg.end) - toLaneX(seg.start));
                            return (
                              <div
                                key={`${log.id}-pause-${idx}`}
                                style={{
                                  position: "absolute",
                                  left: segLeft,
                                  top: 0,
                                  height: "100%",
                                  width: segWidth,
                                  background: "transparent",
                                }}
                              />
                            );
                          })}
                        </div>
                      </>
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
