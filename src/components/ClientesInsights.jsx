import { Users, UserPlus, Repeat, DollarSign, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { B } from "../constants/brand";
import { currency, applyDiscount } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function ClientesInsights({ clients, appointments, services }) {
  const { isMobile } = useBreakpoint();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const completed = appointments.filter(a => a.status === "completed");

  // Primeira visita concluída de cada cliente (proxy p/ "cliente novo")
  const firstVisit = {};
  completed.forEach(a => {
    if (!firstVisit[a.clientId] || a.date < firstVisit[a.clientId]) firstVisit[a.clientId] = a.date;
  });
  const newThisMonth = Object.values(firstVisit).filter(d => d.startsWith(monthStr)).length;

  // Gasto, frequência e última visita por cliente
  const byClient = {};
  completed.forEach(a => {
    const svList = a.serviceIds?.length > 0
      ? a.serviceIds.map(sid => services.find(x => x.id === sid)).filter(Boolean)
      : services.filter(x => x.id === a.serviceId);
    const total = svList.reduce((t, sv) => t + sv.price, 0);
    const final = applyDiscount(total, a.discount);
    if (!byClient[a.clientId]) byClient[a.clientId] = { visits: 0, spent: 0, lastDate: a.date, svcBag: {} };
    byClient[a.clientId].visits++;
    byClient[a.clientId].spent += final;
    if (a.date > byClient[a.clientId].lastDate) byClient[a.clientId].lastDate = a.date;
    svList.forEach(sv => {
      byClient[a.clientId].svcBag[sv.id] = (byClient[a.clientId].svcBag[sv.id] || 0) + 1;
    });
  });

  const activeIds     = Object.keys(byClient);
  const totalRevenue  = Object.values(byClient).reduce((s, c) => s + c.spent, 0);
  const totalVisits   = Object.values(byClient).reduce((s, c) => s + c.visits, 0);
  const avgTicket     = totalVisits > 0 ? totalRevenue / totalVisits : 0;
  const returning     = Object.values(byClient).filter(c => c.visits > 1).length;
  const returnRate    = activeIds.length > 0 ? (returning / activeIds.length) * 100 : 0;

  // Clientes sem visitar há mais de 60 dias (risco de churn)
  const todayMs = Date.now();
  const inactive60 = activeIds.filter(id => {
    const last = new Date(byClient[id].lastDate + "T12:00:00").getTime();
    return (todayMs - last) / 86400000 > 60;
  }).length;

  const rank = (key) => Object.entries(byClient)
    .map(([id, v]) => ({ client: clients.find(c => c.id === id), ...v }))
    .filter(x => x.client)
    .sort((a, b) => b[key] - a[key])
    .slice(0, 5);

  const topSpenders  = rank("spent");
  const topFrequent  = rank("visits");

  // Serviços mais feitos por cada um dos top 5 clientes (por frequência)
  const topServicesOf = (svcBag) => Object.entries(svcBag)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, n]) => ({ name: services.find(s => s.id === id)?.name || "?", n }));

  const stats = [
    { Icon: Users,      label: "Total de clientes", value: clients.length },
    { Icon: UserPlus,   label: "Novos este mês",     value: newThisMonth,               accent: "#16a34a" },
    { Icon: Repeat,     label: "Taxa de retorno",    value: `${returnRate.toFixed(0)}%`, sub: `${returning} de ${activeIds.length} voltaram`, accent: "#0891b2" },
    { Icon: DollarSign, label: "Ticket médio",       value: currency(avgTicket),         accent: "#7c3aed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14 }}>
        {stats.map(({ Icon, label, value, sub, accent }) => (
          <Card key={label} style={{ padding: "16px 18px", borderTop: `3px solid ${accent || B.brand}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: B.text, marginTop: 4 }}>{value}</div>
                {sub && <div style={{ fontSize: 11, color: B.muted, marginTop: 1 }}>{sub}</div>}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: B.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} color={accent || B.brand} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {inactive60 > 0 && (
        <Card style={{ padding: "14px 18px", borderLeft: "3px solid #d97706", background: "#fffbeb", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} color="#d97706" />
          <div style={{ fontSize: 13, color: "#92400e" }}>
            <strong>{inactive60}</strong> cliente{inactive60 !== 1 ? "s" : ""} sem visitar há mais de 60 dias
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={15} color={B.brand} /> Top clientes por gasto
          </div>
          {topSpenders.length === 0
            ? <div style={{ fontSize: 13, color: B.muted }}>Sem dados ainda</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topSpenders.map(({ client, spent }, i) => (
                  <div key={client.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: B.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: B.brand, flexShrink: 0 }}>{i + 1}</div>
                    <Avatar name={client.name} size={26} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: B.brand }}>{currency(spent)}</div>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Repeat size={15} color={B.brand} /> Top clientes por frequência
          </div>
          {topFrequent.length === 0
            ? <div style={{ fontSize: 13, color: B.muted }}>Sem dados ainda</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topFrequent.map(({ client, visits }, i) => (
                  <div key={client.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: B.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: B.brand, flexShrink: 0 }}>{i + 1}</div>
                    <Avatar name={client.name} size={26} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: B.brand }}>{visits}x</div>
                  </div>
                ))}
              </div>
            )}
        </Card>
      </div>

      <Card style={{ padding: "18px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={15} color={B.brand} /> Serviços preferidos dos top clientes
        </div>
        {topFrequent.length === 0
          ? <div style={{ fontSize: 13, color: B.muted }}>Sem dados ainda</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topFrequent.map(({ client, svcBag }, i) => (
                <div key={client.id} style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 9, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: B.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: B.brand, flexShrink: 0 }}>{i + 1}</div>
                  <Avatar name={client.name} size={26} />
                  <div style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, minWidth: isMobile ? "100%" : 120, maxWidth: isMobile ? "100%" : 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {topServicesOf(svcBag).map(({ name, n }) => (
                      <span key={name} style={{ fontSize: 11, fontWeight: 600, color: B.brand, background: B.light, border: `1px solid ${B.border}`, borderRadius: 20, padding: "2px 9px", whiteSpace: "nowrap" }}>
                        {name} · {n}x
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
      </Card>
    </div>
  );
}
