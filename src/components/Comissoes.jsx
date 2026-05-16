import { useState } from "react";
import {
  TrendingUp, ChevronDown, ChevronUp, Calendar,
  DollarSign, Scissors, User2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { B } from "../constants/brand";
import { currency, applyDiscount, ptShort } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import SectionTitle from "./ui/SectionTitle";
import StatusBadge from "./ui/StatusBadge";
import { useBreakpoint } from "../hooks/useBreakpoint";

const COMMISSION_RATE = 0.55; // 55%

// Retorna o valor bruto (com desconto) de um agendamento somando todos os serviços
function aptTotal(a, services) {
  const ids = a.serviceIds?.length > 0 ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
  const base = ids.reduce((sum, sid) => {
    const sv = services.find(s => s.id === sid);
    return sum + (sv ? sv.price : 0);
  }, 0);
  return applyDiscount(base, a.discount);
}

// Retorna os nomes dos serviços de um agendamento
function aptServiceNames(a, services) {
  const ids = a.serviceIds?.length > 0 ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
  return ids.map(sid => services.find(s => s.id === sid)?.name).filter(Boolean).join(" + ") || "—";
}

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

function monthRange(year, month) {
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end   = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

// ── Card de resumo de comissão de UM funcionário ───────────────────────────
function EmployeeCommissionCard({ emp, apts, services, expanded, onToggle }) {
  const empApts = apts.filter(
    (a) => a.employeeId === emp.id && a.status === "completed"
  );

  const totalProduced = empApts.reduce((sum, a) => sum + aptTotal(a, services), 0);

  const commission = totalProduced * COMMISSION_RATE;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Header clicável */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px", border: "none", background: "transparent",
          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}
      >
        <Avatar name={emp.name} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: B.text }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>
            {empApts.length} atendimento{empApts.length !== 1 ? "s" : ""} concluído{empApts.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: B.muted, marginBottom: 2 }}>A receber</div>
          <div style={{
            fontSize: 20, fontWeight: 800, color: commission > 0 ? "#16a34a" : B.muted,
            fontFamily: "inherit",
          }}>
            {currency(commission)}
          </div>
          <div style={{ fontSize: 11, color: B.muted, marginTop: 1 }}>
            de {currency(totalProduced)} produzido
          </div>
        </div>
        <div style={{ marginLeft: 8, flexShrink: 0, color: B.muted }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Lista de atendimentos expandida */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${B.border}`, padding: "0 20px 16px" }}>
          {empApts.length === 0 ? (
            <div style={{ padding: "16px 0", fontSize: 13, color: B.muted, textAlign: "center" }}>
              Nenhum atendimento concluído neste mês
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${B.border}` }}>
                    {["Data", "Horário", "Serviço", "Valor", "55%"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "6px 8px",
                        fontSize: 10, fontWeight: 700, color: B.muted,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empApts
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((a) => {
                      const valor = aptTotal(a, services);
                      return (
                        <tr key={a.id} style={{ borderBottom: `1px solid #fafafa` }}>
                          <td style={{ padding: "8px 8px", color: B.muted }}>{ptShort(a.date)}</td>
                          <td style={{ padding: "8px 8px", fontWeight: 600, color: B.brand }}>{a.time}</td>
                          <td style={{ padding: "8px 8px" }}>{aptServiceNames(a, services)}</td>
                          <td style={{ padding: "8px 8px" }}>{currency(valor)}</td>
                          <td style={{ padding: "8px 8px", fontWeight: 700, color: "#16a34a" }}>
                            {currency(valor * COMMISSION_RATE)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${B.border}` }}>
                    <td colSpan={3} style={{ padding: "8px 8px", fontWeight: 700, fontSize: 13 }}>
                      Total
                    </td>
                    <td style={{ padding: "8px 8px", fontWeight: 700, color: B.brand }}>
                      {currency(totalProduced)}
                    </td>
                    <td style={{ padding: "8px 8px", fontWeight: 800, color: "#16a34a", fontSize: 14 }}>
                      {currency(commission)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Visão do funcionário: somente seus próprios dados ─────────────────────
function MyCommission({ profile, apts, services, clients, year, month }) {
  const { isMobile } = useBreakpoint();
  const myApts = apts.filter(
    (a) => a.employeeId === profile.id && a.status === "completed"
  );

  const totalProduced = myApts.reduce((sum, a) => sum + aptTotal(a, services), 0);

  const commission = totalProduced * COMMISSION_RATE;

  // Agrupa por serviço para mostrar ranking (cada serviço de cada apt conta separadamente)
  const byService = {};
  myApts.forEach((a) => {
    const ids = a.serviceIds?.length > 0 ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
    ids.forEach(sid => {
      const sv = services.find(s => s.id === sid);
      if (!sv) return;
      const val = applyDiscount(sv.price, a.discount) / ids.length; // distribui desconto
      byService[sv.id] = byService[sv.id] || { name: sv.name, count: 0, total: 0 };
      byService[sv.id].count++;
      byService[sv.id].total += val;
    });
  });
  const serviceRanking = Object.values(byService).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cards de resumo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
        gap: 12,
      }}>
        {[
          {
            label: "Atendimentos",
            value: myApts.length,
            icon: <Scissors size={18} color={B.brand} />,
            color: B.brand,
          },
          {
            label: "Total produzido",
            value: currency(totalProduced),
            icon: <TrendingUp size={18} color="#0891b2" />,
            color: "#0891b2",
          },
          {
            label: "A receber (55%)",
            value: currency(commission),
            icon: <DollarSign size={18} color="#16a34a" />,
            color: "#16a34a",
            highlight: true,
          },
        ].map(({ label, value, icon, color, highlight }) => (
          <Card key={label} style={{
            padding: "16px 18px",
            background: highlight ? "#f0fdf4" : "#fff",
            border: highlight ? "1.5px solid #86efac" : undefined,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "inherit" }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Ranking por serviço */}
      {serviceRanking.length > 0 && (
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Scissors size={15} color={B.brand} /> Serviços realizados
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {serviceRanking.map(({ name, count, total }) => {
              const pct = totalProduced > 0 ? (total / totalProduced) * 100 : 0;
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{name}</span>
                    <span style={{ color: B.muted }}>{count}× · {currency(total)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      background: `linear-gradient(90deg, ${B.brand}, #d86ab9)`,
                      width: `${pct}%`, transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Lista de atendimentos */}
      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={15} color={B.brand} /> Atendimentos do mês
        </div>
        {myApts.length === 0 ? (
          <div style={{ fontSize: 13, color: B.muted, textAlign: "center", padding: "16px 0" }}>
            Nenhum atendimento concluído neste mês
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${B.border}` }}>
                  {["Data", "Horário", "Cliente", "Serviço", "Valor", "Comissão"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "6px 8px",
                      fontSize: 10, fontWeight: 700, color: B.muted,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myApts
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((a) => {
                    const valor = aptTotal(a, services);
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid #fafafa" }}>
                        <td style={{ padding: "8px 8px", color: B.muted }}>{ptShort(a.date)}</td>
                        <td style={{ padding: "8px 8px", fontWeight: 600, color: B.brand }}>{a.time}</td>
                        <td style={{ padding: "8px 8px", fontWeight: 500 }}>{clients.find(c => c.id === a.clientId)?.name || "—"}</td>
                        <td style={{ padding: "8px 8px" }}>{aptServiceNames(a, services)}</td>
                        <td style={{ padding: "8px 8px" }}>{currency(valor)}</td>
                        <td style={{ padding: "8px 8px", fontWeight: 700, color: "#16a34a" }}>
                          {currency(valor * COMMISSION_RATE)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${B.border}` }}>
                  <td colSpan={4} style={{ padding: "8px 8px", fontWeight: 700 }}>Total</td>
                  <td style={{ padding: "8px 8px", fontWeight: 700, color: B.brand }}>{currency(totalProduced)}</td>
                  <td style={{ padding: "8px 8px", fontWeight: 800, color: "#16a34a", fontSize: 14 }}>{currency(commission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Comissoes({ profile, profiles, appointments, services, clients }) {
  const isAdmin = profile?.role === "admin";
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expandedId, setExpandedId] = useState(null);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const { start, end } = monthRange(year, month);
  const monthApts = appointments.filter(
    (a) => a.date >= start && a.date <= end
  );

  // Para admin: apenas manicures têm comissão
  const employees = profiles.filter((p) => p.role === "manicure" && p.active);

  const totalCommission = employees.reduce((sum, emp) => {
    const empTotal = monthApts
      .filter((a) => a.employeeId === emp.id && a.status === "completed")
      .reduce((s, a) => s + aptTotal(a, services), 0);
    return sum + empTotal * COMMISSION_RATE;
  }, 0);

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <SectionTitle>
            {isAdmin ? "Comissões" : "Minhas Comissões"}
          </SectionTitle>
          <div style={{ fontSize: 13, color: B.muted, marginTop: 2 }}>
            {isAdmin
              ? `Resumo de comissões por funcionário`
              : `Seus ganhos como manicure — 55% dos serviços concluídos`}
          </div>
        </div>

        {/* Navegação de mês */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={prevMonth} style={{
            border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "7px 10px",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
          }}>
            <ChevronLeft size={15} color={B.brand} />
          </button>
          <div style={{
            fontSize: 14, fontWeight: 700, color: B.text,
            minWidth: 150, textAlign: "center", textTransform: "capitalize",
          }}>
            {monthLabel(year, month)}
          </div>
          <button onClick={nextMonth} style={{
            border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "7px 10px",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
          }}>
            <ChevronRight size={15} color={B.brand} />
          </button>
        </div>
      </div>

      {/* ── Visão ADMIN ───────────────────────────────────────────── */}
      {isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card total geral */}
          <Card style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #7B1F6A 0%, #a0337a 100%)",
            color: "#fff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total a pagar em comissões
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "inherit", lineHeight: 1.2, marginTop: 4 }}>
                  {currency(totalCommission)}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  {employees.length} funcionário{employees.length !== 1 ? "s" : ""} · {monthLabel(year, month)}
                </div>
              </div>
              <DollarSign size={48} style={{ opacity: 0.25 }} />
            </div>
          </Card>

          {/* Cards por funcionário */}
          {employees.length === 0 ? (
            <Card style={{ padding: 32, textAlign: "center" }}>
              <User2 size={36} color={B.border} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: B.text }}>Nenhum funcionário ativo</div>
              <div style={{ fontSize: 13, color: B.muted, marginTop: 4 }}>Cadastre funcionários na aba Usuários</div>
            </Card>
          ) : (
            employees.map((emp) => (
              <EmployeeCommissionCard
                key={emp.id}
                emp={emp}
                apts={monthApts}
                services={services}
                expanded={expandedId === emp.id}
                onToggle={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Visão MANICURE ────────────────────────────────────────── */}
      {!isAdmin && profile?.role === "manicure" && (
        <MyCommission
          profile={profile}
          apts={monthApts}
          services={services}
          clients={clients}
          year={year}
          month={month}
        />
      )}
      {/* ── Recepcionista não tem comissão ────────────────────────── */}
      {!isAdmin && profile?.role === "receptionist" && (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <DollarSign size={36} color={B.border} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: B.text }}>Comissões não aplicáveis</div>
          <div style={{ fontSize: 13, color: B.muted, marginTop: 4 }}>Recepcionistas não recebem comissão por atendimento</div>
        </Card>
      )}
    </div>
  );
}
