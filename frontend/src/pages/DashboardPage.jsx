import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FieldTimeline from "../components/FieldTimeline";
import { ymd } from "../lib/time";
import topLogoImage from "../assets/logo.jpg";

const BASE_URL = "http://127.0.0.1:8000";
const TOP_LOGO_SRC = topLogoImage;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("date");
    return d ? new Date(`${d}T00:00:00`) : new Date();
  });
  const role = window.localStorage.getItem("role") || "worker"; // admin | worker
  const [profileForm, setProfileForm] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("profile") || "{}");
      return {
        name: saved?.name ?? "",
        email: saved?.email ?? "",
        note: saved?.note ?? "",
        avatar: saved?.avatar ?? "",
        userId: saved?.userId ?? "",
      };
    } catch {
      return { name: "", email: "", note: "", avatar: "", userId: "" };
    }
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveErr, setProfileSaveErr] = useState("");
  const [passwordRequestStatus, setPasswordRequestStatus] = useState("");
  const [mainTab, setMainTab] = useState("logs"); // logs | inventory | daily | temperature | invite | settings
  const [inventoryTab, setInventoryTab] = useState("items"); // items | history
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const dateYmd = useMemo(() => ymd(date), [date]);
  const weekdayLabel = useMemo(() => {
    const d = new Date(`${dateYmd}T00:00:00`);
    const labels = ["日", "月", "火", "水", "木", "金", "土"];
    return Number.isNaN(d.getTime()) ? "" : labels[d.getDay()];
  }, [dateYmd]);
  const dateWithWeekday = weekdayLabel ? `${dateYmd} (${weekdayLabel})` : dateYmd;
  const dateDisplay = useMemo(() => {
    const d = new Date(`${dateYmd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateWithWeekday;
    return `${d.getFullYear()}年 ${d.getMonth() + 1}月 ${d.getDate()}日 (${weekdayLabel})`;
  }, [dateYmd, dateWithWeekday, weekdayLabel]);
  const monthDays = useMemo(() => {
    const d = new Date(`${dateYmd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return [];
    const year = d.getFullYear();
    const month = d.getMonth();
    const last = new Date(year, month + 1, 0).getDate();
    const labels = ["日", "月", "火", "水", "木", "金", "土"];
    return Array.from({ length: last }, (_, i) => {
      const day = i + 1;
      const current = new Date(year, month, day);
      return {
        dateKey: ymd(current),
        label: `${day}日 (${labels[current.getDay()]})`,
      };
    });
  }, [dateYmd]);
  const tempMonthKey = useMemo(() => dateYmd.slice(0, 7), [dateYmd]);

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
  const [dailyWeather, setDailyWeather] = useState("");
  const [dailyNote, setDailyNote] = useState("");
  const [dailyAttendance, setDailyAttendance] = useState("");
  const [dailyWorkContent, setDailyWorkContent] = useState("");
  const [dailyAttendanceTouched, setDailyAttendanceTouched] = useState(false);
  const [dailyWorkContentTouched, setDailyWorkContentTouched] = useState(false);
  const [dailySaving, setDailySaving] = useState(false);
  const [dailySaveMsg, setDailySaveMsg] = useState("");
  const [tempSaving, setTempSaving] = useState(false);
  const [tempSaveMsg, setTempSaveMsg] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const defaultTempLocations = [
    "バナナ庫",
    "外気温",
    "2連棟",
    "3連右棟",
    "3連中棟",
    "3連左棟",
    "単連",
  ];
  const [tempLocations, setTempLocations] = useState(
    defaultTempLocations.map((name, index) => ({ id: null, name, sort_order: index }))
  );
  const tempLocationNames = useMemo(() => tempLocations.map((location) => location.name), [tempLocations]);
  const tempTimes = ["08:00", "12:00", "17:00"];
  const [tempTimeTab, setTempTimeTab] = useState(tempTimes[0]);
  const [tempLocationTab, setTempLocationTab] = useState(defaultTempLocations[0]);
  const [tempInputs, setTempInputs] = useState(() =>
    Object.fromEntries(defaultTempLocations.map((name) => [name, {}]))
  );
  const [stockAdjustForm, setStockAdjustForm] = useState({ item_id: "", quantity: "" });
  const [stockAdjustErr, setStockAdjustErr] = useState("");
  const [stockAdjustLoading, setStockAdjustLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState("worker");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteErr, setInviteErr] = useState("");
  const [inviteResult, setInviteResult] = useState(null);

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
    const loadTempLocations = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/temperature-locations`, {
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
        const locations = Array.isArray(json?.locations) ? json.locations : [];
        if (locations.length > 0) {
          setTempLocations(locations);
          setTempLocationTab((prev) =>
            prev && locations.some((loc) => loc.name === prev) ? prev : locations[0].name
          );
        }
      } catch {
        // keep default locations when API is unavailable
      }
    };

    loadTempLocations();
  }, []);

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
    const displayName = profileForm.name || "自分";
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: displayName,
        avatar: profileForm.avatar || "",
        isSelf: true,
        text,
        time,
        files,
        replyTo: chatReplyTo,
      },
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

  const handleProfileSave = async () => {
    setProfileSaveErr("");
    setProfileSaving(true);
    window.localStorage.setItem("profile", JSON.stringify(profileForm));
    try {
      if (profileForm.userId) {
        const res = await fetch(`${BASE_URL}/api/users/${profileForm.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: profileForm.name }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message ?? `HTTP ${res.status}`);
        }
      }
      await load();
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 1500);
    } catch (e) {
      setProfileSaveErr(String(e?.message ?? e));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfileForm((s) => ({ ...s, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordRequest = () => {
    if (!profileForm.email) {
      setPasswordRequestStatus("メールアドレスを入力してください");
      return;
    }
    setPasswordRequestStatus("パスワード変更メールを送信しました（仮）");
    window.setTimeout(() => setPasswordRequestStatus(""), 2000);
  };

  const handleInviteCreate = async () => {
    setInviteErr("");
    setInviteLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      const inviteUrl = `${window.location.origin}/invite/${json.token}`;
      setInviteResult({ token: json.token, inviteUrl });
    } catch (e) {
      setInviteErr(String(e?.message ?? e));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteCopy = async () => {
    if (!inviteResult?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteResult.inviteUrl);
      setInviteResult((prev) => (prev ? { ...prev, copied: true } : prev));
      window.setTimeout(() => {
        setInviteResult((prev) => (prev ? { ...prev, copied: false } : prev));
      }, 1500);
    } catch {
      setInviteErr("コピーに失敗しました。手動でコピーしてください。");
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("profile");
    window.localStorage.removeItem("role");
    setProfileForm({ name: "", email: "", note: "", avatar: "" });
    navigate("/login");
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
    .map((sec) => ({
      ...sec,
      logs: (sec.logs ?? []).filter((log) => ["running", "paused"].includes(log.status)),
    }))
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

  const dailySummary = useMemo(() => {
    const allLogs = [...activeLogs, ...doneLogs];
    const members = Array.from(new Set(allLogs.map((log) => log.user?.name).filter(Boolean)));
    const tasks = Array.from(new Set(allLogs.map((log) => log.task_type?.name).filter(Boolean)));
    const workLines = allLogs.map((log) => ({
      field: log.field?.name ?? "圃場",
      task: log.task_type?.name ?? "作業",
      user: log.user?.name ?? "作業者",
    }));
    return { members, tasks, workLines };
  }, [activeLogs, doneLogs]);
  const workContentText = useMemo(() => {
    if (dailySummary.workLines.length === 0) return "";
    return dailySummary.workLines.map((line) => `・${line.field} ${line.task}（${line.user}）`).join("\n");
  }, [dailySummary.workLines]);
  useEffect(() => {
    if (!dailyAttendanceTouched) {
      setDailyAttendance(dailySummary.members.join("・"));
    }
    if (!dailyWorkContentTouched) {
      setDailyWorkContent(workContentText);
    }
  }, [dailySummary.members, dailyAttendanceTouched, dailyWorkContentTouched, workContentText]);
  useEffect(() => {
    let cancelled = false;

    const resetDaily = () => {
      setDailyWeather("");
      setDailyNote("");
      setDailyAttendanceTouched(false);
      setDailyWorkContentTouched(false);
    };

    const loadDailyReport = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/daily-reports?date=${dateYmd}`, {
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);

        if (cancelled) return;

        if (json?.report) {
          setDailyWeather(json.report.weather ?? "");
          setDailyNote(json.report.note ?? "");
          setDailyAttendance(json.report.attendance ?? "");
          setDailyWorkContent(json.report.work_content ?? "");
          setDailyAttendanceTouched(true);
          setDailyWorkContentTouched(true);
        } else {
          resetDaily();
        }
      } catch {
        if (!cancelled) {
          resetDaily();
          setDailySaveMsg("読み込みに失敗しました");
        }
      }
    };

    loadDailyReport();
    setDailySaveMsg("");

    return () => {
      cancelled = true;
    };
  }, [dateYmd]);
  useEffect(() => {
    let cancelled = false;

    const splitDateTime = (value) => {
      const text = String(value ?? "");
      if (!text) return { dateKey: "", timeKey: "" };
      const [datePart, timePart] = text.includes("T") ? text.split("T") : text.split(" ");
      if (!datePart || !timePart) return { dateKey: "", timeKey: "" };
      return { dateKey: datePart, timeKey: timePart.slice(0, 5) };
    };

    const locationNames = tempLocationNames;
    const blankInputs = Object.fromEntries(locationNames.map((name) => [name, {}]));
    setTempInputs(blankInputs);
    setTempSaveMsg("");

    const loadTemperature = async () => {
      if (tempLocations.length === 0) return;
      try {
        const results = await Promise.all(
          tempLocations.map(async (location) => {
            if (!location.id) return { name: location.name, readings: [] };
            const res = await fetch(
              `${BASE_URL}/api/temperature-readings?location_id=${location.id}&month=${tempMonthKey}`,
              { headers: { Accept: "application/json" } }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
            return {
              name: location.name,
              readings: Array.isArray(json?.readings) ? json.readings : [],
            };
          })
        );

        if (cancelled) return;

        const nextInputs = Object.fromEntries(locationNames.map((name) => [name, {}]));
        results.forEach(({ name, readings }) => {
          if (!Array.isArray(readings)) return;
          readings.forEach((row) => {
            const { dateKey, timeKey } = splitDateTime(row.measured_at);
            if (!dateKey || !timeKey) return;
            if (!nextInputs[name][dateKey]) nextInputs[name][dateKey] = {};
            nextInputs[name][dateKey][timeKey] = {
              temp: row.temperature ?? "",
              humidity: row.humidity ?? "",
            };
          });
        });

        setTempInputs(nextInputs);
      } catch {
        if (!cancelled) setTempSaveMsg("読み込みに失敗しました");
      }
    };

    loadTemperature();

    return () => {
      cancelled = true;
    };
  }, [tempMonthKey, tempLocations, tempLocationNames]);

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

  const handleDailyDownload = () => {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const membersText = dailyAttendance ? dailyAttendance : "該当なし";
    const workContentValue = dailyWorkContent ? dailyWorkContent : "該当なし";

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>日報 ${escapeHtml(dateDisplay)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #111827; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    .section { margin-bottom: 16px; }
    .label { font-weight: 700; margin-bottom: 6px; }
    .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; background: #fff; }
    ul { margin: 6px 0 0 18px; padding: 0; }
    li { margin: 2px 0; }
    .note { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>日報（${escapeHtml(dateDisplay)}）</h1>
  <div class="section">
    <div class="label">今日の日付</div>
    <div class="box">${escapeHtml(dateDisplay)}</div>
  </div>
  <div class="section">
    <div class="label">今日の天気</div>
    <div class="box">${escapeHtml(dailyWeather || "未入力")}</div>
  </div>
  <div class="section">
    <div class="label">今日の出勤メンバー</div>
    <div class="box">${escapeHtml(membersText)}</div>
  </div>
  <div class="section">
    <div class="label">作業内容</div>
    <div class="box note">${escapeHtml(workContentValue)}</div>
  </div>
  <div class="section">
    <div class="label">報連相</div>
    <div class="box note">${escapeHtml(dailyNote || "未入力")}</div>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDailySave = async () => {
    setDailySaving(true);
    setDailySaveMsg("");
    try {
      const res = await fetch(`${BASE_URL}/api/daily-reports`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateYmd,
          weather: dailyWeather,
          attendance: dailyAttendance,
          work_content: dailyWorkContent,
          note: dailyNote,
          created_by_user_id: profileForm.userId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);

      setDailySaveMsg("保存しました");
      window.setTimeout(() => setDailySaveMsg(""), 1500);
    } catch {
      setDailySaveMsg("保存に失敗しました");
    } finally {
      setDailySaving(false);
    }
  };

  const handleTempSave = async () => {
    const toNumberOrNull = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    setTempSaving(true);
    setTempSaveMsg("");
    try {
      const tasks = tempLocations.map(async (location) => {
        if (!location.id) return;
        const locationData = tempInputs[location.name] ?? {};
        const readings = [];

        Object.entries(locationData).forEach(([dateKey, times]) => {
          Object.entries(times ?? {}).forEach(([timeKey, entry]) => {
            readings.push({
              measured_at: `${dateKey}T${timeKey}:00`,
              temperature: toNumberOrNull(entry?.temp),
              humidity: toNumberOrNull(entry?.humidity),
            });
          });
        });

        const res = await fetch(`${BASE_URL}/api/temperature-readings/batch`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            location_id: location.id,
            readings,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      });

      await Promise.all(tasks);
      setTempSaveMsg("保存しました");
      window.setTimeout(() => setTempSaveMsg(""), 1500);
    } catch {
      setTempSaveMsg("保存に失敗しました");
    } finally {
      setTempSaving(false);
    }
  };

  const updateTempInput = (location, dateKey, timeKey, field, value) => {
    setTempInputs((prev) => {
      const locationData = prev[location] ?? {};
      const dayData = locationData[dateKey] ?? {};
      const entry = dayData[timeKey] ?? { temp: "", humidity: "" };
      return {
        ...prev,
        [location]: {
          ...locationData,
          [dateKey]: {
            ...dayData,
            [timeKey]: { ...entry, [field]: value },
          },
        },
      };
    });
  };

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

  const renderSectionTitle = (text) => (
    <div style={sectionTitleRow}>
      <div style={sectionTitleTab}>{text}</div>
      <div style={sectionTitleLine} />
    </div>
  );

  const tempDateColWidth = isMobile ? 90 : 120;
  const tempDateCellStyle = isMobile ? { ...tempDateCell, padding: "6px 6px", fontSize: 11 } : tempDateCell;
  const tempValueCellStyle = isMobile ? { ...tempValueCell, padding: "6px 6px", gap: 4 } : tempValueCell;
  const tempCellInputStyle = isMobile ? { ...tempCellInput, height: 28, fontSize: 11, padding: "0 6px" } : tempCellInput;

  const renderMobileStatus = (status) => {
    if (status === "done") return { label: "完了", style: mobileLogStatusDone };
    if (status === "paused") return { label: "中断中", style: mobileLogStatusPaused };
    return { label: "進行中", style: mobileLogStatusRunning };
  };

  const headerControlsStyle = isMobile
    ? { padding: 12, display: "flex", alignItems: "center", gap: 6, maxWidth: "100%", margin: "0 auto" }
    : { padding: 12, display: "flex", alignItems: "center", gap: 10, maxWidth: 560, margin: "0 auto" };

  const dateInputStyle = isMobile ? { ...dateInput, width: "100%", minWidth: 0 } : dateInput;
  const dateBtnStyle = isMobile ? { ...dateBtn, padding: "0 8px", height: 34 } : dateBtn;
  const topBarInnerStyle = isMobile ? { ...topBarInner, maxWidth: "100%", padding: "0 8px" } : topBarInner;
  const bottomTabBtnStyle = isMobile ? { ...bottomTabBtn, fontSize: 10 } : bottomTabBtn;
  const bottomTabIconStyle = isMobile ? { ...bottomTabIcon, fontSize: 18, lineHeight: "18px" } : bottomTabIcon;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 144 }}>
      <div style={topBar}>
        <div style={topBarInnerStyle}>
          <div style={topLogo}>
            <img src={TOP_LOGO_SRC} alt="別府温泉フルーツファーム" style={topLogoImg} />
          </div>
          <button
            onClick={() => setMainTab("settings")}
            style={{ ...topSettingsBtn, ...(mainTab === "settings" ? topSettingsBtnActive : null) }}
          >
            ⚙️
          </button>
        </div>
      </div>
      {/* Header */}
      {mainTab === "logs" && (
        <div style={{ position: "sticky", top: 52, zIndex: 10, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={headerControlsStyle}>
            <button onClick={() => setDate(new Date(date.getTime() - 86400000))} style={dateBtnStyle}>
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
                style={dateInputStyle}
              />
            </div>
            <button onClick={() => setDate(new Date(date.getTime() + 86400000))} style={dateBtnStyle}>
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

            {isMobile
              ? sections.map((sec) => (
                  <div key={`${tab}-${sec.field?.id ?? Math.random()}`} style={mobileSection}>
                    <div style={mobileSectionTitle}>{sec.field?.name ?? "圃場"}</div>
                    {(!sec.logs || sec.logs.length === 0) && <div style={mobileLogEmpty}>この圃場のログはありません</div>}
                    <div style={{ display: "grid", gap: 8 }}>
                      {(sec.logs ?? []).map((log) => {
                        const { label, style } = renderMobileStatus(log.status);
                        return (
                          <div key={log.id} style={mobileLogCard}>
                            <div style={mobileLogHeader}>
                              <div style={mobileLogName}>{log.user?.name ?? "?"}</div>
                              <div style={{ ...mobileLogStatus, ...style }}>{label}</div>
                            </div>
                            <div style={mobileLogSub}>{log.task_type?.name ?? "作業"}</div>
                            <div style={mobileLogTime}>
                              作業時間：{log.started_time ?? "--:--"} → {log.ended_time ?? "--:--"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              : sections.map((sec) => (
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
          <div style={sectionBlock}>
            <div style={inventoryTabRow}>
              <button style={tabBtn(inventoryTab === "items")} onClick={() => setInventoryTab("items")}>
                在庫管理
              </button>
              <button style={tabBtn(inventoryTab === "history")} onClick={() => setInventoryTab("history")}>
                入出庫・棚卸し履歴
              </button>
            </div>

            {inventoryTab === "items" && (
              <div style={panelWithTab}>
                {inventoryErr && <div style={{ color: "#b91c1c", fontSize: 12 }}>{inventoryErr}</div>}
                {inventoryLoading && <div style={{ color: "#6b7280", fontSize: 12 }}>読み込み中...</div>}
                {!inventoryLoading && inventoryItems.length === 0 && (
                  <div style={{ color: "#6b7280", fontSize: 12 }}>在庫データがありません</div>
                )}
                {!inventoryLoading &&
                  inventoryItems.length > 0 &&
                  (() => {
                    const lowItems = inventoryItems.filter((i) => Number(i.quantity) <= 1);
                    const normalItems = inventoryItems.filter((i) => Number(i.quantity) > 1);
                    return (
                      <>
                      <div style={inventoryHeader}>
                        <div>{lowItems.length > 0 ? <span style={inventoryGroupLowInline}>残り少</span> : ""}</div>
                          <div>在庫数</div>
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
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
                        </div>
                      </>
                    );
                  })()}
              </div>
            )}

            {inventoryTab === "history" && (
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
            )}
          </div>
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

        {mainTab === "daily" && (
          <div style={sectionBlock}>
            {renderSectionTitle("日報作成")}
            <div style={panelWithTab}>
              <div style={dailySheet}>
                <div style={dailyHeaderRow}>
                  <div style={dailyDateBlock}>
                    <div style={dailyDateInputRow}>
                      <input
                        type="date"
                        value={dateYmd}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setDate(new Date(`${e.target.value}T00:00:00`));
                        }}
                        onFocus={(e) => {
                          if (e.target.showPicker) e.target.showPicker();
                        }}
                        style={dailyDateInput}
                        aria-label="日報の日付"
                      />
                      <div style={dailyDateWeekday}>({weekdayLabel})</div>
                    </div>
                  </div>
                  <div style={dailyWeatherRow}>
                    <span style={dailyLabel}>天気:</span>
                    <input
                      type="text"
                      value={dailyWeather}
                      onChange={(e) => setDailyWeather(e.target.value)}
                      style={dailyInlineInput}
                      placeholder="晴れ"
                    />
                  </div>
                </div>
                <div style={dailyAttendanceRow}>
                  <span style={dailyLabel}>出勤:</span>
                  <input
                    type="text"
                    value={dailyAttendance}
                    onChange={(e) => {
                      setDailyAttendanceTouched(true);
                      setDailyAttendance(e.target.value);
                    }}
                    style={dailyAttendanceInput}
                    placeholder="出勤メンバーを入力"
                  />
                </div>
                <div style={dailyBox}>
                  <div style={dailyBoxTitle}>作業内容</div>
                  <textarea
                    value={dailyWorkContent}
                    onChange={(e) => {
                      setDailyWorkContentTouched(true);
                      setDailyWorkContent(e.target.value);
                    }}
                    style={{ ...dailyRuledTextarea, minHeight: 260 }}
                    placeholder="作業内容を入力"
                  />
                </div>
                <div style={dailyBox}>
                  <div style={dailyBoxTitle}>報・連・相</div>
                  <textarea
                    value={dailyNote}
                    onChange={(e) => setDailyNote(e.target.value)}
                    style={{ ...dailyRuledTextarea, minHeight: 160 }}
                    placeholder="共有事項を入力"
                  />
                </div>
                <div style={settingsRow}>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {dailySaveMsg || "PDFはブラウザの印刷機能で保存します。"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mainTab === "temperature" && (
          <div style={sectionBlock}>
            {renderSectionTitle("温度計測")}
            <div style={panelWithTab}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  計測時刻は 8:00 / 12:00 / 17:00 です。場所タブを切り替えて入力してください。
                </div>
                <div style={tempDateRow}>
                  <span style={tempDateLabel}>対象日</span>
                  <input
                    type="date"
                    value={dateYmd}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setDate(new Date(`${e.target.value}T00:00:00`));
                    }}
                    onFocus={(e) => {
                      if (e.target.showPicker) e.target.showPicker();
                    }}
                    style={tempDateInput}
                  />
                  <div style={tempDateWeekday}>({weekdayLabel})</div>
                </div>
                <div style={tempTabRow}>
                  {tempLocations.map((location) => (
                    <button
                      key={location.id ?? location.name}
                      type="button"
                      onClick={() => setTempLocationTab(location.name)}
                      style={{
                        ...tempTabBtn,
                        ...(tempLocationTab === location.name ? tempTabBtnActive : null),
                      }}
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
                {isMobile && (
                  <div style={tempTimeTabRow}>
                    {tempTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setTempTimeTab(time)}
                        style={{
                          ...tempTabBtn,
                          ...(tempTimeTab === time ? tempTabBtnActive : null),
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
                <div style={tempTableWrap}>
                  <div style={{ ...tempTable, ...(isMobile ? { minWidth: 320 } : null) }}>
                    <div
                      style={{
                        ...tempTableHeader,
                        gridTemplateColumns: `${tempDateColWidth}px repeat(${(isMobile ? 1 : tempTimes.length)}, 1fr)`,
                      }}
                    >
                      <div style={tempCornerCell}>日付</div>
                      {(isMobile ? [tempTimeTab] : tempTimes).map((time) => (
                        <div key={time} style={tempTimeHeader}>
                          <div style={tempTimeLabel}>{time}</div>
                          <div style={tempSubHeader}>
                            <span>温度</span>
                            <span>湿度</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {monthDays.map((day) => {
                      const dayData = tempInputs[tempLocationTab]?.[day.dateKey] ?? {};
                      return (
                        <div
                          key={day.dateKey}
                          style={{
                            ...tempTableRow,
                            gridTemplateColumns: `${tempDateColWidth}px repeat(${(isMobile ? 1 : tempTimes.length)}, 1fr)`,
                          }}
                        >
                          <div style={tempDateCellStyle}>{day.label}</div>
                          {(isMobile ? [tempTimeTab] : tempTimes).map((time) => {
                            const entry = dayData[time] ?? { temp: "", humidity: "" };
                            return (
                              <div key={`${day.dateKey}-${time}`} style={tempValueCellStyle}>
                                <input
                                  type="text"
                                  value={entry.temp}
                                  onChange={(e) =>
                                    updateTempInput(tempLocationTab, day.dateKey, time, "temp", e.target.value)
                                  }
                                  style={tempCellInputStyle}
                                  placeholder="温度"
                                />
                                <input
                                  type="text"
                                  value={entry.humidity}
                                  onChange={(e) =>
                                    updateTempInput(tempLocationTab, day.dateKey, time, "humidity", e.target.value)
                                  }
                                  style={tempCellInputStyle}
                                  placeholder="湿度"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={settingsRow}>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {tempSaveMsg || "保存ボタンで月ごとの入力内容を保存します。"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mainTab === "invite" && role === "admin" && (
          <div style={sectionBlock}>
            {renderSectionTitle("招待")}
            <div style={panelWithTab}>
              <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
                招待リンクを作成して作業者/管理者を追加します。
              </div>
              <div style={settingsGrid}>
                <label style={settingsLabel}>
                  権限
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={settingsInput}
                  >
                    <option value="worker">作業者</option>
                    <option value="admin">管理者</option>
                  </select>
                </label>
              </div>
              {inviteErr && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{inviteErr}</div>}
              {inviteResult?.inviteUrl && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>招待URL</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <input value={inviteResult.inviteUrl} readOnly style={settingsInput} />
                    <button style={settingsSaveBtn} onClick={handleInviteCopy}>
                      {inviteResult.copied ? "コピーしました" : "コピー"}
                    </button>
                  </div>
                </div>
              )}
              <div style={settingsRow}>
                <div style={{ color: "#6b7280", fontSize: 12 }} />
                <button style={settingsSaveBtn} onClick={handleInviteCreate} disabled={inviteLoading}>
                  {inviteLoading ? "作成中..." : "招待リンクを作成"}
                </button>
              </div>
            </div>
          </div>
        )}

        {mainTab === "settings" && (
          <div style={sectionBlock}>
            {renderSectionTitle("会員情報")}
            <div style={panelWithTab}>
              <div style={panelTitle}>基本情報</div>
              <div style={settingsGrid}>
                <label style={settingsLabel}>
                  氏名
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))}
                    style={settingsInput}
                    placeholder="例: 山田 太郎"
                  />
                </label>
                <label style={settingsLabel}>
                  アイコン
                  <div style={avatarRow}>
                    <div style={avatarPreview}>
                      {profileForm.avatar ? (
                        <img src={profileForm.avatar} alt="アイコン" style={avatarImage} />
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
                      {profileForm.avatar && (
                        <button
                          type="button"
                          style={avatarRemoveBtn}
                          onClick={() => setProfileForm((s) => ({ ...s, avatar: "" }))}
                        >
                          画像を削除
                        </button>
                      )}
                    </div>
                  </div>
                </label>
                <label style={settingsLabel}>
                  メールアドレス
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((s) => ({ ...s, email: e.target.value }))}
                    style={settingsInput}
                    placeholder="example@example.com"
                  />
                </label>
                <label style={settingsLabel}>
                  メモ
                  <textarea
                    value={profileForm.note}
                    onChange={(e) => setProfileForm((s) => ({ ...s, note: e.target.value }))}
                    style={settingsTextarea}
                    placeholder="連絡事項や所属など"
                  />
                </label>
              </div>
              {profileSaveErr && <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 6 }}>{profileSaveErr}</div>}
              <div style={settingsRow}>
                <div style={settingsHint}>
                  役割: <span style={settingsBadge}>{role === "admin" ? "管理者" : "作業者"}</span>
                </div>
                <button style={settingsSaveBtn} onClick={handleProfileSave} disabled={profileSaving}>
                  {profileSaving ? "保存中..." : profileSaved ? "保存しました" : "保存"}
                </button>
              </div>
            </div>

            <div style={panel}>
              <div style={panelTitle}>パスワード変更</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
                登録済みメールアドレス宛に変更用URLを送信します。
              </div>
              {passwordRequestStatus && (
                <div style={{ color: "#0f172a", fontSize: 12, marginBottom: 6 }}>{passwordRequestStatus}</div>
              )}
              <div style={settingsRow}>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  宛先: {profileForm.email || "未入力"}
                </div>
                <button style={settingsSaveBtn} onClick={handlePasswordRequest}>
                  変更メールを送る
                </button>
              </div>
            </div>

            <div style={panel}>
              <div style={panelTitle}>ログアウト</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
                この端末のログイン情報を削除して、ログイン画面に戻ります。
              </div>
              <div style={settingsRow}>
                <div style={{ color: "#6b7280", fontSize: 12 }} />
                <button style={settingsSaveBtn} onClick={handleLogout}>
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {mainTab === "logs" && (
        <div
          style={{
            ...actionBar,
            ...(isMobile ? { left: 10, right: 10 } : null),
            gridTemplateColumns: isMobile
              ? tab === "done"
                ? "1.2fr 0.8fr"
                : "1.6fr 0.7fr 0.7fr"
              : tab === "done"
                ? "1.6fr 0.8fr"
                : "1.8fr 0.6fr 0.6fr",
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
                {currentActiveLog?.status === "paused" ? "再開" : "中断"}
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
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>棚卸し</div>
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
        <div
          style={{
            ...actionBar,
            ...(isMobile ? { left: 10, right: 10 } : null),
            gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "1.3fr 1.3fr 0.4fr",
          }}
        >
          <button style={invBtnIn} onClick={openStockIn}>
            入庫
          </button>
          <button style={invBtnOut} onClick={openStockOut}>
            出庫
          </button>
          <button style={invBtnAdjust} onClick={openStockAdjust}>
            棚卸し
          </button>
        </div>
      )}

      {/* Daily Report Action Bar */}
      {mainTab === "daily" && (
        <div
          style={{
            ...actionBar,
            ...(isMobile ? { left: 10, right: 10 } : null),
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <button style={actionBtnPrimary} onClick={handleDailySave} disabled={dailySaving}>
            {dailySaving ? "保存中..." : "保存"}
          </button>
          <button style={actionBtnSecondary} onClick={handleDailyDownload}>
            PDFダウンロード
          </button>
        </div>
      )}

      {/* Temperature Action Bar */}
      {mainTab === "temperature" && (
        <div
          style={{
            ...actionBar,
            ...(isMobile ? { left: 10, right: 10 } : null),
            gridTemplateColumns: "1fr",
          }}
        >
          <button style={actionBtnPrimary} onClick={handleTempSave} disabled={tempSaving}>
            {tempSaving ? "保存中..." : "保存"}
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
      <div
        style={{
          ...bottomTabs,
          gridTemplateColumns: `repeat(${role === "admin" ? 5 : 4}, 1fr)`,
        }}
      >
        <button onClick={() => setMainTab("logs")} style={{ ...bottomTabBtnStyle, ...(mainTab === "logs" ? bottomTabActive : null) }}>
          <span style={bottomTabIconStyle}>🗒️</span>
          作業ログ
        </button>
        <button
          onClick={() => setMainTab("inventory")}
          style={{ ...bottomTabBtnStyle, ...bottomTabDivider, ...(mainTab === "inventory" ? bottomTabActive : null) }}
        >
          <span style={bottomTabIconStyle}>📦</span>
          在庫管理
        </button>
        <button
          onClick={() => setMainTab("daily")}
          style={{ ...bottomTabBtnStyle, ...bottomTabDivider, ...(mainTab === "daily" ? bottomTabActive : null) }}
        >
          <span style={bottomTabIconStyle}>📝</span>
          日報作成
        </button>
        <button
          onClick={() => setMainTab("temperature")}
          style={{ ...bottomTabBtnStyle, ...bottomTabDivider, ...(mainTab === "temperature" ? bottomTabActive : null) }}
        >
          <span style={bottomTabIconStyle}>🌡️</span>
          温度計測
        </button>
        {role === "admin" && (
          <button
            onClick={() => setMainTab("invite")}
            style={{ ...bottomTabBtnStyle, ...bottomTabDivider, ...(mainTab === "invite" ? bottomTabActive : null) }}
          >
            <span style={bottomTabIconStyle}>✉️</span>
            招待
          </button>
        )}
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

const topBar = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
};

const topBarInner = {
  height: 52,
  padding: "0 6px 0 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  maxWidth: 560,
  margin: "0 auto",
};

const topLogo = {
  display: "flex",
  alignItems: "center",
  height: 32,
};

const topLogoImg = {
  height: 28,
  width: "auto",
  objectFit: "contain",
};

const topSettingsBtn = {
  height: 36,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  fontSize: 18,
  lineHeight: "18px",
};

const topSettingsBtnActive = {
  background: "#111827",
  color: "#fff",
  border: "1px solid #111827",
};

const sectionTitleRow = {
  display: "flex",
  alignItems: "flex-end",
  gap: 6,
};

const sectionBlock = {
  display: "grid",
  gap: 0,
};

const sectionTitleTab = {
  padding: "6px 16px 4px",
  border: "1px solid #e5e7eb",
  borderBottom: "none",
  borderRadius: "16px 16px 0 0",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "0.6px",
};

const sectionTitleLine = {
  flex: 1,
  borderBottom: "none",
  marginBottom: 0,
};

const dailySheet = {
  border: "1px solid #111827",
  borderRadius: 6,
  padding: 10,
  display: "grid",
  gap: 10,
  background: "#fff",
};

const dailyHeaderRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderBottom: "1px solid #111827",
  paddingBottom: 6,
};

const dailyDateBlock = {
  display: "grid",
  gap: 4,
};

const dailyDateInputRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const dailyDateInput = {
  height: 28,
  borderRadius: 6,
  border: "1px solid #111827",
  padding: "0 6px",
  fontSize: 12,
  color: "#111827",
  background: "#fff",
};

const dailyDateWeekday = {
  fontWeight: 700,
  fontSize: 12,
  color: "#111827",
};

const tempTabRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const tempTimeTabRow = {
  ...tempTabRow,
  marginTop: 4,
};


const tempDateRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const tempDateLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
};

const tempDateInput = {
  height: 32,
  padding: "0 8px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  fontSize: 12,
};

const tempDateWeekday = {
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
};

const tempTabBtn = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontSize: 12,
  fontWeight: 800,
};

const tempTabBtnActive = {
  background: "#111827",
  color: "#fff",
  border: "1px solid #111827",
};

const tempTableWrap = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflowX: "auto",
  background: "#fff",
};

const tempTable = {
  display: "grid",
  minWidth: 560,
};

const tempTableHeader = {
  display: "grid",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const tempCornerCell = {
  padding: "8px 10px",
  fontWeight: 800,
  fontSize: 12,
  color: "#475569",
  borderRight: "1px solid #e5e7eb",
};

const tempTimeHeader = {
  padding: "6px 8px",
  display: "grid",
  gap: 4,
  borderRight: "1px solid #e5e7eb",
};

const tempTimeLabel = {
  fontWeight: 800,
  fontSize: 12,
  color: "#111827",
};

const tempSubHeader = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  fontSize: 11,
  color: "#6b7280",
  fontWeight: 700,
};

const tempTableRow = {
  display: "grid",
  borderBottom: "1px solid #e5e7eb",
};

const tempDateCell = {
  padding: "8px 10px",
  fontWeight: 700,
  fontSize: 12,
  color: "#111827",
  borderRight: "1px solid #e5e7eb",
  background: "#fff",
};

const tempValueCell = {
  padding: "6px 8px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  borderRight: "1px solid #e5e7eb",
};

const tempCellInput = {
  height: 30,
  padding: "0 8px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontSize: 12,
  fontWeight: 700,
};

const dailyLabel = {
  fontWeight: 700,
  fontSize: 12,
  color: "#111827",
  marginRight: 6,
};

const dailyWeatherRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const dailyInlineInput = {
  border: "none",
  borderBottom: "1px solid #111827",
  padding: "2px 4px",
  fontSize: 12,
  color: "#111827",
  background: "transparent",
  minWidth: 120,
};

const dailyAttendanceRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "#111827",
};

const dailyAttendanceText = {
  flex: 1,
  borderBottom: "1px solid #111827",
  paddingBottom: 2,
};

const dailyAttendanceInput = {
  ...dailyAttendanceText,
  border: "none",
  borderBottom: "1px solid #111827",
  padding: "2px 4px",
  fontSize: 12,
  color: "#111827",
  background: "transparent",
};

const dailyBox = {
  border: "1px solid #111827",
  borderRadius: 4,
  overflow: "hidden",
};

const dailyBoxTitle = {
  fontWeight: 800,
  fontSize: 12,
  color: "#111827",
  padding: "6px 8px",
  borderBottom: "1px solid #111827",
  background: "#f8fafc",
};

const dailyRuledTextarea = {
  width: "100%",
  border: "none",
  padding: "6px 10px",
  fontSize: 12,
  lineHeight: "24px",
  color: "#111827",
  backgroundImage: "repeating-linear-gradient(to bottom, #fff, #fff 23px, #e5e7eb 24px)",
  resize: "vertical",
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
  borderRadius: 0,
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
  borderRadius: 0,
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

const mobileSection = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  display: "grid",
  gap: 10,
};

const mobileSectionTitle = {
  fontWeight: 900,
  color: "#111827",
  fontSize: 14,
};

const mobileLogEmpty = {
  fontSize: 12,
  color: "#6b7280",
};

const mobileLogCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 10,
  background: "#fff",
  display: "grid",
  gap: 6,
};

const mobileLogHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const mobileLogName = {
  fontWeight: 900,
  color: "#111827",
  fontSize: 14,
};

const mobileLogStatus = {
  fontSize: 11,
  fontWeight: 800,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid transparent",
};

const mobileLogStatusRunning = {
  color: "#0e7490",
  background: "#ecfeff",
  border: "1px solid #cffafe",
};

const mobileLogStatusPaused = {
  color: "#c2410c",
  background: "#fff7ed",
  border: "1px solid #ffedd5",
};

const mobileLogStatusDone = {
  color: "#1e293b",
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
};

const mobileLogSub = {
  fontSize: 12,
  color: "#475569",
  fontWeight: 700,
};

const mobileLogTime = {
  fontSize: 12,
  color: "#111827",
  fontWeight: 700,
};

const invBtnBase = {
  ...actionBtnBase,
  border: "1px solid transparent",
};

const invBtnIn = {
  ...invBtnBase,
  background: "#111827",
  color: "#fff",
  border: "1px solid #111827",
};

const invBtnOut = {
  ...invBtnBase,
  background: "#ef4444",
  color: "#fff",
  border: "1px solid #ef4444",
};

const invBtnAdjust = {
  ...invBtnBase,
  background: "#fff",
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const panel = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

const panelWithTab = {
  ...panel,
  border: "1px solid #e5e7eb",
  borderRadius: "0 12px 12px 12px",
  marginTop: 0,
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

const settingsGrid = {
  display: "grid",
  gap: 10,
};

const settingsLabel = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
};

const settingsInput = {
  height: 36,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontSize: 14,
};

const settingsTextarea = {
  minHeight: 72,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontSize: 14,
  resize: "vertical",
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
  ...settingsInput,
  height: 36,
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

const settingsRow = {
  marginTop: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const settingsHint = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 700,
};

const settingsBadge = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: "#e2e8f0",
  color: "#0f172a",
  fontSize: 11,
  fontWeight: 900,
  marginLeft: 6,
};

const settingsSaveBtn = {
  height: 44,
  padding: "0 18px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  fontSize: 13,
};

const inventoryTabRow = {
  display: "flex",
  gap: 8,
  marginBottom: 8,
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
  fontWeight: 800,
  color: "#475569",
  lineHeight: "16px",
  padding: "0 10px",
  marginBottom: 6,
};

const inventoryTitle = {
  fontWeight: 900,
  color: "#111827",
  marginBottom: 2,
  lineHeight: "16px",
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
  padding: "0 10px",
};

const inventoryGroupLow = {
  ...inventoryGroup,
  color: "#ef4444",
};

const inventoryGroupLowInline = {
  ...inventoryGroupLow,
  padding: 0,
  marginTop: 0,
  marginBottom: 0,
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
  overflow: "hidden",
};

const chatAvatarSelf = {
  ...chatAvatar,
  background: "#111827",
  color: "#fff",
};

const chatAvatarImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
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
  color: "#111827",
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
  border: "1px solid #111827",
  background: "#111827",
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
  color: "#111827",
  fontWeight: 700,
};
