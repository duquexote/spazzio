import { useMemo } from "react";
import { Calendar, DollarSign, CheckCircle, CalendarCheck, TrendingUp } from "lucide-react";
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

function Stat({ Icon, label, value, sub, accent }) {
  return (
    <Card style={{ padding: "18px 22px", borderTop: `3px solid ${accent || B.brand}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: B.text, marginTop: 5, fontFamily: "inherit" }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: B.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={accent || B.brand} />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard({ appointments, clients, services, setPage }) {
  const { isMobile } = useBreakpoint();
  const now = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const monthDone = useMemo(() =>
    appointments.filter(a => a.status === "completed" && a.date >= mStart && a.date <= mEnd),
    [appointments]
  );

  const faturamento = useMemo(() =>
    monthDone.reduce((s, a) => {
      const sv = services.find(x => x.id === a.serviceId);
      return s + (sv ? applyDiscount(sv.price, a.discount) : 0);
    }, 0), [monthDone, services]
  );

  const agendados = appointments.filter(a => a.status === "scheduled" && a.date >= todayStr);
  const todayApts = appointments
    .filter(a => a.date === todayStr && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));
  const ticket = monthDone.length > 0 ? faturamento / monthDone.length : 0;

  const svcMap = {};
  monthDone.forEach(a => { svcMap[a.serviceId] = (svcMap[a.serviceId] || 0) + 1; });
  const topSvcs = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, n]) => ({ name: services.find(s => s.id == id)?.name || "?", n }));

  const chartData = useMemo(() => {
    const mo = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const s = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const total = appointments
        .filter(a => a.status === "completed" && a.date >= s && a.date <= e)
        .reduce((sum, a) => {
          const sv = services.find(x => x.id === a.serviceId);
          return sum + (sv ? applyDiscount(sv.price, a.discount) : 0);
        }, 0);
      return { name: mo[d.getMonth()], valor: +total.toFixed(2) };
    });
  }, [appointments, services]);

  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <SectionTitle>Bom dia, Spazzio Diva</SectionTitle>
        <div style={{ fontSize: 14, color: B.muted }}>{ptFull(todayStr)} — {weekDay(todayStr)}</div>
      </div>

      {/* Stats grid: 2 colunas no mobile, 4 no desktop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: isMobile ? 10 : 14,
        marginBottom: 20,
      }}>
        <Stat Icon={DollarSign}   label="Faturamento do mês"    value={currency(faturamento)} sub={`${monthDone.length} atendimentos`} />
        <Stat Icon={CheckCircle}  label="Serviços realizados"   value={monthDone.length} sub="neste mês" accent="#16a34a" />
        <Stat Icon={CalendarCheck} label="Agendamentos futuros" value={agendados.length} sub="a partir de hoje" accent="#d97706" />
        <Stat Icon={TrendingUp}   label="Ticket médio"          value={currency(ticket)} sub="por atendimento" accent="#0891b2" />
      </div>

      {/* Charts: empilhados no mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 14,
        marginBottom: 20,
      }}>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: B.text, marginBottom: 14 }}>Faturamento — últimos 6 meses</div>
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

      <Card style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>Agenda de hoje</div>
          <Btn small variant="outline" onClick={() => setPage("agenda")}><Calendar size={13} /> Ver agenda</Btn>
        </div>
        {todayApts.length === 0
          ? <div style={{ fontSize: 13, color: B.muted, padding: "16px 0", textAlign: "center" }}>Nenhum agendamento para hoje</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {todayApts.map(a => {
                const cl = clients.find(c => c.id === a.clientId);
                const sv = services.find(s => s.id === a.serviceId);
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
                      <div style={{ fontSize: 11, color: B.muted }}>{sv?.name}</div>
                    </div>
                    {!isMobile && (
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
