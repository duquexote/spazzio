import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Phone, Check, X, Plus } from "lucide-react";
import { B } from "../constants/brand";
import { todayStr } from "../constants/data";
import { currency, applyDiscount, ptFull, weekDay, addDays } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import Btn from "./ui/Btn";
import StatusBadge from "./ui/StatusBadge";
import { useBreakpoint } from "../hooks/useBreakpoint";

const HOURS  = Array.from({ length: 13 }, (_, i) => i + 8);
const HOUR_H = 68;
const START  = 8;

function t2px(time) {
  const [h, m] = time.split(":").map(Number);
  return (h * 60 + m - START * 60) * (HOUR_H / 60);
}

export default function Agenda({ appointments, onUpdateStatus, clients, services, setPage }) {
  const { isMobile } = useBreakpoint();
  const [date, setDate] = useState(todayStr);
  const [sel,  setSel]  = useState(null);

  const dayApts = appointments
    .filter(a => a.date === date && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));

  const markDone   = async (id) => { await onUpdateStatus(id, "completed"); setSel(null); };
  const markCancel = async (id) => { await onUpdateStatus(id, "cancelled"); setSel(null); };

  const selA  = sel ? appointments.find(a => a.id === sel) : null;
  const selCl = selA ? clients.find(c => c.id === selA.clientId) : null;
  const selSv = selA ? services.find(s => s.id === selA.serviceId) : null;

  // Painel de detalhes (mobile: modal flutuante, desktop: coluna lateral)
  const detailPanel = selA && selCl && selSv ? (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Detalhes</div>
        <button onClick={() => setSel(null)} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
          <X size={15} color={B.muted} />
        </button>
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
          ["Serviço",  selSv.name],
          ["Horário",  selA.time],
          ["Duração",  `${selSv.duration} min`],
          ...(selA.discount ? [["Desconto", selA.discount.type === "percent" ? `${selA.discount.value}%` : currency(selA.discount.value)]] : []),
          ["Total",    currency(applyDiscount(selSv.price, selA.discount))],
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
          <Btn variant="success" onClick={() => markDone(selA.id)}><Check size={13} /> Concluir atendimento</Btn>
          <Btn variant="danger"  onClick={() => markCancel(selA.id)}><X size={13} /> Cancelar</Btn>
        </div>
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

  const summaryCard = (
    <Card style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Resumo do dia</div>
      {[
        ["Agendamentos", dayApts.length],
        ["Concluídos",   dayApts.filter(a => a.status === "completed").length],
        ["Pendentes",    dayApts.filter(a => a.status === "scheduled").length],
        ["Faturamento",  currency(dayApts.filter(a => a.status === "completed").reduce((s, a) => {
          const sv = services.find(x => x.id === a.serviceId);
          return s + (sv ? applyDiscount(sv.price, a.discount) : 0);
        }, 0))],
      ].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f9fafb" }}>
          <span style={{ color: B.muted }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </Card>
  );

  const timeline = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Navegação de data */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={() => setDate(addDays(date, -1))} style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "6px 9px", background: "#fff", cursor: "pointer" }}>
          <ChevronLeft size={15} color={B.brand} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 16 : 20, fontWeight: 700, color: B.text }}>{ptFull(date)}</div>
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

          {dayApts.map(a => {
            const sv    = services.find(s => s.id === a.serviceId);
            const cl    = clients.find(c => c.id === a.clientId);
            const top   = t2px(a.time);
            const h     = Math.max((sv?.duration || 60) * (HOUR_H / 60) - 4, 30);
            const done  = a.status === "completed";
            const col   = done ? "#16a34a" : B.brand;
            const bg    = done ? "#f0fdf4" : B.light;
            const brd   = done ? "#86efac" : B.border;
            const active = sel === a.id;

            return (
              <div key={a.id} onClick={() => setSel(active ? null : a.id)} style={{
                position: "absolute", left: 56, right: 10, top: top + 2, height: h,
                background: bg, borderLeft: `3px solid ${col}`,
                borderRadius: "0 9px 9px 0",
                border: `1px solid ${active ? col : brd}`,
                padding: "4px 10px", cursor: "pointer",
                boxShadow: active ? `0 0 0 2px ${col}40` : "0 1px 3px rgba(0,0,0,0.04)",
                overflow: "hidden", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.15s",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{a.time}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: B.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cl?.name}</div>
                  {h > 34 && <div style={{ fontSize: 11, color: B.muted }}>{sv?.name}</div>}
                </div>
                {h > 28 && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: col, flexShrink: 0 }}>
                    {sv ? currency(applyDiscount(sv.price, a.discount)) : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  // Mobile: painel de detalhes como modal overlay quando selecionado
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "calc(100vh - 140px)" }}>
        {summaryCard}
        {timeline}

        {/* Modal de detalhes no mobile */}
        {selA && selCl && selSv && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "flex-end", zIndex: 200,
          }} onClick={() => setSel(null)}>
            <div style={{
              width: "100%", background: "#fff", borderRadius: "20px 20px 0 0",
              padding: "20px 20px 36px", maxHeight: "85vh", overflowY: "auto",
            }} onClick={e => e.stopPropagation()}>
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 16px" }} />
              {detailPanel}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: layout lado a lado
  return (
    <div style={{ display: "flex", gap: 18, height: "calc(100vh - 72px)" }}>
      {timeline}
      <div style={{ width: 268, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {detailPanel}
        {summaryCard}
      </div>
    </div>
  );
}
