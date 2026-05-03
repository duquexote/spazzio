import { LayoutDashboard, Calendar, Users, Scissors, Plus } from "lucide-react";
import { B } from "../constants/brand";

const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "agenda",    label: "Agenda",    Icon: Calendar },
  { id: "clientes",  label: "Clientes",  Icon: Users },
  { id: "servicos",  label: "Serviços",  Icon: Scissors },
];

export default function Sidebar({ page, setPage }) {
  return (
    <div style={{
      width: 224, minHeight: "100vh", background: "#fff",
      borderRight: `1px solid ${B.border}`,
      display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, bottom: 0,
      boxShadow: "2px 0 16px rgba(123,31,106,0.05)",
    }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${B.border}` }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 700, color: B.brand, lineHeight: 1.1 }}>
          Spazzio Diva
        </div>
        <div style={{ fontSize: 9.5, color: B.muted, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
          Salão de Beleza &amp; Estética
        </div>
      </div>

      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "9px 11px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? B.light : "transparent",
              color: active ? B.brand : "#6b7280",
              fontFamily: "inherit", fontWeight: active ? 600 : 500, fontSize: 14,
              marginBottom: 2, transition: "all 0.15s",
              borderLeft: active ? `3px solid ${B.brand}` : "3px solid transparent",
            }}>
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: `1px solid ${B.border}` }}>
        <button onClick={() => setPage("novo")} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          width: "100%", padding: "10px", borderRadius: 10, border: "none",
          background: B.brand, color: "#fff", fontFamily: "inherit",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          <Plus size={15} /> Novo Agendamento
        </button>
      </div>
    </div>
  );
}
