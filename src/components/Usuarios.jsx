import { useState } from "react";
import { supabase } from "../supabase";
import { B } from "../constants/brand";
import { Plus, Shield, User2, X, Check, Power } from "lucide-react";
import Card from "./ui/Card";
import Btn from "./ui/Btn";
import SectionTitle from "./ui/SectionTitle";
import Avatar from "./ui/Avatar";
import Field from "./ui/Field";
import { useBreakpoint } from "../hooks/useBreakpoint";

const ROLE_LABEL = { admin: "Administrador", employee: "Funcionário" };
const ROLE_COLOR = { admin: { color: B.brand, bg: B.light, border: B.border }, employee: { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" } };

export default function Usuarios({ profiles, onRefresh }) {
  const { isMobile } = useBreakpoint();
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ name: "", email: "", password: "", role: "employee" });

  const openModal = () => { setForm({ name: "", email: "", password: "", role: "employee" }); setError(""); setModal(true); };

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    setError("");

    // Chama a Edge Function que usa a Admin API (email já confirmado, sem envio de email)
    const { data, error: fnErr } = await supabase.functions.invoke("create-user", {
      body: { name: form.name, email: form.email, password: form.password, role: form.role },
    });

    if (fnErr || data?.error) {
      setError(data?.error || fnErr?.message || "Erro ao criar usuário");
      setSaving(false);
      return;
    }

    setSaving(false);
    setModal(false);
    onRefresh();
  };

  const toggleActive = async (p) => {
    await supabase.from("profiles").update({ active: !p.active }).eq("id", p.id);
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <SectionTitle>Usuários</SectionTitle>
          <div style={{ fontSize: 13, color: B.muted }}>{profiles.length} cadastrado{profiles.length !== 1 ? "s" : ""}</div>
        </div>
        <Btn onClick={openModal}><Plus size={14} /> Novo usuário</Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {profiles.map(p => {
          const rc = ROLE_COLOR[p.role] || ROLE_COLOR.employee;
          return (
            <Card key={p.id} style={{ padding: "16px 20px", opacity: p.active ? 1 : 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <Avatar name={p.name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>{p.email || "—"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Badge de role */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    color: rc.color, background: rc.bg, border: `1px solid ${rc.border}`,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {p.role === "admin" ? <Shield size={10} /> : <User2 size={10} />}
                    {ROLE_LABEL[p.role]}
                  </span>

                  {/* Badge ativo/inativo */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                    color: p.active ? "#16a34a" : "#9ca3af",
                    background: p.active ? "#f0fdf4" : "#f9fafb",
                    border: `1px solid ${p.active ? "#86efac" : "#e5e7eb"}`,
                  }}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>

                  {/* Toggle */}
                  <button onClick={() => toggleActive(p)} title={p.active ? "Desativar" : "Ativar"} style={{
                    border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "5px 9px",
                    background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  }}>
                    <Power size={14} color={p.active ? "#dc2626" : "#16a34a"} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {profiles.length === 0 && (
          <Card style={{ padding: 32, textAlign: "center" }}>
            <Shield size={36} color={B.border} style={{ margin: "0 auto 10px" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: B.text }}>Nenhum usuário cadastrado</div>
            <div style={{ fontSize: 13, color: B.muted, marginTop: 4 }}>Crie o primeiro usuário clicando em "Novo usuário"</div>
          </Card>
        )}
      </div>

      {/* Modal criar usuário */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <Card style={{ padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Novo usuário</div>
              <button onClick={() => setModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={18} color={B.muted} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Nome completo *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Juliana Souza" />
              <Field label="E-mail *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="julia@spazzio.com" />
              <Field label="Senha inicial *" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="Mínimo 6 caracteres" />

              {/* Role */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Tipo de acesso *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { value: "employee", label: "Funcionário", Icon: User2, desc: "Vê apenas o dia" },
                    { value: "admin",    label: "Administrador", Icon: Shield, desc: "Acesso completo" },
                  ].map(({ value, label, Icon, desc }) => (
                    <button key={value} onClick={() => setForm(f => ({ ...f, role: value }))} type="button" style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      padding: "12px 8px", border: `2px solid ${form.role === value ? B.brand : B.border}`,
                      borderRadius: 10, cursor: "pointer", background: form.role === value ? B.light : "#fff",
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}>
                      <Icon size={20} color={form.role === value ? B.brand : B.muted} />
                      <div style={{ fontWeight: 700, fontSize: 13, color: form.role === value ? B.brand : B.text }}>{label}</div>
                      <div style={{ fontSize: 11, color: B.muted }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#dc2626" }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={createUser} disabled={!form.name || !form.email || !form.password || saving}>
                <Check size={13} /> {saving ? "Criando…" : "Criar usuário"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
