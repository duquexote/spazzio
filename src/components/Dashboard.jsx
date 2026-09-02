import { useState, useMemo } from "react";
import { Calendar, DollarSign, CheckCircle, CalendarCheck, TrendingUp, Gift, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { B } from "../constants/brand";
import { todayStr } from "../constants/data";
import { currency, applyDiscount, ptFull, weekDay } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import Btn from "./ui/Btn";
import SectionTitle from "./ui/SectionTitle";
import StatusBadge from "./ui/StatusBadge";
import { useBreakpoint } from "../hooks/useBreakpoint";

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

function monthRange(year, month) {
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

function Stat({ Icon, label, value, sub, accent }) {
  return (
    <Card style={{ padding: "18px 22px", borderTop: `3px solid ${accent || B.brand}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: B.text, marginTop: 5 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: B.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={accent || B.brand} />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard({ appointments, clients, services, setPage, profile, profiles }) {
  const { isMobile } = useBreakpoint();
  const isAdmin       = profile?.role === "admin";
  const isManicure    = profile?.role === "manicure";

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const { start: mStart, end: mEnd } = monthRange(year, month);
  const yStart = `${year}-01-01`;
  const yEnd   = `${year}-12-31`;

  // Cálculo multi-serviço
  function calcRevenue(apts) {
    return apts.reduce((s, a) => {
      const ids = a.serviceIds?.length > 0 ? a.serviceIds : (a.serviceId ? [a.serviceId] : []);
      const base = ids.reduce((t, sid) => {
        const sv = services.find(x => x.id === sid);
        return t + (sv ? sv.price : 0);
      }, 0);
      return s + applyDiscount(base, a.discount);
    }, 0);
  }

  const completedAll   = appointments.filter(a => a.status === "completed");
  const todayCompleted = completedAll.filter(a => a.date === todayStr);
  const monthCompleted = completedAll.filter(a => a.date >= mStart && a.date <= mEnd);
  const yearCompleted  = completedAll.filter(a => a.date >= yStart && a.date <= yEnd);

  // Para manicure: filtra só os próprios atendimentos
  const myCompleted      = completedAll.filter(a => a.employeeId === profile?.id);
  const myTodayCompleted = myCompleted.filter(a => a.date === todayStr);
  const myMonthCompleted = myCompleted.filter(a => a.date >= mStart && a.date <= mEnd);

  const COMMISSION_RATE = 0.55;
  const myMonthRevenue  = calcRevenue(myMonthCompleted);
  const myTodayRevenue  = calcRevenue(myTodayCompleted);
  const myCommission    = myMonthRevenue * COMMISSION_RATE;

  const todayRevenue  = calcRevenue(todayCompleted);
  const monthRevenue  = calcRevenue(monthCompleted);
  const yearRevenue   = calcRevenue(yearCompleted);
  const ticket        = monthCompleted.length > 0 ? monthRevenue / monthCompleted.length : 0;

  const agendados = appointments.filter(a => a.status === "scheduled" && a.date >= todayStr);
  const todayApts = appointments
    .filter(a => a.date === todayStr && a.status !== "cancelled" && a.status !== "no_show")
    .sort((a, b) => a.time.localeCompare(b.time));
  const myTodayApts = todayApts.filter(a => a.employeeId === profile?.id);
  // Manicure só deve ver a própria agenda; admin/recepcionista veem tudo
  const agendaHojeApts = isManicure ? myTodayApts : todayApts;

  // ── Aniversariantes do mês ───────────────────────────────────
  const currentMonth = String(month).padStart(2, "0");
  const birthdayClients = clients
    .filter(c => c.birthdate && c.birthdate.slice(5, 7) === currentMonth)
    .sort((a, b) => a.birthdate.slice(8, 10).localeCompare(b.birthdate.slice(8, 10)));

  // Top serviços (apenas admin)
  const svcMap = {};
  monthCompleted.forEach(a => { svcMap[a.serviceId] = (svcMap[a.serviceId] || 0) + 1; });
  const topSvcs = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, n]) => ({ name: services.find(s => s.id == id)?.name || "?", n }));

  // Gráfico 6 meses (apenas admin)
  const chartData = useMemo(() => {
    const mo = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - (5 - i), 1);
      const s = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const total = calcRevenue(completedAll.filter(a => a.date >= s && a.date <= e));
      return { name: mo[d.getMonth()], valor: +total.toFixed(2) };
    });
  }, [appointments, services, year, month]);

  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <SectionTitle>
              {isAdmin ? "Bom dia, Admin" : `Olá, ${profile?.name?.split(" ")[0] || "Funcionária"}!`}
            </SectionTitle>
            <div style={{ fontSize: 14, color: B.muted }}>{ptFull(todayStr)} — {weekDay(todayStr)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={prevMonth} style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "7px 10px", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={15} color={B.text} />
            </button>
            <span style={{ minWidth: 150, textAlign: "center", fontWeight: 600, fontSize: 14, color: B.text, textTransform: "capitalize" }}>
              {monthLabel(year, month)}
            </span>
            <button onClick={nextMonth} style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "7px 10px", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <ChevronRight size={15} color={B.text} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Manicure: seus próprios dados ── */}
      {isManicure && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 14,
            marginBottom: 20,
          }}>
            <Stat Icon={DollarSign}    label="Meu faturamento hoje"   value={currency(myTodayRevenue)} sub={`${myTodayCompleted.length} atendimentos`} />
            <Stat Icon={CheckCircle}   label="Concluídos hoje"        value={myTodayCompleted.length}  accent="#16a34a" />
            <Stat Icon={CalendarCheck} label="Meus agendam. hoje"     value={myTodayApts.length}       accent="#d97706" />
            <Stat Icon={TrendingUp}    label="Comissão do mês (55%)"  value={currency(myCommission)}   sub={`de ${currency(myMonthRevenue)}`} accent="#0891b2" />
          </div>
        </>
      )}

      {/* ── Recepcionista: faturamento global do dia ── */}
      {!isAdmin && !isManicure && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
            gap: isMobile ? 10 : 14,
            marginBottom: 20,
          }}>
            <Stat Icon={DollarSign}    label="Faturamento hoje"      value={currency(todayRevenue)} sub={`${todayCompleted.length} atendimentos`} />
            <Stat Icon={CheckCircle}   label="Concluídos hoje"        value={todayCompleted.length}  accent="#16a34a" />
            <Stat Icon={CalendarCheck} label="Agendados hoje"         value={todayApts.length}       accent="#d97706" />
          </div>
        </>
      )}

      {/* ── Admin: stats completas ── */}
      {isAdmin && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 14,
            marginBottom: isMobile ? 10 : 14,
          }}>
            <Stat Icon={DollarSign}    label="Faturamento do mês"    value={currency(monthRevenue)}  sub={`${monthCompleted.length} atendimentos`} />
            <Stat Icon={TrendingUp}    label="Faturamento do ano"     value={currency(yearRevenue)}   sub={`${yearCompleted.length} atendimentos`} accent="#0891b2" />
            <Stat Icon={CalendarCheck} label="Agendamentos futuros"   value={agendados.length}        sub="a partir de hoje" accent="#d97706" />
            <Stat Icon={CheckCircle}   label="Ticket médio (mês)"     value={currency(ticket)}        sub="por atendimento" accent="#16a34a" />
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
            gap: isMobile ? 10 : 14,
            marginBottom: 20,
          }}>
            <Stat Icon={DollarSign}    label="Faturamento hoje"        value={currency(todayRevenue)}   sub={`${todayCompleted.length} atendimentos concluídos`} accent="#16a34a" />
            <Stat Icon={TrendingUp}    label="Meu faturamento do mês"  value={currency(myMonthRevenue)} sub={`${myMonthCompleted.length} atendimentos meus`}     accent="#7c3aed" />
          </div>

          {/* ── Previsão de caixa ── */}
          {(() => {
            const futureScheduled = appointments.filter(a => a.status === "scheduled" && a.date >= todayStr);
            const previsao = futureScheduled.reduce((s, a) => {
              const sv = services.find(x => x.id === a.serviceId);
              return s + (sv ? applyDiscount(sv.price, a.discount) : 0);
            }, 0);
            const byDate = {};
            futureScheduled.forEach(a => {
              if (!byDate[a.date]) byDate[a.date] = { count: 0, total: 0 };
              byDate[a.date].count++;
              const sv = services.find(x => x.id === a.serviceId);
              byDate[a.date].total += sv ? applyDiscount(sv.price, a.discount) : 0;
            });
            const nextDays = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(0, 5);
            const mo = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
            const fmtDate = d => { const [,m,dd] = d.split("-"); return `${+dd}/${mo[+m-1]}`; };
            return (
              <Card style={{ padding: "20px 22px", marginBottom: 20, borderTop: `3px solid #7c3aed` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Previsão de Caixa</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: B.text, marginTop: 4 }}>{currency(previsao)}</div>
                    <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>{futureScheduled.length} agendamento{futureScheduled.length !== 1 ? "s" : ""} não concluídos</div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={18} color="#7c3aed" />
                  </div>
                </div>
                {nextDays.length > 0 && (
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Próximos dias</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {nextDays.map(([d, { count, total }]) => (
                        <div key={d} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 600, color: d === todayStr ? "#7c3aed" : B.text }}>{d === todayStr ? "Hoje" : fmtDate(d)}</span>
                            <span style={{ fontSize: 11, color: B.muted, background: "#f3f4f6", borderRadius: 10, padding: "1px 7px" }}>{count} apto{count !== 1 ? "s" : ""}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: "#7c3aed" }}>{currency(total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Gráfico + top serviços */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 14, marginBottom: 20,
          }}>
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: B.text, marginBottom: 14 }}>Faturamento — 6 meses até {monthLabel(year, month)}</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: B.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: B.muted }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={v => [currency(v), "Faturamento"]} cursor={{ fill: B.light }} contentStyle={{ borderRadius: 8, border: `1px solid ${B.border}`, fontSize: 12 }} />
                  <Bar dataKey="valor" fill={B.brand} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ padding: "20px 22px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: B.text, marginBottom: 14 }}>Serviços mais realizados no mês</div>
              {topSvcs.length === 0
                ? <div style={{ fontSize: 13, color: B.muted }}>Nenhum dado ainda</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {topSvcs.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: B.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: B.brand, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: B.muted, marginRight: 6 }}>{s.n}x</div>
                        <div style={{ width: 72, height: 5, borderRadius: 3, background: "#f3f4f6" }}>
                          <div style={{ height: "100%", borderRadius: 3, background: B.brand, width: `${(s.n / (topSvcs[0]?.n || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </Card>
          </div>
        </>
      )}

      {/* ── Aniversariantes do mês (ambos) ── */}
      <Card style={{ padding: "20px 22px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Gift size={16} color="#d97706" />
            <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>Aniversáriantes do mês</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 9px" }}>
            {birthdayClients.length} este mês
          </span>
        </div>
        {birthdayClients.length === 0
          ? <div style={{ fontSize: 13, color: B.muted, textAlign: "center", padding: "12px 0" }}>Nenhum aniversáriante este mês 🎂</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {birthdayClients.map(c => {
                const day   = c.birthdate.slice(8, 10);
                const isToday = c.birthdate.slice(5) === todayStr.slice(5);
                return (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 11px", borderRadius: 8,
                    background: isToday ? "#fffbeb" : "#fafafa",
                    border: isToday ? "1px solid #fde68a" : "1px solid #f3f4f6",
                  }}>
                    <Avatar name={c.name} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: B.muted }}>{c.phone}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#d97706" : B.brand }}>dia {day}</span>
                      {isToday && <span style={{ fontSize: 14 }}>🎂</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>

      {/* ── Agenda de hoje (ambos) ── */}
      <Card style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>Agenda de hoje</div>
          <Btn small variant="outline" onClick={() => setPage("agenda")}><Calendar size={13} /> Ver agenda</Btn>
        </div>
        {agendaHojeApts.length === 0
          ? <div style={{ fontSize: 13, color: B.muted, padding: "16px 0", textAlign: "center" }}>Nenhum agendamento para hoje</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {agendaHojeApts.map(a => {
                const cl = clients.find(c => c.id === a.clientId);
                const sv = services.find(s => s.id === a.serviceId);
                const emp = profiles.find(p => p.id === a.employeeId);
                return (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: isMobile ? 8 : 11,
                    padding: isMobile ? "9px 10px" : "9px 12px",
                    borderRadius: 8, background: "#fafafa", border: "1px solid #f3f4f6",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: B.brand, minWidth: 44 }}>{a.time}</div>
                    <Avatar name={cl?.name || "?"} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cl?.name}</div>
                      <div style={{ fontSize: 11, color: B.muted }}>{sv?.name}{emp ? ` · ${emp.name}` : ""}</div>
                    </div>
                    {!isMobile && (isAdmin || profile?.role === "receptionist") && (
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{sv ? currency(applyDiscount(sv.price, a.discount)) : "—"}</div>
                    )}
                    <StatusBadge status={a.status} />
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>
    </div>
  );
}
