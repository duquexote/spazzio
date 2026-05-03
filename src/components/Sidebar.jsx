import { LayoutDashboard, Calendar, Users, Scissors, Plus } from "lucide-react";
import { B } from "../constants/brand";
import { useBreakpoint } from "../hooks/useBreakpoint";

const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "agenda",    label: "Agenda",    Icon: Calendar },
  { id: "clientes",  label: "Clientes",  Icon: Users },
  { id: "servicos",  label: "Serviços",  Icon: Scissors },
];

export default function Sidebar({ page, setPage }) {
  const { isMobile } = useBreakpoint();

  // ── Mobile: bottom navigation bar ────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Header mobile */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "#fff", borderBottom: `1px solid ${B.border}`,
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(123,31,106,0.08)",
        }}>
          <div>
            <div style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 700, color: B.brand, lineHeight: 1 }}>
              Spazzio Diva
            </div>
            <div style={{ fontSize: 9, color: B.muted, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Salão de Beleza & Estética
            </div>
          </div>
          <button onClick={() => setPage("novo")} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 13px", borderRadius: 10, border: "none",
            background: B.brand, color: "#fff", fontFamily: "inherit",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            <Plus size={14} /> Agendar
          </button>
        </div>

        {/* Bottom nav */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "#fff", borderTop: `1px solid ${B.border}`,
          display: "flex", boxShadow: "0 -2px 16px rgba(123,31,106,0.08)",
        }}>
          {NAV.map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => setPage(id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, padding: "10px 4px 8px", border: "none", cursor: "pointer",
                background: "transparent",
                color: active ? B.brand : "#9ca3af",
                fontFamily: "inherit", fontWeight: active ? 700 : 400, fontSize: 10,
                borderTop: active ? `2px solid ${B.brand}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                <Icon size={20} />
                {label}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // ── Desktop: sidebar lateral ──────────────────────────────────
  return (
    <div style={{
      width: 224, minHeight: "100vh", background: "#fff",
      borderRight: `1px solid ${B.border}`,
      display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, bottom: 0,
      boxShadow: "2px 0 16px rgba(123,31,106,0.05)",
    }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${B.border}` }}>
        <div style={{ fontFamily: "inherit", fontSize: 19, fontWeight: 700, color: B.brand, lineHeight: 1.1 }}>
          Spazzio Diva
        </div>
        <div style={{ fontSize: 9.5, color: B.muted, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
          Salão de Beleza & Estética
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
