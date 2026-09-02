import { useState, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, Phone, Check, X, Plus, UserX, Edit2, Trash2, Tag, Percent, Banknote } from "lucide-react";
import { B } from "../constants/brand";
import { todayStr } from "../constants/data";
import { currency, applyDiscount, ptFull, weekDay, addDays, formatPaymentMethod } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import Btn from "./ui/Btn";
import StatusBadge from "./ui/StatusBadge";
import Field from "./ui/Field";
import TextArea from "./ui/TextArea";
import { useBreakpoint } from "../hooks/useBreakpoint";

const HOURS  = Array.from({ length: 13 }, (_, i) => i + 8);
const HOUR_H = 68;
const START  = 8;

function t2px(time) {
  const [h, m] = time.split(":").map(Number);
  return (h * 60 + m - START * 60) * (HOUR_H / 60);
}

// Converte "HH:MM" em minutos
function toMin(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Calcula duração total de um agendamento (soma de múltiplos serviços)
function aptDuration(a, services) {
  if (a.serviceIds && a.serviceIds.length > 0) {
    return a.serviceIds.reduce((acc, sid) => acc + (services.find(s => s.id === sid)?.duration || 0), 0) || 60;
  }
  return services.find(s => s.id === a.serviceId)?.duration || 60;
}

// Detecta sobreposição real entre dois agendamentos (considera duração)
function overlaps(a, b, services) {
  const aStart = toMin(a.time);
  const aEnd   = aStart + aptDuration(a, services);
  const bStart = toMin(b.time);
  const bEnd   = bStart + aptDuration(b, services);
  return aStart < bEnd && bStart < aEnd;
}

// Atribui colunas usando intervalo de tempo real (greedy)
function buildColumns(apts, services) {
  if (!apts.length) return {};

  // Ordena por início, depois por duração decrescente (maior primeiro)
  const sorted = [...apts].sort((a, b) => {
    const diff = toMin(a.time) - toMin(b.time);
    if (diff !== 0) return diff;
    return aptDuration(b, services) - aptDuration(a, services);
  });

  // cols[i] = minuto em que a coluna i fica livre
  const cols = [];
  const colOf = {}; // id → coluna

  sorted.forEach(a => {
    const start = toMin(a.time);
    const dur   = aptDuration(a, services);
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      if (cols[c] <= start) {
        cols[c] = start + dur;
        colOf[a.id] = c;
        placed = true;
        break;
      }
    }
    if (!placed) {
      cols.push(start + dur);
      colOf[a.id] = cols.length - 1;
    }
  });

  const totalCols = cols.length;

  // Para cada apt, calcula quantas colunas são necessárias no seu "grupo de sobreposição"
  const result = {};
  apts.forEach(a => {
    // Quantas colunas existem no cluster que inclui este apt
    const cluster = apts.filter(b => overlaps(a, b, services));
    const maxCol = Math.max(...cluster.map(b => colOf[b.id]));
    result[a.id] = { col: colOf[a.id], total: maxCol + 1 };
  });

  return result;
}

const slots = [];
for (let h = 8; h < 20; h++) {
  slots.push(`${String(h).padStart(2, "0")}:00`);
  slots.push(`${String(h).padStart(2, "0")}:30`);
}

export default function Agenda({ appointments, onUpdateStatus, onUpdateAppointment, onDeleteAppointment, clients, services, setPage, profiles, profile }) {
  const { isMobile } = useBreakpoint();
  const isAdmin        = profile?.role === "admin";
  const isReceptionist = profile?.role === "receptionist";
  const isManicure     = profile?.role === "manicure";
  const canSeeFaturamento = isAdmin || isReceptionist;
  const [date,       setDate]     = useState(todayStr);
  const [sel,        setSel]      = useState(null);
  const [editModal,  setEditModal]  = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [payModal,   setPayModal]   = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitValues, setSplitValues] = useState({ card: "", pix: "", cash: "" });
  const [payError,   setPayError]   = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const dateInputRef = useRef(null);

  // Manicure vê apenas seus próprios agendamentos na agenda
  const dayApts = appointments
    .filter(a => {
      if (a.date !== date) return false;
      if (a.status === "cancelled" || a.status === "no_show") return false;
      if (isManicure && a.employeeId !== profile?.id) return false;
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  // Ordena por duração DECRESCENTE antes de montar o colMap (maior = coluna 0 = z-index menor)
  const colMap = buildColumns(dayApts, services);

  const markStatus = async (id, status, paymentMethod = null) => {
    const err = await onUpdateStatus(id, status, paymentMethod);
    if (err) return err;
    setSel(null);
    return null;
  };

  const openEdit = (a) => {
    setEditForm({
      date:          a.date,
      time:          a.time,
      serviceId:     a.serviceId,
      serviceIds:    a.serviceIds?.length > 0 ? a.serviceIds : (a.serviceId ? [a.serviceId] : []),
      notes:         a.notes || "",
      discountOn:    !!a.discount,
      discountType:  a.discount?.type  || "percent",
      discountValue: a.discount?.value || "",
    });
    setEditModal(true);
    setConfirmDel(false);
  };

  const saveEdit = async () => {
    if (!selA) return;
    setSaving(true);
    const discount = editForm.discountOn && editForm.discountValue
      ? { type: editForm.discountType, value: +editForm.discountValue }
      : null;
    await onUpdateAppointment(selA.id, {
      date:       editForm.date,
      time:       editForm.time,
      notes:      editForm.notes,
      serviceId:  editForm.serviceIds[0] || editForm.serviceId,
      serviceIds: editForm.serviceIds,
      discount,
    });
    setSaving(false);
    setEditModal(false);
    setSel(null);
  };

  const handleDelete = async () => {
    if (!selA) return;
    setSaving(true);
    await onDeleteAppointment(selA.id);
    setSaving(false);
    setEditModal(false);
    setSel(null);
  };

  const selA   = sel ? appointments.find(a => a.id === sel) : null;
  const selCl  = selA ? clients.find(c => c.id === selA.clientId) : null;
  // Suporte a múltiplos serviços
  const selSvs = selA
    ? (selA.serviceIds?.length > 0
        ? selA.serviceIds.map(sid => services.find(s => s.id === sid)).filter(Boolean)
        : services.filter(s => s.id === selA.serviceId))
    : [];
  const selSv  = selSvs[0] || null; // compatibilidade
  const selEmp = selA?.employeeId ? profiles.find(p => p.id === selA.employeeId) : null;
  const selTotalPrice = selSvs.reduce((acc, s) => acc + s.price, 0);
  const selTotalDur   = selSvs.reduce((acc, s) => acc + s.duration, 0);

  // ── Painel de detalhes ───────────────────────────────────────
  const detailPanel = selA && selCl && selSv ? (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Detalhes</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => openEdit(selA)} style={{ border: `1.5px solid ${B.border}`, borderRadius: 6, padding: "4px 7px", background: "#fff", cursor: "pointer" }}>
            <Edit2 size={13} color={B.muted} />
          </button>
          <button onClick={() => setSel(null)} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
            <X size={15} color={B.muted} />
          </button>
        </div>
      </div>
      <Avatar name={selCl.name} size={44} />
      <div style={{ marginTop: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{selCl.name}</div>
        <div style={{ fontSize: 12, color: B.muted, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Phone size={11} /> {selCl.phone}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
        {/* Serviços (múltiplos) */}
        <div style={{ fontSize: 13 }}>
          <span style={{ color: B.muted }}>Serviço{selSvs.length > 1 ? "s" : ""}</span>
          {selSvs.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontWeight: 500 }}>{s.name}</span>
              {canSeeFaturamento && <span style={{ color: B.brand, fontWeight: 600 }}>{currency(s.price)}</span>}
            </div>
          ))}
        </div>
        {[
          ["Data",      ptFull(selA.date)],
          ["Horário",   selA.time],
          ["Duração total", `${selTotalDur} min`],
          ["Atendente", selEmp ? selEmp.name : "—"],
          ...(canSeeFaturamento && selA.discount ? [["Desconto", selA.discount.type === "percent" ? `${selA.discount.value}%` : currency(selA.discount.value)]] : []),
          ...(canSeeFaturamento ? [["Total", currency(applyDiscount(selTotalPrice, selA.discount))]] : []),
          ...(canSeeFaturamento && selA.status === "completed" ? [["Pagamento", formatPaymentMethod(selA.paymentMethod)]] : []),
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: B.muted }}>{k}</span>
            <span style={{ fontWeight: k === "Total" ? 700 : 500, color: k === "Total" ? B.brand : B.text }}>{v}</span>
          </div>
        ))}
      </div>
      {selA.notes && (
        <div style={{ background: "#fafafa", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
          {selA.notes}
        </div>
      )}
      <StatusBadge status={selA.status} />

      {selA.status === "scheduled" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
          <Btn variant="success" onClick={() => { setPayError(""); setPayModal(true); }}>
            <Check size={13} /> Concluir atendimento
          </Btn>
          <Btn variant="ghost" onClick={() => markStatus(selA.id, "no_show")} style={{ color: "#d97706", borderColor: "#fde68a", background: "#fffbeb" }}>
            <UserX size={13} /> Não compareceu
          </Btn>
          <Btn variant="danger" onClick={() => markStatus(selA.id, "cancelled")}>
            <X size={13} /> Cancelou
          </Btn>
        </div>
      )}

      {selA.status === "completed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
          <Btn variant="outline" onClick={() => markStatus(selA.id, "scheduled")} style={{ color: B.brand, borderColor: B.brand }}>
            <X size={13} /> Desfazer conclusão
          </Btn>
        </div>
      )}

      <button onClick={() => { openEdit(selA); setConfirmDel(false); }} style={{
        marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, border: "1.5px solid #fca5a5",
        background: "#fff0f0", color: "#dc2626", fontFamily: "inherit", fontWeight: 600,
        fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <Edit2 size={13} /> Editar / Excluir agendamento
      </button>
    </Card>
  ) : (
    <Card style={{ padding: 20, textAlign: "center" }}>
      <Calendar size={28} color={B.border} style={{ margin: "0 auto 8px" }} />
      <div style={{ fontSize: 13, color: B.muted, lineHeight: 1.4 }}>Clique num agendamento para ver os detalhes</div>
      <div style={{ marginTop: 14 }}>
        <Btn small onClick={() => setPage("novo")}><Plus size={13} /> Novo agendamento</Btn>
      </div>
    </Card>
  );

  // ── Resumo do dia ────────────────────────────────────────────
  const dayCompleted = dayApts.filter(a => a.status === "completed");

  // Soma por forma de pagamento (considera pagamentos divididos, salvos como JSON)
  const paymentTotals = { card: 0, pix: 0, cash: 0, voucher: 0 };
  dayCompleted.forEach(a => {
    const svList = a.serviceIds?.length > 0
      ? a.serviceIds.map(sid => services.find(x => x.id === sid)).filter(Boolean)
      : services.filter(x => x.id === a.serviceId);
    const total = svList.reduce((t, sv) => t + sv.price, 0);
    const finalTotal = applyDiscount(total, a.discount);

    let split = null;
    try {
      const parsed = JSON.parse(a.paymentMethod);
      if (typeof parsed === "object" && parsed !== null) split = parsed;
    } catch (e) { /* pagamento único, não é JSON */ }

    if (split) {
      Object.entries(split).forEach(([method, val]) => {
        if (paymentTotals[method] !== undefined) paymentTotals[method] += Number(val) || 0;
      });
    } else if (a.paymentMethod && paymentTotals[a.paymentMethod] !== undefined) {
      paymentTotals[a.paymentMethod] += finalTotal;
    }
  });

  const summaryCard = (
    <Card style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Resumo do dia</div>
      {[
        ["Agendamentos", dayApts.length],
        ["Concluídos",   dayCompleted.length],
        ["Pendentes",    dayApts.filter(a => a.status === "scheduled").length],
        ...(canSeeFaturamento ? [["Faturamento", currency(dayCompleted.reduce((s, a) => {
          const svList = a.serviceIds?.length > 0
            ? a.serviceIds.map(sid => services.find(x => x.id === sid)).filter(Boolean)
            : services.filter(x => x.id === a.serviceId);
          const total = svList.reduce((t, sv) => t + sv.price, 0);
          return s + applyDiscount(total, a.discount);
        }, 0))]] : []),
      ].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f9fafb" }}>
          <span style={{ color: B.muted }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}

      {canSeeFaturamento && (
        <>
          <div style={{ fontWeight: 700, fontSize: 12, marginTop: 14, marginBottom: 8, color: B.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Por forma de pagamento
          </div>
          {[
            ["📱 Pix",      paymentTotals.pix],
            ["💳 Cartão",   paymentTotals.card],
            ["💵 Dinheiro", paymentTotals.cash],
            ...(paymentTotals.voucher > 0 ? [["🎫 Voucher", paymentTotals.voucher]] : []),
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f9fafb" }}>
              <span style={{ color: B.muted }}>{k}</span>
              <span style={{ fontWeight: 600, color: B.brand }}>{currency(v)}</span>
            </div>
          ))}
        </>
      )}
    </Card>
  );

  // ── Timeline ─────────────────────────────────────────────────
  const timeline = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={() => setDate(addDays(date, -1))} style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "6px 9px", background: "#fff", cursor: "pointer" }}>
          <ChevronLeft size={15} color={B.brand} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: B.text }}>{ptFull(date)}</div>
          <div style={{ fontSize: 12, color: B.muted }}>{weekDay(date)}{date === todayStr ? " — Hoje" : ""}</div>
        </div>
        <button onClick={() => setDate(addDays(date, 1))} style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "6px 9px", background: "#fff", cursor: "pointer" }}>
          <ChevronRight size={15} color={B.brand} />
        </button>
        {/* Seletor de data direto */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            title="Ir para data"
            style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "6px 9px", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <Calendar size={15} color={B.brand} />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={e => e.target.value && setDate(e.target.value)}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0, top: 0, left: 0 }}
          />
        </div>
        <Btn small variant="outline" onClick={() => setDate(todayStr)}>Hoje</Btn>
      </div>

      <Card style={{ flex: 1, overflowY: "auto", padding: 0 }}>
        <div style={{ position: "relative", height: HOURS.length * HOUR_H, minHeight: HOURS.length * HOUR_H }}>
          {HOURS.map(h => (
            <div key={h} style={{ position: "absolute", top: (h - START) * HOUR_H, left: 0, right: 0, height: HOUR_H, borderBottom: "1px solid #f5f0f4", display: "flex" }}>
              <div style={{ width: 52, display: "flex", alignItems: "flex-start", padding: "6px 8px 0", fontSize: 11, fontWeight: 600, color: "#d8cad5", flexShrink: 0 }}>
                {String(h).padStart(2, "0")}:00
              </div>
              <div style={{ flex: 1, borderLeft: "1px dashed #f5f0f4" }} />
            </div>
          ))}

          {/* Renderiza maior duração primeiro (z-index menor) para que procedimentos
              curtos fiquem SEMPRE visíveis em cima de procedimentos longos */}
          {[...dayApts]
            .sort((a, b) => {
              if (a.id === sel) return 1;
              if (b.id === sel) return -1;
              return aptDuration(b, services) - aptDuration(a, services);
            })
            .map((a, renderIdx) => {
            const svList = a.serviceIds?.length > 0
              ? a.serviceIds.map(sid => services.find(s => s.id === sid)).filter(Boolean)
              : services.filter(s => s.id === a.serviceId);
            const sv     = svList[0] || null;
            const cl     = clients.find(c => c.id === a.clientId);
            const emp    = a.employeeId ? profiles.find(p => p.id === a.employeeId) : null;
            const dur    = aptDuration(a, services);
            const top    = t2px(a.time);
            const hpx    = Math.max(dur * (HOUR_H / 60) - 4, 30);
            const done   = a.status === "completed";
            const col    = done ? "#16a34a" : B.brand;
            const bg     = done ? "#f0fdf4" : B.light;
            const brd    = done ? "#86efac" : B.border;
            const active = sel === a.id;

            // Colunas baseadas em sobreposição real de intervalos
            const { col: colIdx, total: colTotal } = colMap[a.id] || { col: 0, total: 1 };
            const LEFT_OFFSET = 56;
            const RIGHT_PAD   = 10;
            // Dá uma pequena margem entre colunas (4px)
            const gapW       = 3;
            const totalGap   = gapW * (colTotal - 1);
            const colWidthPx = `calc((100% - ${LEFT_OFFSET + RIGHT_PAD + totalGap}px) / ${colTotal})`;
            const colLeftPx  = `calc(${LEFT_OFFSET}px + (${colWidthPx} + ${gapW}px) * ${colIdx})`;

            // hpx: 30min≈30px, 45min≈47px, 60min≈64px, 90min≈98px
            const isCompact = hpx <= 36;  // 30min → 1 linha
            const isMini    = hpx <= 54;  // 45min → 2 linhas condensadas
            const isMedium  = hpx <= 68;  // 60min → 3 linhas

            return (
              <div
                key={a.id}
                onClick={() => setSel(active ? null : a.id)}
                style={{
                  position: "absolute",
                  left: colLeftPx,
                  width: colWidthPx,
                  top: top + 2,
                  height: hpx,
                  zIndex: active ? 50 : renderIdx + 1,
                  background: bg,
                  borderLeft: `3px solid ${col}`,
                  borderRadius: "0 9px 9px 0",
                  border: `1px solid ${active ? col : brd}`,
                  paddingLeft: 8,
                  paddingRight: 6,
                  paddingTop: isCompact ? 0 : 4,
                  paddingBottom: isCompact ? 0 : 4,
                  cursor: "pointer",
                  boxShadow: active
                    ? `0 0 0 2px ${col}40, 0 4px 12px rgba(0,0,0,0.15)`
                    : "0 1px 3px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: isCompact ? "row" : "column",
                  alignItems: isCompact ? "center" : "flex-start",
                  justifyContent: "flex-start",
                  gap: isCompact ? 5 : isMini ? 2 : 1,
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}
              >
                {isCompact ? (
                  /* ── 30min: 1 linha ──────────────────────────────── */
                  <>
                    <span style={{ fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>
                      {a.time}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: B.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                      {cl?.name}
                    </span>
                    {emp && (
                      <span style={{ fontSize: 10, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "25%", flexShrink: 0, fontWeight: 600 }}>
                        · {emp.name.split(" ")[0]}
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "35%", flexShrink: 0 }}>
                      {svList.map(s => s.name).join("+")}
                    </span>
                    {canSeeFaturamento && (() => { const tot = svList.reduce((t,s)=>t+s.price,0); return (
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>
                        {currency(applyDiscount(tot, a.discount))}
                      </span>
                    ); })()}
                  </>
                ) : isMini ? (
                  /* ── 45min: 2 linhas condensadas ─────────────────── */
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", overflow: "hidden" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>{a.time} · {dur}min</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: B.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cl?.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", overflow: "hidden" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, opacity: 0.85 }}>
                        {svList.map(s => s.name).join("+")}
                      </span>
                      {canSeeFaturamento && (() => { const tot = svList.reduce((t,s)=>t+s.price,0); return (
                        <span style={{ fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>
                          {currency(applyDiscount(tot, a.discount))}
                        </span>
                      ); })()}
                    </div>
                  </>
                ) : (
                  /* ── 60min+: layout completo ─────────────────────── */
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: col, lineHeight: 1.2 }}>
                      {a.time} · {dur}min
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: B.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>
                      {cl?.name}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: col, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2, opacity: 0.8 }}>
                      {svList.map(s => s.name).join(" + ")}{emp ? ` · ${emp.name.split(" ")[0]}` : ""}
                    </div>
                    {canSeeFaturamento && (() => { const tot = svList.reduce((t,s)=>t+s.price,0); return (
                      <div style={{ fontSize: isMedium ? 10 : 11, fontWeight: 700, color: col, marginTop: isMedium ? 0 : "auto" }}>
                        {currency(applyDiscount(tot, a.discount))}
                      </div>
                    ); })()}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const totalToPay = selA ? applyDiscount(selTotalPrice, selA.discount) : 0;

  const fillRemaining = (key) => {
    const currentValues = { ...splitValues };
    let otherSum = 0;
    Object.keys(currentValues).forEach(k => {
      if (k !== key) {
        otherSum += Number(currentValues[k]) || 0;
      }
    });
    const remaining = Math.max(0, totalToPay - otherSum);
    const formattedRemaining = Math.round(remaining * 100) / 100;
    setSplitValues({ ...currentValues, [key]: formattedRemaining || "" });
  };

  return (
    <>
      {/* ── Modal: forma de pagamento ──────────────────────────── */}
      {payModal && selA && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
          <Card style={{ padding: 28, width: isSplitting ? 420 : 360, maxWidth: "92vw", transition: "width 0.2s" }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Concluir atendimento</div>
            <div style={{ fontSize: 13, color: B.muted, marginBottom: 22 }}>
              {isSplitting ? "Informe os valores de cada forma de pagamento" : "Selecione a forma de pagamento"}
            </div>

            {!isSplitting ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { value: "card", label: "Cartão",   emoji: "💳" },
                    { value: "pix",  label: "Pix",      emoji: "📱" },
                    { value: "cash", label: "Dinheiro", emoji: "💵" },
                    { value: "voucher", label: "Voucher", emoji: "🎫" },
                  ].map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      disabled={payLoading}
                      onClick={async () => {
                        setPayError("");
                        setPayLoading(true);
                        const err = await markStatus(selA.id, "completed", value);
                        setPayLoading(false);
                        if (err) { setPayError(err); return; }
                        setPayModal(false);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        padding: "18px 8px",
                        border: `2px solid ${B.border}`,
                        borderRadius: 12,
                        background: "#fff",
                        cursor: payLoading ? "default" : "pointer",
                        opacity: payLoading ? 0.6 : 1,
                        fontFamily: "inherit",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = B.brand; e.currentTarget.style.background = B.light; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.background = "#fff"; }}
                    >
                      <span style={{ fontSize: 30 }}>{emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: B.text }}>{label}</span>
                      {value === "voucher" && (
                        <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>100% desc.</span>
                      )}
                    </button>
                  ))}
                </div>

                {payError && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 12, color: "#dc2626", marginBottom: 14 }}>
                    Não foi possível salvar: {payError}
                  </div>
                )}

                <button
                  onClick={() => setIsSplitting(true)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: `1.5px dashed ${B.brand}`,
                    background: B.light,
                    color: B.brand,
                    fontFamily: "inherit",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  ➕ Dividir pagamento em múltiplos métodos
                </button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: B.light, padding: "10px 14px", borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: B.muted, fontWeight: 500 }}>Total a pagar:</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: B.brand }}>{currency(totalToPay)}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { key: "card", label: "Cartão", emoji: "💳" },
                    { key: "pix", label: "Pix", emoji: "📱" },
                    { key: "cash", label: "Dinheiro", emoji: "💵" },
                  ].map(({ key, label, emoji }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 85, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: B.text }}>
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </div>
                      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={{ position: "absolute", left: 10, fontSize: 12, color: B.muted, fontWeight: 600 }}>R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={splitValues[key]}
                          onChange={e => {
                            const val = e.target.value;
                            setSplitValues(prev => ({ ...prev, [key]: val }));
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 8px 8px 28px",
                            borderRadius: 8,
                            border: `1.5px solid ${B.border}`,
                            fontFamily: "inherit",
                            fontSize: 13,
                            fontWeight: 600,
                            outline: "none",
                          }}
                        />
                      </div>
                      <button
                        onClick={() => fillRemaining(key)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: `1.5px solid ${B.brand}`,
                          background: B.light,
                          color: B.brand,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Restante
                      </button>
                    </div>
                  ))}
                </div>

                {(() => {
                  const cardVal = Number(splitValues.card) || 0;
                  const pixVal = Number(splitValues.pix) || 0;
                  const cashVal = Number(splitValues.cash) || 0;
                  const sum = cardVal + pixVal + cashVal;
                  const diff = totalToPay - sum;
                  const absDiff = Math.abs(diff);

                  let statusText = "";
                  let statusColor = "";
                  let isValid = false;

                  if (absDiff < 0.01) {
                    statusText = "Soma exata!";
                    statusColor = "#16a34a"; // verde
                    isValid = true;
                  } else if (diff > 0) {
                    statusText = `Falta pagar ${currency(absDiff)}`;
                    statusColor = "#dc2626"; // vermelho
                  } else {
                    statusText = `Excedente de ${currency(absDiff)}`;
                    statusColor = "#d97706"; // laranja
                  }

                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "center", fontSize: 13, fontWeight: 700, color: statusColor, marginBottom: 16, background: `${statusColor}12`, padding: "8px 12px", borderRadius: 8 }}>
                        {statusText}
                      </div>

                      {payError && (
                        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 12, color: "#dc2626", marginBottom: 14 }}>
                          Não foi possível salvar: {payError}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn
                          variant="ghost"
                          onClick={() => {
                            setIsSplitting(false);
                            setSplitValues({ card: "", pix: "", cash: "" });
                          }}
                          style={{ flex: 1 }}
                        >
                          Voltar
                        </Btn>
                        <Btn
                          variant="primary"
                          disabled={!isValid || payLoading}
                          onClick={async () => {
                            const finalSplit = {};
                            if (cardVal > 0) finalSplit.card = cardVal;
                            if (pixVal > 0) finalSplit.pix = pixVal;
                            if (cashVal > 0) finalSplit.cash = cashVal;

                            const entries = Object.entries(finalSplit);
                            let methodValue = "";
                            if (entries.length === 1) {
                              methodValue = entries[0][0];
                            } else {
                              methodValue = JSON.stringify(finalSplit);
                            }
                            setPayError("");
                            setPayLoading(true);
                            const err = await markStatus(selA.id, "completed", methodValue);
                            setPayLoading(false);
                            if (err) { setPayError(err); return; }
                            setPayModal(false);
                            setIsSplitting(false);
                            setSplitValues({ card: "", pix: "", cash: "" });
                          }}
                          style={{ flex: 1 }}
                        >
                          {payLoading ? "Salvando…" : "Confirmar"}
                        </Btn>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {!isSplitting && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => {
                    setPayModal(false);
                    setIsSplitting(false);
                    setSplitValues({ card: "", pix: "", cash: "" });
                    setPayError("");
                  }}
                  style={{ fontSize: 13, color: B.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 12px" }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Modal editar agendamento ───────────────────────────── */}
      {editModal && selA && selCl && selSv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <Card style={{ padding: 26, width: 440, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>Editar Agendamento</div>
              <button onClick={() => setEditModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={17} color={B.muted} /></button>
            </div>

            <div style={{ background: B.light, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              <strong>{selCl.name}</strong> — {selSv.name}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Field label="Data *" type="date" value={editForm.date} onChange={v => setEditForm(f => ({ ...f, date: v }))} />

              {/* Seletor de Serviços (múltipla seleção) */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Serviços</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {services.map(s => {
                    const sel2 = (editForm.serviceIds || []).includes(s.id);
                    return (
                      <button key={s.id} onClick={() => setEditForm(f => {
                        const ids = f.serviceIds || [];
                        return { ...f, serviceIds: sel2 ? ids.filter(x => x !== s.id) : [...ids, s.id], serviceId: sel2 ? ids.filter(x => x !== s.id)[0] || null : s.id };
                      })} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px", border: `1.5px solid ${sel2 ? B.brand : B.border}`,
                        borderRadius: 8, background: sel2 ? B.light : "#fff",
                        cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, textAlign: "left",
                      }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel2 ? B.brand : B.border}`, background: sel2 ? B.brand : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {sel2 && <Check size={10} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ flex: 1, color: sel2 ? B.brand : B.text }}>{s.name}</span>
                        <span style={{ color: B.muted, fontSize: 11 }}>{currency(s.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Horário</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5 }}>
                  {slots.map(t => (
                    <button key={t} onClick={() => setEditForm(f => ({ ...f, time: t }))} style={{
                      padding: "6px 2px", border: `1.5px solid ${editForm.time === t ? B.brand : B.border}`,
                      borderRadius: 7, background: editForm.time === t ? B.brand : "#fff",
                      color: editForm.time === t ? "#fff" : B.text, cursor: "pointer",
                      fontFamily: "inherit", fontWeight: 600, fontSize: 11,
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Seção de Desconto */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Tag size={13} color={B.brand} /> Desconto
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm(f => ({ ...f, discountOn: !f.discountOn, discountValue: "" }))}
                  style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", position: "relative", background: editForm.discountOn ? B.brand : "#e5e7eb", transition: "background 0.2s" }}
                >
                  <div style={{ position: "absolute", top: 2, left: editForm.discountOn ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
              {editForm.discountOn && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                  <div style={{ display: "flex", gap: 7 }}>
                    {[
                      { id: "percent", label: "Percentual (%)", Icon: Percent },
                      { id: "fixed", label: "Valor fixo (R$)", Icon: Banknote }
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, discountType: id, discountValue: "" }))}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "6px 8px", border: `1.5px solid ${editForm.discountType === id ? B.brand : B.border}`,
                          borderRadius: 8, background: editForm.discountType === id ? B.light : "#fff",
                          cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 11,
                          color: editForm.discountType === id ? B.brand : B.muted,
                        }}
                      >
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>
                  <Field
                    label={editForm.discountType === "percent" ? "Percentual (%)" : "Valor (R$)"}
                    type="number"
                    value={editForm.discountValue}
                    onChange={v => setEditForm(f => ({ ...f, discountValue: v }))}
                    placeholder={editForm.discountType === "percent" ? "Ex: 10" : "Ex: 20"}
                  />
                </div>
              )}

              <TextArea label="Observações" value={editForm.notes} onChange={v => setEditForm(f => ({ ...f, notes: v }))} placeholder="Observações..." />
            </div>

            {/* Confirmar exclusão */}
            {confirmDel ? (
              <div style={{ marginTop: 18, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 12 }}>
                  ⚠️ Tem certeza que deseja excluir este agendamento?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setConfirmDel(false)} style={{ flex: 1 }}>Cancelar</Btn>
                  <Btn variant="danger" onClick={handleDelete} disabled={saving} style={{ flex: 1 }}>
                    <Trash2 size={13} /> {saving ? "Excluindo…" : "Excluir"}
                  </Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "space-between" }}>
                <Btn variant="danger" onClick={() => setConfirmDel(true)}>
                  <Trash2 size={13} /> Excluir
                </Btn>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setEditModal(false)}>Cancelar</Btn>
                  <Btn variant="primary" onClick={saveEdit} disabled={saving || !editForm.date || !editForm.time}>
                    <Check size={13} /> {saving ? "Salvando…" : "Salvar"}
                  </Btn>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Layout mobile ────────────────────────────────────────── */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "calc(100vh - 140px)" }}>
          {summaryCard}
          {timeline}
          {selA && selCl && selSv && (
            <div style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "flex-end", zIndex: 200,
            }} onClick={() => setSel(null)}>
              <div style={{
                width: "100%", background: "#fff", borderRadius: "20px 20px 0 0",
                padding: "20px 20px 36px", maxHeight: "85vh", overflowY: "auto",
              }} onClick={e => e.stopPropagation()}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 16px" }} />
                {detailPanel}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Layout desktop ──────────────────────────────────────── */
        <div style={{ display: "flex", gap: 18, height: "calc(100vh - 72px)" }}>
          {timeline}
          <div style={{ width: 268, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {detailPanel}
            {summaryCard}
          </div>
        </div>
      )}
    </>
  );
}
