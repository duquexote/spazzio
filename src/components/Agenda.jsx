import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Phone, Check, X, Plus, UserX, Edit2, Trash2 } from "lucide-react";
import { B } from "../constants/brand";
import { todayStr } from "../constants/data";
import { currency, applyDiscount, ptFull, weekDay, addDays } from "../utils/format";
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

// Detecta sobreposição real entre dois agendamentos (considera duração)
function overlaps(a, b, services) {
  const aStart = toMin(a.time);
  const aDur   = services.find(s => s.id === a.serviceId)?.duration || 60;
  const aEnd   = aStart + aDur;
  const bStart = toMin(b.time);
  const bDur   = services.find(s => s.id === b.serviceId)?.duration || 60;
  const bEnd   = bStart + bDur;
  return aStart < bEnd && bStart < aEnd;
}

// Atribui colunas usando intervalo de tempo real (greedy)
function buildColumns(apts, services) {
  if (!apts.length) return {};

  // Ordena por início, depois por duração decrescente (maior primeiro)
  const sorted = [...apts].sort((a, b) => {
    const diff = toMin(a.time) - toMin(b.time);
    if (diff !== 0) return diff;
    const aDur = services.find(s => s.id === a.serviceId)?.duration || 60;
    const bDur = services.find(s => s.id === b.serviceId)?.duration || 60;
    return bDur - aDur; // maior duração primeiro
  });

  // cols[i] = minuto em que a coluna i fica livre
  const cols = [];
  const colOf = {}; // id → coluna

  sorted.forEach(a => {
    const start = toMin(a.time);
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      if (cols[c] <= start) {
        const dur = services.find(s => s.id === a.serviceId)?.duration || 60;
        cols[c] = start + dur;
        colOf[a.id] = c;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const dur = services.find(s => s.id === a.serviceId)?.duration || 60;
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
  const isAdmin = profile?.role === "admin";
  const [date,      setDate]    = useState(todayStr);
  const [sel,       setSel]     = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm,  setEditForm] = useState({});
  const [saving,    setSaving]  = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const dayApts = appointments
    .filter(a => a.date === date && a.status !== "cancelled" && a.status !== "no_show")
    .sort((a, b) => a.time.localeCompare(b.time));

  // Ordena por duração DECRESCENTE antes de montar o colMap (maior = coluna 0 = z-index menor)
  const colMap = buildColumns(dayApts, services);

  const markStatus = async (id, status) => { await onUpdateStatus(id, status); setSel(null); };

  const openEdit = (a) => {
    setEditForm({
      date:          a.date,
      time:          a.time,
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
      date:  editForm.date,
      time:  editForm.time,
      notes: editForm.notes,
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

  const selA  = sel ? appointments.find(a => a.id === sel) : null;
  const selCl = selA ? clients.find(c => c.id === selA.clientId) : null;
  const selSv = selA ? services.find(s => s.id === selA.serviceId) : null;
  const selEmp = selA?.employeeId ? profiles.find(p => p.id === selA.employeeId) : null;

  // ── Painel de detalhes ───────────────────────────────────────
  const detailPanel = selA && selCl && selSv ? (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Detalhes</div>
        <div style={{ display: "flex", gap: 6 }}>
          {isAdmin && (
            <button onClick={() => openEdit(selA)} style={{ border: `1.5px solid ${B.border}`, borderRadius: 6, padding: "4px 7px", background: "#fff", cursor: "pointer" }}>
              <Edit2 size={13} color={B.muted} />
            </button>
          )}
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
        {[
          ["Serviço",   selSv.name],
          ["Data",      ptFull(selA.date)],
          ["Horário",   selA.time],
          ["Duração",   `${selSv.duration} min`],
          ["Atendente", selEmp ? selEmp.name : "—"],
          ...(isAdmin && selA.discount ? [["Desconto", selA.discount.type === "percent" ? `${selA.discount.value}%` : currency(selA.discount.value)]] : []),
          ...(isAdmin ? [["Total", currency(applyDiscount(selSv.price, selA.discount))]] : []),
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
          <Btn variant="success" onClick={() => markStatus(selA.id, "completed")}>
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

      {isAdmin && (
        <button onClick={() => { openEdit(selA); setConfirmDel(false); }} style={{
          marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, border: "1.5px solid #fca5a5",
          background: "#fff0f0", color: "#dc2626", fontFamily: "inherit", fontWeight: 600,
          fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Edit2 size={13} /> Editar / Excluir agendamento
        </button>
      )}
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
  const summaryCard = (
    <Card style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Resumo do dia</div>
      {[
        ["Agendamentos", dayApts.length],
        ["Concluídos",   dayApts.filter(a => a.status === "completed").length],
        ["Pendentes",    dayApts.filter(a => a.status === "scheduled").length],
        ...(isAdmin ? [["Faturamento", currency(dayApts.filter(a => a.status === "completed").reduce((s, a) => {
          const sv = services.find(x => x.id === a.serviceId);
          return s + (sv ? applyDiscount(sv.price, a.discount) : 0);
        }, 0))]] : []),
      ].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f9fafb" }}>
          <span style={{ color: B.muted }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
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
              // Selecionado sempre por último (z-index máximo)
              if (a.id === sel) return 1;
              if (b.id === sel) return -1;
              const aDur = services.find(s => s.id === a.serviceId)?.duration || 60;
              const bDur = services.find(s => s.id === b.serviceId)?.duration || 60;
              return bDur - aDur; // maior duração renderiza primeiro = z-index menor
            })
            .map((a, renderIdx) => {
            const sv     = services.find(s => s.id === a.serviceId);
            const cl     = clients.find(c => c.id === a.clientId);
            const emp    = a.employeeId ? profiles.find(p => p.id === a.employeeId) : null;
            const dur    = sv?.duration || 60;
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

            // hpx para 30min ≈ 30px, 60min ≈ 64px, 90min ≈ 98px
            const isCompact = hpx <= 36;  // 30min
            const isMedium  = hpx <= 68;  // 60min

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
                  gap: isCompact ? 5 : 1,
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}
              >
                {isCompact ? (
                  /* ── Layout compacto (30min): 1 linha com tudo ───── */
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
                    {sv?.name && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "30%", flexShrink: 0 }}>
                        {sv.name}
                      </span>
                    )}
                    {isAdmin && sv && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>
                        {currency(applyDiscount(sv.price, a.discount))}
                      </span>
                    )}
                  </>
                ) : (
                  /* ── Layout normal (60min+) ───────────────────────── */
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: col, lineHeight: 1.2 }}>
                      {a.time} · {dur}min
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: B.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>
                      {cl?.name}
                    </div>
                    {/* Serviço + atendente na mesma linha */}
                    <div style={{ fontSize: 10, fontWeight: 600, color: col, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2, opacity: 0.8 }}>
                      {sv?.name}{emp ? ` · ${emp.name.split(" ")[0]}` : ""}
                    </div>
                    {!isMedium && isAdmin && sv && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: col, marginTop: "auto" }}>
                        {currency(applyDiscount(sv.price, a.discount))}
                      </div>
                    )}
                    {isMedium && isAdmin && sv && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: col }}>
                        {currency(applyDiscount(sv.price, a.discount))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  return (
    <>
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
