import { useEffect, useMemo, useRef, useState } from "react";
import FieldTimeline from "../components/FieldTimeline";
import { ymd } from "../lib/time";

const BASE_URL = "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [date, setDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("date");
    return d ? new Date(`${d}T00:00:00`) : new Date();
  });
  const role = window.localStorage.getItem("role") || "worker"; // admin | worker
  const [mainTab, setMainTab] = useState("logs"); // logs | inventory | chat | settings
  const dateYmd = useMemo(() => ymd(date), [date]);

  const [tab, setTab] = useState("active"); // active | done
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [masters, setMasters] = useState(null);
  const [startForm, setStartForm] = useState({ field_id: "", task_type_id: "", product_id: "" });
  const [startErr, setStartErr] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeForm, setCompleteForm] = useState({ quantity: "", unit: "", memo: "" });
  const [completeErr, setCompleteErr] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ quantity: "", unit: "", memo: "" });
  const [editErr, setEditErr] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [actionErr, setActionErr] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryErr, setInventoryErr] = useState("");
  const [movementItems, setMovementItems] = useState([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementErr, setMovementErr] = useState("");
  const [movementDate, setMovementDate] = useState("");
  const movementDateRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: "システム", text: "チャットを開始できます。", time: "09:00", files: [] },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatFiles, setChatFiles] = useState([]);
  const [chatReplyTo, setChatReplyTo] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const [stockOpen, setStockOpen] = useState(false);
  const [stockForm, setStockForm] = useState({ item_id: "", quantity: "" });
  const [stockErr, setStockErr] = useState("");
  const [stockLoading, setStockLoading] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockOutForm, setStockOutForm] = useState({ item_id: "", quantity: "" });
  const [stockOutErr, setStockOutErr] = useState("");
  const [stockOutLoading, setStockOutLoading] = useState(false);
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [stockAdjustForm, setStockAdjustForm] = useState({ item_id: "", quantity: "" });
  const [stockAdjustErr, setStockAdjustErr] = useState("");
  const [stockAdjustLoading, setStockAdjustLoading] = useState(false);

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

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text && chatFiles.length === 0) return;
    const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const files = chatFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), user: "自分", text, time, files, replyTo: chatReplyTo },
    ]);
    setChatInput("");
    setChatFiles([]);
    setChatReplyTo(null);
  };

  const handleEditOpen = () => {
    if (!doneLogs.length) {
      setEditErr("完了した作業がありません");
      return;
    }
    setEditErr("");
    const first = doneLogs[0] ?? null;
    setEditTargetId(first?.id ?? null);
    setEditForm({
      quantity: first?.quantity ?? "",
      unit: first?.unit ?? "",
      memo: first?.memo ?? "",
    });
    setEditOpen(true);
    if (!masters) {
      loadMasters();
    }
  };

  const handleEditSave = async () => {
    if (!editTargetId) {
      setEditErr("編集する作業を選択してください");
      return;
    }
    const target = doneLogs.find((l) => l.id === editTargetId);
    if (!target) {
      setEditErr("編集対象が見つかりません");
      return;
    }
    setEditLoading(true);
    setEditErr("");
    const payload = {
      quantity: editForm.quantity ? Number(editForm.quantity) : null,
      unit: editForm.unit || null,
      memo: editForm.memo || null,
    };
    try {
      await callWorkLogAction(target, "details", payload);
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateYmd]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("date") !== dateYmd) {
      params.set("date", dateYmd);
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", next);
    }
  }, [dateYmd]);

  useEffect(() => {
    if (mainTab === "inventory" && inventoryItems.length === 0 && !inventoryLoading) {
      loadInventory();
    }
    if (mainTab === "inventory" && movementItems.length === 0 && !movementLoading) {
      loadMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

  useEffect(() => {
    if (mainTab === "inventory") {
      loadMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementDate]);

  const loadMasters = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/masters`, { headers: { Accept: "application/json" } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      setMasters(json);
      setStartForm((prev) => ({
        field_id: prev.field_id || json.fields?.[0]?.id || "",
        task_type_id: prev.task_type_id || json.task_types?.[0]?.id || "",
        product_id: prev.product_id ?? "",
      }));
    } catch (e) {
      setStartErr(String(e?.message ?? e));
    }
  };

  const openStart = async () => {
    setStartErr("");
    setStartOpen(true);
    await loadMasters();
  };

  const loadInventory = async () => {
    setInventoryErr("");
    setInventoryLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/items`, { headers: { Accept: "application/json" } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      const items = json.items ?? [];
      const sorted = [...items].sort((a, b) => {
        const aLow = Number(a.quantity) <= 1;
        const bLow = Number(b.quantity) <= 1;
        if (aLow !== bLow) return aLow ? -1 : 1;
        const aGroup = getKanaGroup(a.name ?? "");
        const bGroup = getKanaGroup(b.name ?? "");
        const aOrder = getGroupOrder(aGroup);
        const bOrder = getGroupOrder(bGroup);
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aName = a.name ?? "";
        const bName = b.name ?? "";
        return aName.localeCompare(bName, "ja");
      });
      setInventoryItems(sorted);
    } catch (e) {
      setInventoryErr(String(e?.message ?? e));
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadMovements = async () => {
    setMovementErr("");
    setMovementLoading(true);
    try {
      const params = new URLSearchParams();
      if (movementDate) {
        params.set("date", movementDate);
      } else {
        params.set("limit", "10");
      }
      const res = await fetch(`${BASE_URL}/api/items/movements?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      setMovementItems(json.movements ?? []);
    } catch (e) {
      setMovementErr(String(e?.message ?? e));
    } finally {
      setMovementLoading(false);
    }
  };

  const openStockIn = () => {
    setStockErr("");
    setStockOpen(true);
    setStockForm({
      item_id: inventoryItems[0]?.id ?? "",
      quantity: "",
    });
  };

  const openStockOut = () => {
    setStockOutErr("");
    setStockOutOpen(true);
    setStockOutForm({
      item_id: inventoryItems[0]?.id ?? "",
      quantity: "",
    });
  };

  const openStockAdjust = () => {
    setStockAdjustErr("");
    setStockAdjustOpen(true);
    setStockAdjustForm({
      item_id: inventoryItems[0]?.id ?? "",
      quantity: "",
    });
  };

  const handleStockIn = async () => {
    if (!stockForm.item_id || !stockForm.quantity) {
      setStockErr("農薬名と分量を入力してください");
      return;
    }
    setStockLoading(true);
    setStockErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/items/in`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          item_id: Number(stockForm.item_id),
          quantity: Number(stockForm.quantity),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      await loadInventory();
      await loadMovements();
      setStockOpen(false);
    } catch (e) {
      setStockErr(String(e?.message ?? e));
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockOut = async () => {
    if (!stockOutForm.item_id || !stockOutForm.quantity) {
      setStockOutErr("農薬名と分量を入力してください");
      return;
    }
    setStockOutLoading(true);
    setStockOutErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/items/out`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          item_id: Number(stockOutForm.item_id),
          quantity: Number(stockOutForm.quantity),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      await loadInventory();
      await loadMovements();
      setStockOutOpen(false);
    } catch (e) {
      setStockOutErr(String(e?.message ?? e));
    } finally {
      setStockOutLoading(false);
    }
  };

  const handleStockAdjust = async () => {
    if (!stockAdjustForm.item_id || stockAdjustForm.quantity === "") {
      setStockAdjustErr("農薬名と分量を入力してください");
      return;
    }
    setStockAdjustLoading(true);
    setStockAdjustErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/items/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          item_id: Number(stockAdjustForm.item_id),
          quantity: Number(stockAdjustForm.quantity),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      await loadInventory();
      await loadMovements();
      setStockAdjustOpen(false);
    } catch (e) {
      setStockAdjustErr(String(e?.message ?? e));
    } finally {
      setStockAdjustLoading(false);
    }
  };

  const handleStart = async () => {
    if (!startForm.field_id || !startForm.task_type_id) {
      setStartErr("圃場・作業種別を選択してください");
      return;
    }
    setStartLoading(true);
    setStartErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/work-logs/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          field_id: Number(startForm.field_id),
          task_type_id: Number(startForm.task_type_id),
          product_id: startForm.product_id ? Number(startForm.product_id) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      setStartOpen(false);
      load();
    } catch (e) {
      setStartErr(String(e?.message ?? e));
    } finally {
      setStartLoading(false);
    }
  };

  const activeSections = data?.active ?? [];
  const doneSections = data?.done ?? [];
  const displayActiveSections = activeSections
    .map((sec) => ({ ...sec, logs: (sec.logs ?? []).filter((log) => log.status === "running") }))
    .filter((sec) => (sec.logs?.length ?? 0) > 0);
  const sections = tab === "active" ? displayActiveSections : doneSections;
  const activeCount = displayActiveSections.reduce((sum, sec) => sum + (sec.logs?.length ?? 0), 0);
  const doneCount = (data?.done ?? []).reduce((sum, sec) => sum + (sec.logs?.length ?? 0), 0);
  const activeLogs = activeSections.flatMap((sec) => sec.logs ?? []);
  const doneLogs = doneSections.flatMap((sec) => sec.logs ?? []);
  const runningLog = activeLogs.find((l) => l.status === "running");
  const pausedLog = activeLogs.find((l) => l.status === "paused");
  const currentActiveLog = runningLog ?? pausedLog ?? null;
  const currentDoneLog = doneLogs[0] ?? null;

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

  const callWorkLogAction = async (log, action, extraBody = {}) => {
    if (!log?.id || !log?.user?.id) {
      setActionErr("対象の作業ログが見つかりません");
      return;
    }
    setActionLoading(true);
    setActionErr("");
    try {
      const res = await fetch(`${BASE_URL}/api/work-logs/${log.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ user_id: log.user.id, ...extraBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      load();
    } catch (e) {
      setActionErr(String(e?.message ?? e));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseResume = () => {
    if (!currentActiveLog) {
      setActionErr("進行中の作業がありません");
      return;
    }
    const action = currentActiveLog.status === "paused" ? "resume" : "pause";
    callWorkLogAction(currentActiveLog, action);
  };

  const handleStop = () => {
    if (!currentActiveLog) {
      setActionErr("進行中の作業がありません");
      return;
    }
    setCompleteErr("");
    setCompleteForm({ quantity: "", unit: "", memo: "" });
    setCompleteOpen(true);
    if (!masters) {
      loadMasters();
    }
  };

  const handleCompleteSave = async () => {
    if (!currentActiveLog) {
      setCompleteErr("進行中の作業がありません");
      return;
    }
    setCompleteLoading(true);
    setCompleteErr("");
    const payload = {
      quantity: completeForm.quantity ? Number(completeForm.quantity) : null,
      unit: completeForm.unit || null,
      memo: completeForm.memo || null,
    };
    try {
      await callWorkLogAction(currentActiveLog, "stop", payload);
      setCompleteOpen(false);
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleCompleteSkip = async () => {
    if (!currentActiveLog) {
      setCompleteErr("進行中の作業がありません");
      return;
    }
    setCompleteLoading(true);
    setCompleteErr("");
    try {
      await callWorkLogAction(currentActiveLog, "stop");
      setCompleteOpen(false);
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleUndo = () => {
    if (!currentDoneLog) {
      setActionErr("完了した作業がありません");
      return;
    }
    callWorkLogAction(currentDoneLog, "undo");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 144 }}>
      {/* Header */}
      {mainTab === "logs" && (
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, maxWidth: 560, margin: "0 auto" }}>
            <button onClick={() => setDate(new Date(date.getTime() - 86400000))} style={dateBtn}>
              ◀ 前日
            </button>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 10 }}>
              <input
                type="date"
                value={dateYmd}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setDate(new Date(`${e.target.value}T00:00:00`));
                }}
                style={dateInput}
              />
            </div>
            <button onClick={() => setDate(new Date(date.getTime() + 86400000))} style={dateBtn}>
              翌日 ▶
            </button>
          </div>

          <div style={{ padding: "0 12px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setTab("active")} style={tabBtn(tab === "active")}>
              進行中（{activeCount}）
            </button>
            <button onClick={() => setTab("done")} style={tabBtn(tab === "done")}>
              完了（{doneCount}）
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: 12, display: "grid", gap: 12 }}>
        {mainTab === "logs" && (
          <>
            {actionErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 12, borderRadius: 12 }}>
                {actionErr}
              </div>
            )}
            {err && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 12, borderRadius: 12 }}>
                {err}
              </div>
            )}

            {loading && !data && <div style={{ color: "#6b7280" }}>読み込み中...</div>}

            {sections.map((sec) => (
              <FieldTimeline
                key={`${tab}-${sec.field?.id ?? Math.random()}`}
                fieldName={sec.field?.name ?? "圃場"}
                logs={sec.logs ?? []}
                dayStart={DAY_START}
                dayEnd={DAY_END}
                gridHours={GRID_HOURS}
                nowMin={nowMin}
                showDoneDetails={tab === "done"}
              />
            ))}

            {!loading && sections.length === 0 && (
              <div style={{ color: "#6b7280", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                この日のデータはありません
              </div>
            )}
          </>
        )}

        {mainTab === "inventory" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 16 }}>在庫管理</div>
            <div style={panel}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>在庫品目</div>
              {inventoryErr && <div style={{ color: "#b91c1c", fontSize: 12 }}>{inventoryErr}</div>}
              {inventoryLoading && <div style={{ color: "#6b7280", fontSize: 12 }}>読み込み中...</div>}
              {!inventoryLoading && inventoryItems.length === 0 && (
                <div style={{ color: "#6b7280", fontSize: 12 }}>在庫データがありません</div>
              )}
              {!inventoryLoading && inventoryItems.length > 0 && (
                <>
                  <div style={inventoryTitle}>農薬一覧</div>
                  <div style={inventoryHeader}>
                    <div />
                    <div>在庫数</div>
                  </div>
                </>
              )}
              <div style={{ display: "grid", gap: 8 }}>
                {(() => {
                  const lowItems = inventoryItems.filter((i) => Number(i.quantity) <= 1);
                  const normalItems = inventoryItems.filter((i) => Number(i.quantity) > 1);
                  return (
                    <>
                      {lowItems.length > 0 && (
                        <div style={inventoryGroupLow}>残り少</div>
                      )}
                      {lowItems.map((item) => (
                        <div key={item.id} style={inventoryRow}>
                          <div style={{ fontWeight: 800, color: "#111827" }}>{item.name}</div>
                          <div style={inventoryQtyLow}>
                            {item.quantity ?? 0}
                            {item.unit ? ` ${item.unit}` : ""}
                          </div>
                        </div>
                      ))}
                      {normalItems.map((item, idx) => {
                        const group = getKanaGroup(item.name ?? "");
                        const prevGroup =
                          idx > 0 ? getKanaGroup(normalItems[idx - 1].name ?? "") : null;
                        return (
                          <div key={item.id}>
                            {group && group !== prevGroup && <div style={inventoryGroup}>{group}〜</div>}
                            <div style={inventoryRow}>
                              <div style={{ fontWeight: 800, color: "#111827" }}>{item.name}</div>
                              <div style={inventoryQty}>
                                {item.quantity ?? 0}
                                {item.unit ? ` ${item.unit}` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
            <div style={panel}>
              <div style={panelTitle}>入出庫・棚卸し履歴</div>
              <div style={movementFilterRow}>
                <label style={movementFilterLabel}>
                  日付
                  <input
                    ref={movementDateRef}
                    type="date"
                    value={movementDate}
                    onChange={(e) => setMovementDate(e.target.value)}
                    onFocus={() => {
                      if (movementDateRef.current?.showPicker) {
                        movementDateRef.current.showPicker();
                      }
                    }}
                    style={movementFilterInput}
                  />
                </label>
                <button style={movementFilterClear} onClick={() => setMovementDate("")}>
                  クリア
                </button>
              </div>
              {movementLoading && <div style={{ color: "#6b7280", fontSize: 12 }}>読み込み中...</div>}
              {!movementLoading && movementErr && (
                <div style={{ color: "#b91c1c", fontSize: 12 }}>{movementErr}</div>
              )}
              {!movementLoading && !movementErr && movementItems.length === 0 && (
                <div style={{ color: "#6b7280", fontSize: 12 }}>履歴がありません</div>
              )}
              {!movementLoading && !movementErr && movementItems.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  {movementItems.map((m) => {
                    const typeLabel = getMovementTypeLabel(m.type);
                    const qty = formatQuantity(m.quantity);
                    const unit = m.item?.unit ? ` ${m.item.unit}` : "";
                    return (
                      <div key={m.id} style={movementRow}>
                        <div style={movementTitle}>
                          <span style={movementUser}>{m.user?.name ?? "不明"}</span>
                          が
                          <span style={movementItem}>{m.item?.name ?? "不明"}</span>
                          を
                          <span style={movementQty}>{qty}{unit}</span>
                          {typeLabel}
                        </div>
                        <div style={movementMeta}>{formatDateTime(m.created_at)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {chatImagePreview && (
          <div style={imageOverlay} onClick={() => setChatImagePreview(null)}>
            <div style={imageModal} onClick={(e) => e.stopPropagation()}>
              <img src={chatImagePreview.url} alt={chatImagePreview.name} style={imagePreview} />
              <div style={imageActions}>
                <a
                  href={chatImagePreview.url}
                  download={chatImagePreview.name || "image"}
                  style={imageDownloadBtn}
                >
                  保存
                </a>
                <button style={imageCloseBtn} onClick={() => setChatImagePreview(null)}>
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {mainTab === "chat" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>メッセージ</div>
            <div style={chatPanel}>
              <div style={chatList}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} style={msg.user === "自分" ? chatRowSelf : chatRow}>
                    <div style={msg.user === "自分" ? chatHeaderSelf : chatHeader}>
                      <div style={msg.user === "自分" ? chatAvatarSelf : chatAvatar}>
                        {(msg.user ?? "?").slice(0, 1)}
                      </div>
                      <div style={chatName}>{msg.user}</div>
                    </div>
                    <div style={msg.user === "自分" ? chatBubbleSelf : chatBubble}>
                      {msg.replyTo && (
                        <div style={chatReplyBadge}>
                          <div style={chatReplyLabel}>返信先</div>
                          <div style={chatReplyText}>
                            {msg.replyTo.user}: {msg.replyTo.text || (msg.replyTo.files?.length ? "添付ファイル" : "")}
                          </div>
                        </div>
                      )}
                      {msg.text && <div style={chatText}>{msg.text}</div>}
                      {msg.files?.length > 0 && (
                        <div style={chatMediaList}>
                          {msg.files.map((file) => (
                            <div key={file.id} style={chatMediaItem}>
                              {file.type?.startsWith("image/") ? (
                                <button
                                  style={chatImageBtn}
                                  onClick={() => setChatImagePreview({ url: file.url, name: file.name })}
                                >
                                  <img src={file.url} alt={file.name} style={chatImage} />
                                </button>
                              ) : file.type?.startsWith("video/") ? (
                                <video src={file.url} controls style={chatVideo} />
                              ) : (
                                <div style={chatFileBadge}>{file.name}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={chatTimeRow}>
                      <div style={chatTime}>{msg.time}</div>
                      <button
                        style={chatReplyBtn}
                        onClick={() =>
                          setChatReplyTo({
                            id: msg.id,
                            user: msg.user,
                            text: msg.text ?? "",
                            files: msg.files ?? [],
                          })
                        }
                      >
                        返信
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={chatComposer}>
                <div style={chatInputRow}>
                  <input
                    style={chatInputStyle}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="メッセージを入力"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                  />
                  <label style={chatAttachBtn} title="添付">
                    <span style={chatAttachIcon} aria-hidden="true">
                      📎
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length > 0) {
                          setChatFiles((prev) => [...prev, ...files]);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label style={chatCameraBtn} title="カメラ">
                    <span style={chatCameraIcon} aria-hidden="true">
                      📷
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length > 0) {
                          setChatFiles((prev) => [...prev, ...files]);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button style={chatSendBtn} onClick={handleChatSend} title="送信" aria-label="送信">
                    <span style={chatSendIcon} aria-hidden="true">
                      📤
                    </span>
                  </button>
                </div>
                {chatReplyTo && (
                  <div style={chatReplyPreview}>
                    <div style={chatReplyPreviewLabel}>返信先</div>
                    <div style={chatReplyPreviewText}>
                      {chatReplyTo.user}: {chatReplyTo.text || (chatReplyTo.files?.length ? "添付ファイル" : "")}
                    </div>
                    <button style={chatReplyCancel} onClick={() => setChatReplyTo(null)}>
                      取消
                    </button>
                  </div>
                )}
                {chatFiles.length > 0 && (
                  <div style={chatPreviewList}>
                    {chatFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} style={chatPreviewItem}>
                        <div style={chatPreviewName}>{file.name}</div>
                        <button
                          style={chatPreviewRemove}
                          onClick={() => setChatFiles((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Bar */}
      {mainTab === "logs" && (
        <div
          style={{
            ...actionBar,
            gridTemplateColumns: tab === "done" ? "1fr 1fr" : "1.3fr 1fr 1fr",
          }}
        >
          <button onClick={openStart} style={actionBtnPrimary} disabled={actionLoading}>
            作業開始
          </button>
          {tab === "active" ? (
            <>
              <button
                onClick={handlePauseResume}
                style={actionBtnSecondary}
                disabled={actionLoading || !currentActiveLog}
              >
                {currentActiveLog?.status === "paused" ? "再開" : "停止"}
              </button>
              <button onClick={handleStop} style={actionBtnDanger} disabled={actionLoading || !currentActiveLog}>
                完了
              </button>
            </>
          ) : (
            <button onClick={handleEditOpen} style={actionBtnGhost} disabled={actionLoading || !currentDoneLog}>
              編集
            </button>
          )}
        </div>
      )}

      {stockAdjustOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>棚卸し調整</div>
            {stockAdjustErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 8, borderRadius: 10 }}>
                {stockAdjustErr}
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <label style={modalLabel}>
                農薬名
                <select
                  style={modalSelect}
                  value={stockAdjustForm.item_id}
                  onChange={(e) => setStockAdjustForm((prev) => ({ ...prev, item_id: e.target.value }))}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modalLabel}>
                在庫数
                <input
                  style={modalInput}
                  inputMode="numeric"
                  type="number"
                  min="0"
                  step="1"
                  value={stockAdjustForm.quantity}
                  onChange={(e) => setStockAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="例: 10"
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button style={modalCancelBtn} onClick={() => setStockAdjustOpen(false)}>
                キャンセル
              </button>
              <button style={modalStartBtn} onClick={handleStockAdjust} disabled={stockAdjustLoading}>
                反映
              </button>
            </div>
          </div>
        </div>
      )}

      {stockOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>入庫</div>
            {stockErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 8, borderRadius: 10 }}>
                {stockErr}
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <label style={modalLabel}>
                農薬名
                <select
                  value={stockForm.item_id}
                  onChange={(e) => setStockForm((s) => ({ ...s, item_id: e.target.value }))}
                  style={modalSelect}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modalLabel}>
                分量
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm((s) => ({ ...s, quantity: e.target.value }))}
                  style={modalInput}
                  placeholder="例: 1"
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setStockOpen(false)} style={modalCancelBtn}>
                キャンセル
              </button>
              <button onClick={handleStockIn} style={modalStartBtn} disabled={stockLoading}>
                {stockLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stockOutOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>出庫</div>
            {stockOutErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 8, borderRadius: 10 }}>
                {stockOutErr}
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <label style={modalLabel}>
                農薬名
                <select
                  value={stockOutForm.item_id}
                  onChange={(e) => setStockOutForm((s) => ({ ...s, item_id: e.target.value }))}
                  style={modalSelect}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modalLabel}>
                分量
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockOutForm.quantity}
                  onChange={(e) => setStockOutForm((s) => ({ ...s, quantity: e.target.value }))}
                  style={modalInput}
                  placeholder="例: 1"
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setStockOutOpen(false)} style={modalCancelBtn}>
                キャンセル
              </button>
              <button onClick={handleStockOut} style={modalStartBtn} disabled={stockOutLoading}>
                {stockOutLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Action Bar */}
      {mainTab === "inventory" && (
        <div style={{ ...actionBar, gridTemplateColumns: "1.3fr 1.3fr 0.4fr" }}>
          <button style={invBtnIn} onClick={openStockIn}>
            入庫
          </button>
          <button style={invBtnOut} onClick={openStockOut}>
            出庫
          </button>
          <button style={invBtnAdjust} onClick={openStockAdjust}>
            棚卸し調整
          </button>
        </div>
      )}

      {startOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>作業開始</div>
            {startErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 8, borderRadius: 10 }}>
                {startErr}
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <label style={modalLabel}>
                圃場
                <select
                  value={startForm.field_id}
                  onChange={(e) => setStartForm((s) => ({ ...s, field_id: e.target.value }))}
                  style={modalSelect}
                >
                  {(masters?.fields ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modalLabel}>
                作業種別
                <select
                  value={startForm.task_type_id}
                  onChange={(e) => setStartForm((s) => ({ ...s, task_type_id: e.target.value }))}
                  style={modalSelect}
                >
                  {(masters?.task_types ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modalLabel}>
                フルーツ種別（任意）
                <select
                  value={startForm.product_id}
                  onChange={(e) => setStartForm((s) => ({ ...s, product_id: e.target.value }))}
                  style={modalSelect}
                >
                  <option value="">未選択</option>
                  {(masters?.products ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setStartOpen(false)} style={modalCancelBtn}>
                キャンセル
              </button>
              <button onClick={handleStart} style={modalStartBtn} disabled={startLoading}>
                {startLoading ? "開始中..." : "開始"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>完了編集</div>
            {editErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 8, borderRadius: 10 }}>
                {editErr}
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <label style={modalLabel}>
                編集する作業
                <select
                  value={editTargetId ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setEditTargetId(id);
                    const target = doneLogs.find((l) => l.id === id);
                    setEditForm({
                      quantity: target?.quantity ?? "",
                      unit: target?.unit ?? "",
                      memo: target?.memo ?? "",
                    });
                  }}
                  style={modalSelect}
                >
                  {doneLogs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {`${l.task_type?.name ?? "作業"} / ${l.user?.name ?? "?"} / ${l.started_time ?? "--:--"} → ${
                        l.ended_time ?? "--:--"
                      }`}
                    </option>
                  ))}
                </select>
              </label>
              <label style={modalLabel}>
                数量
                <input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((s) => ({ ...s, quantity: e.target.value }))}
                  style={modalInput}
                  placeholder="例: 12.5"
                />
              </label>
              <label style={modalLabel}>
                単位
                <input
                  list="unit-options"
                  value={editForm.unit}
                  onChange={(e) => setEditForm((s) => ({ ...s, unit: e.target.value }))}
                  style={modalInput}
                  placeholder="例: kg / 箱"
                />
              </label>
              <label style={modalLabel}>
                メモ
                <textarea
                  value={editForm.memo}
                  onChange={(e) => setEditForm((s) => ({ ...s, memo: e.target.value }))}
                  style={modalTextarea}
                  placeholder="任意"
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <button onClick={() => setEditOpen(false)} style={modalSkipBtn} disabled={editLoading}>
                閉じる
              </button>
              <button onClick={handleEditSave} style={modalStartBtn} disabled={editLoading}>
                {editLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {completeOpen && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>完了入力（任意）</div>
            {completeErr && (
              <div style={{ color: "#b91c1c", background: "#fff", border: "1px solid #fecaca", padding: 8, borderRadius: 10 }}>
                {completeErr}
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <label style={modalLabel}>
                数量
                <input
                  type="number"
                  value={completeForm.quantity}
                  onChange={(e) => setCompleteForm((s) => ({ ...s, quantity: e.target.value }))}
                  style={modalInput}
                  placeholder="例: 12.5"
                />
              </label>
              <label style={modalLabel}>
                単位
                <input
                  list="unit-options"
                  value={completeForm.unit}
                  onChange={(e) => setCompleteForm((s) => ({ ...s, unit: e.target.value }))}
                  style={modalInput}
                  placeholder="例: kg / 箱"
                />
                <datalist id="unit-options">
                  {(masters?.units ?? []).map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </label>
              <label style={modalLabel}>
                メモ
                <textarea
                  value={completeForm.memo}
                  onChange={(e) => setCompleteForm((s) => ({ ...s, memo: e.target.value }))}
                  style={modalTextarea}
                  placeholder="任意"
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <button onClick={handleCompleteSkip} style={modalSkipBtn} disabled={completeLoading}>
                スキップ
              </button>
              <button onClick={handleCompleteSave} style={modalStartBtn} disabled={completeLoading}>
                {completeLoading ? "保存中..." : "保存して完了"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tabs */}
      <div style={bottomTabs}>
        <button onClick={() => setMainTab("logs")} style={{ ...bottomTabBtn, ...(mainTab === "logs" ? bottomTabActive : null) }}>
          <span style={bottomTabIcon}>🗒️</span>
          作業ログ
        </button>
        <button
          onClick={() => setMainTab("inventory")}
          style={{ ...bottomTabBtn, ...bottomTabDivider, ...(mainTab === "inventory" ? bottomTabActive : null) }}
        >
          <span style={bottomTabIcon}>📦</span>
          在庫
        </button>
        <button
          onClick={() => setMainTab("chat")}
          style={{ ...bottomTabBtn, ...bottomTabDivider, ...(mainTab === "chat" ? bottomTabActive : null) }}
        >
          <span style={bottomTabIcon}>💬</span>
          チャット
        </button>
        <button
          onClick={() => setMainTab("settings")}
          style={{ ...bottomTabBtn, ...bottomTabDivider, ...(mainTab === "settings" ? bottomTabActive : null) }}
        >
          <span style={bottomTabIcon}>⚙️</span>
          {role === "admin" ? "招待" : "会員情報"}
        </button>
      </div>
    </div>
  );
}

const dateBtn = {
  height: 36,
  padding: "0 10px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 900,
};

const dateInput = {
  height: 36,
  padding: "0 8px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
};

const summaryRight = {
  marginLeft: "auto",
  fontSize: 12,
  color: "#6b7280",
};

function tabBtn(active) {
  return {
    flex: 1,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#111827",
    fontWeight: 900,
  };
}

const bottomTabs = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  height: 56,
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  background: "#fff",
  borderTop: "1px solid #e5e7eb",
  zIndex: 20,
};

const bottomTabBtn = {
  border: "none",
  background: "transparent",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
};

const bottomTabActive = {
  color: "#111827",
};

const bottomTabIcon = {
  fontSize: 20,
  lineHeight: "20px",
};

const bottomTabDivider = {
  borderLeft: "1px solid #e5e7eb",
};

const actionBar = {
  position: "fixed",
  left: 16,
  right: 16,
  bottom: 72,
  display: "grid",
  gridTemplateColumns: "1.3fr 1fr 1fr",
  gap: 6,
  zIndex: 25,
};

const actionBtnBase = {
  height: 44,
  borderRadius: 12,
  fontWeight: 800,
  border: "1px solid transparent",
};

const actionBtnPrimary = {
  ...actionBtnBase,
  background: "#111827",
  color: "#fff",
};

const actionBtnSecondary = {
  ...actionBtnBase,
  background: "#fff",
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const actionBtnDanger = {
  ...actionBtnBase,
  background: "#ef4444",
  color: "#fff",
  border: "1px solid #ef4444",
};

const actionBtnGhost = {
  ...actionBtnBase,
  background: "#fff",
  color: "#475569",
  border: "1px solid #e2e8f0",
};

const invBtnBase = {
  ...actionBtnBase,
  border: "1px solid transparent",
};

const invBtnIn = {
  ...invBtnBase,
  background: "#16a34a",
  color: "#fff",
  border: "1px solid #16a34a",
};

const invBtnOut = {
  ...invBtnBase,
  background: "#ef4444",
  color: "#fff",
  border: "1px solid #ef4444",
};

const invBtnAdjust = {
  ...invBtnBase,
  background: "#0ea5e9",
  color: "#fff",
  border: "1px solid #0ea5e9",
};

const panel = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

const chatPanel = {
  ...panel,
  minHeight: "70vh",
  display: "flex",
  flexDirection: "column",
};

const panelTitle = {
  fontWeight: 900,
  marginBottom: 6,
  color: "#111827",
  fontSize: 14,
};

const inventoryRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
};

const inventoryHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
};

const inventoryTitle = {
  fontWeight: 900,
  color: "#111827",
  marginBottom: 6,
};

const inventoryQty = {
  fontWeight: 800,
  color: "#111827",
};

const inventoryQtyLow = {
  fontWeight: 900,
  color: "#ef4444",
};

const inventoryGroup = {
  marginTop: 6,
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const inventoryGroupLow = {
  ...inventoryGroup,
  color: "#ef4444",
};

const movementRow = {
  display: "grid",
  gap: 4,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
};

const movementTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 4,
};

const movementMeta = {
  fontSize: 11,
  color: "#6b7280",
};

const movementUser = {
  color: "#0f172a",
};

const movementItem = {
  color: "#0f172a",
};

const movementQty = {
  color: "#111827",
  fontWeight: 900,
};

const movementFilterRow = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  marginBottom: 8,
};

const movementFilterLabel = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  color: "#475569",
  fontWeight: 700,
};

const movementFilterInput = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
};

const movementFilterClear = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#475569",
  fontWeight: 700,
  padding: "0 12px",
};

const chatList = {
  display: "grid",
  gap: 10,
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  padding: "4px 2px",
};

const chatRow = {
  display: "grid",
  gap: 4,
  justifyItems: "start",
};

const chatRowSelf = {
  display: "grid",
  gap: 4,
  justifyItems: "end",
};

const chatBubble = {
  maxWidth: "80%",
  background: "#f1f5f9",
  border: "1px solid #e5e7eb",
  padding: "8px 10px",
  borderRadius: 12,
  color: "#111827",
};

const chatBubbleSelf = {
  maxWidth: "80%",
  background: "#111827",
  border: "1px solid #111827",
  padding: "8px 10px",
  borderRadius: 12,
  color: "#fff",
};

const chatHeader = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const chatHeaderSelf = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexDirection: "row-reverse",
};

const chatAvatar = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#e2e8f0",
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const chatAvatarSelf = {
  ...chatAvatar,
  background: "#111827",
  color: "#fff",
};

const chatName = {
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
};

const chatText = {
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const chatTime = {
  fontSize: 11,
  color: "#6b7280",
};

const chatTimeRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const chatReplyBtn = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
};

const chatInputRow = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto auto",
  gap: 8,
};

const chatComposer = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

const chatInputStyle = {
  height: 40,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "0 12px",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
};

const chatSendBtn = {
  height: 40,
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  padding: "0 12px",
  minWidth: 40,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const chatAttachBtn = {
  height: 40,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  padding: "0 12px",
  minWidth: 40,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const chatAttachIcon = {
  fontSize: 16,
};

const chatSendIcon = {
  fontSize: 16,
};

const chatCameraBtn = {
  ...chatAttachBtn,
  border: "1px solid #cbd5f5",
};

const chatCameraIcon = {
  fontSize: 16,
};

const chatReplyBadge = {
  borderLeft: "3px solid #94a3b8",
  paddingLeft: 8,
  marginBottom: 6,
  color: "#475569",
  fontSize: 11,
  display: "grid",
  gap: 2,
};

const chatReplyLabel = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const chatReplyText = {
  fontSize: 11,
  fontWeight: 700,
  color: "#334155",
};

const chatReplyPreview = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const chatReplyPreviewLabel = {
  fontSize: 11,
  fontWeight: 800,
  color: "#475569",
};

const chatReplyPreviewText = {
  fontSize: 12,
  fontWeight: 700,
  color: "#0f172a",
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const chatReplyCancel = {
  height: 28,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#ef4444",
  fontWeight: 800,
  padding: "0 8px",
  cursor: "pointer",
};

const chatPreviewList = {
  display: "grid",
  gap: 6,
  marginTop: 8,
};

const chatPreviewItem = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px dashed #e5e7eb",
  background: "#f8fafc",
};

const chatPreviewName = {
  fontSize: 12,
  color: "#334155",
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const chatPreviewRemove = {
  height: 28,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#ef4444",
  fontWeight: 800,
  padding: "0 8px",
  cursor: "pointer",
};

const chatMediaList = {
  display: "grid",
  gap: 8,
  marginTop: 8,
};

const chatMediaItem = {
  display: "flex",
  justifyContent: "flex-start",
};

const chatImageBtn = {
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const chatImage = {
  maxWidth: "220px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const chatVideo = {
  maxWidth: "240px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const chatFileBadge = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  fontSize: 12,
  fontWeight: 700,
  color: "#334155",
};

const imageOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
  padding: 16,
};

const imageModal = {
  width: "100%",
  maxWidth: 720,
  background: "#0f172a",
  borderRadius: 16,
  padding: 12,
  display: "grid",
  gap: 10,
};

const imagePreview = {
  width: "100%",
  maxHeight: "70vh",
  objectFit: "contain",
  borderRadius: 12,
  background: "#0f172a",
};

const imageActions = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const imageDownloadBtn = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #16a34a",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 800,
  padding: "0 12px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const imageCloseBtn = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  padding: "0 12px",
};

function getKanaGroup(name) {
  const ch = (name ?? "").trim()[0];
  if (!ch) return "";
  if ((name ?? "").startsWith("農薬")) return "ナ行";
  const kata = toKatakana(ch);
  if ("アイウエオ".includes(kata)) return "ア行";
  if ("カキクケコガギグゲゴ".includes(kata)) return "カ行";
  if ("サシスセソザジズゼゾ".includes(kata)) return "サ行";
  if ("タチツテトダヂヅデド".includes(kata)) return "タ行";
  if ("ナニヌネノ".includes(kata)) return "ナ行";
  if ("ハヒフヘホバビブベボパピプペポ".includes(kata)) return "ハ行";
  if ("マミムメモ".includes(kata)) return "マ行";
  if ("ヤユヨ".includes(kata)) return "ヤ行";
  if ("ラリルレロ".includes(kata)) return "ラ行";
  if ("ワヲン".includes(kata)) return "ワ行";
  return "";
}

function toKatakana(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0x3041 && code <= 0x3096) {
    return String.fromCharCode(code + 0x60);
  }
  return ch;
}

function getGroupOrder(group) {
  const order = {
    "ア行": 1,
    "カ行": 2,
    "サ行": 3,
    "タ行": 4,
    "ナ行": 5,
    "ハ行": 6,
    "マ行": 7,
    "ヤ行": 8,
    "ラ行": 9,
    "ワ行": 10,
    "": 99,
  };
  return order[group] ?? 99;
}

function getMovementTypeLabel(type) {
  if (type === "in") return "入庫";
  if (type === "out") return "出庫";
  if (type === "adjust") return "棚卸し";
  return "更新";
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ja-JP", { hour12: false });
}

function formatQuantity(value) {
  if (value === null || value === undefined || value === "") return "0";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (Number.isInteger(num)) return String(num);
  return String(num);
}

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 30,
  padding: 16,
};

const modalCard = {
  width: "100%",
  maxWidth: 420,
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  display: "grid",
  gap: 10,
};

const modalLabel = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  color: "#475569",
  fontWeight: 700,
};

const modalSelect = {
  height: 40,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
};

const modalInput = {
  height: 40,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
};

const modalTextarea = {
  minHeight: 80,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "8px 10px",
  background: "#fff",
  color: "#111827",
  fontWeight: 600,
  resize: "vertical",
};

const modalCancelBtn = {
  flex: 1,
  height: 44,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
};

const modalStartBtn = {
  flex: 1,
  height: 44,
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
};

const modalSkipBtn = {
  height: 32,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#475569",
  fontWeight: 700,
};
