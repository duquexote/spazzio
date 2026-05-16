import { LayoutDashboard, Calendar, Users, Scissors, Plus, Shield, LogOut, BadgeDollarSign } from "lucide-react";
import { B } from "../constants/brand";
import { useBreakpoint } from "../hooks/useBreakpoint";

const NAV_BASE = [
  { id: "dashboard",  label: "Dashboard",   Icon: LayoutDashboard },
  { id: "agenda",     label: "Agenda",      Icon: Calendar },
  { id: "clientes",   label: "Clientes",    Icon: Users },
  { id: "servicos",   label: "Serviços",    Icon: Scissors },
];

const NAV_COMMISSION = { id: "comissoes", label: "Comissões", Icon: BadgeDollarSign };
const NAV_ADMIN      = { id: "usuarios",  label: "Usuários",  Icon: Shield };

export default function Sidebar({ page, setPage, profile, onLogout }) {
  const { isMobile } = useBreakpoint();
  const isAdmin     = profile?.role === "admin";
  const isManicure  = profile?.role === "manicure";

  const NAV = isAdmin
    ? [...NAV_BASE, NAV_COMMISSION, NAV_ADMIN]
    : isManicure
      ? [...NAV_BASE, NAV_COMMISSION]
      : NAV_BASE;

  // ── Mobile: header + bottom nav ───────────────────────────────
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
            <div style={{ fontSize: 18, fontWeight: 700, color: B.brand, lineHeight: 1 }}>
              Spazzio Diva
            </div>
            <div style={{ fontSize: 9, color: B.muted, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {profile?.name || "Salão de Beleza"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPage("novo")} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 13px", borderRadius: 10, border: "none",
              background: B.brand, color: "#fff", fontFamily: "inherit",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              <Plus size={14} /> Agendar
            </button>
            <button onClick={onLogout} title="Sair" style={{
              border: `1.5px solid ${B.border}`, borderRadius: 10, padding: "8px 10px",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            }}>
              <LogOut size={15} color={B.muted} />
            </button>
          </div>
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
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${B.border}` }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: B.brand, lineHeight: 1.1 }}>
          Spazzio Diva
        </div>
        <div style={{ fontSize: 9.5, color: B.muted, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
          Salão de Beleza & Estética
        </div>
      </div>

      {/* Nav */}
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

      {/* Rodapé: perfil + logout */}
      <div style={{ padding: 14, borderTop: `1px solid ${B.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => setPage("novo")} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          width: "100%", padding: "10px", borderRadius: 10, border: "none",
          background: B.brand, color: "#fff", fontFamily: "inherit",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          <Plus size={15} /> Novo Agendamento
        </button>

        {/* Info do usuário */}
        {profile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
            borderRadius: 8, background: B.light,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: B.brand,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: B.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
              <div style={{ fontSize: 10, color: B.muted, textTransform: "capitalize" }}>{profile.role === "admin" ? "Administrador" : "Funcionário"}</div>
            </div>
            <button onClick={onLogout} title="Sair" style={{ border: "none", background: "none", cursor: "pointer", padding: 3 }}>
              <LogOut size={14} color={B.muted} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
