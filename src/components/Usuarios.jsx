import { useState } from "react";
import { supabase } from "../supabase";
import { B } from "../constants/brand";
import { Plus, Shield, User2, X, Check, Power, Edit2, Trash2, Lock, KeyRound, Eye, EyeOff, Users, ChevronDown, ChevronUp } from "lucide-react";
import Card from "./ui/Card";
import Btn from "./ui/Btn";
import SectionTitle from "./ui/SectionTitle";
import Avatar from "./ui/Avatar";
import Field from "./ui/Field";
import { useBreakpoint } from "../hooks/useBreakpoint";

const ROLE_LABEL = { admin: "Administrador", manicure: "Manicure", receptionist: "Recepcionista" };
const ROLE_COLOR = {
  admin:       { color: B.brand,    bg: B.light,   border: B.border },
  manicure:    { color: "#0891b2",  bg: "#ecfeff", border: "#a5f3fc" },
  receptionist:{ color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
};

export default function Usuarios({ profiles, session, onRefresh, onUpdateProfile, onDeleteProfile, onChangeMyPassword, appointments = [], clients = [] }) {
  const { isMobile } = useBreakpoint();

  // ── Clientes atendidos por funcionária ──────────────────────────
  const [expandedId, setExpandedId] = useState(null);
  const clientsAttendedBy = (profileId) => {
    const byClient = {};
    appointments
      .filter(a => a.employeeId === profileId && a.status === "completed")
      .forEach(a => { byClient[a.clientId] = (byClient[a.clientId] || 0) + 1; });
    return Object.entries(byClient)
      .map(([clientId, count]) => ({ client: clients.find(c => c.id === clientId), count }))
      .filter(x => x.client)
      .sort((a, b) => b.count - a.count);
  };

  // ── Criar usuário ─────────────────────────────────────────────
  const [createModal, setCreateModal] = useState(false);
  const [createForm,  setCreateForm]  = useState({ name: "", email: "", password: "", role: "manicure" });
  const [createErr,   setCreateErr]   = useState("");
  const [creating,    setCreating]    = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);

  // ── Editar usuário ────────────────────────────────────────────
  const [editTarget,  setEditTarget]  = useState(null); // profile obj
  const [editForm,    setEditForm]    = useState({ name: "", role: "manicure", newPassword: "" });
  const [editErr,     setEditErr]     = useState("");
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [showEditPw,  setShowEditPw]  = useState(false);

  // ── Minha senha (admin) ───────────────────────────────────────
  const [pwModal,  setPwModal]  = useState(false);
  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwErr,    setPwErr]    = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // ── Criar ─────────────────────────────────────────────────────
  const openCreate = () => { setCreateForm({ name: "", email: "", password: "", role: "manicure" }); setCreateErr(""); setCreateModal(true); };
  const createUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return;
    setCreating(true); setCreateErr("");
    const { data, error: fnErr } = await supabase.functions.invoke("create-user", {
      body: { name: createForm.name, email: createForm.email, password: createForm.password, role: createForm.role },
    });
    if (fnErr || data?.error) {
      setCreateErr(data?.error || fnErr?.message || "Erro ao criar usuário");
      setCreating(false); return;
    }
    setCreating(false); setCreateModal(false); onRefresh();
  };

  // ── Editar ────────────────────────────────────────────────────
  const openEdit = (p) => {
    setEditTarget(p);
    setEditForm({ name: p.name, role: p.role, newPassword: "" });
    setEditErr(""); setConfirmDel(false);
  };
  const saveEdit = async () => {
    if (!editForm.name) return;
    setSaving(true); setEditErr("");
    await onUpdateProfile(editTarget.id, { name: editForm.name, role: editForm.role, newPassword: editForm.newPassword || null });
    setSaving(false); setEditTarget(null);
  };
  const handleDelete = async () => {
    setSaving(true); setEditErr("");
    const err = await onDeleteProfile(editTarget.id);
    setSaving(false);
    if (err) { setEditErr(err); return; }
    setEditTarget(null);
  };

  // ── Toggle ativo ──────────────────────────────────────────────
  const toggleActive = async (p) => {
    await supabase.from("profiles").update({ active: !p.active }).eq("id", p.id);
    onRefresh();
  };

  // ── Trocar minha senha ────────────────────────────────────────
  const changeMyPw = async () => {
    if (!pwForm.next || pwForm.next.length < 6) { setPwErr("A senha deve ter pelo menos 6 caracteres."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwErr("As senhas não coincidem."); return; }
    setPwSaving(true); setPwErr("");
    const err = await onChangeMyPassword(pwForm.next);
    setPwSaving(false);
    if (err) { setPwErr(err.message || "Erro ao atualizar senha."); return; }
    setPwModal(false); setPwForm({ current: "", next: "", confirm: "" });
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
        <div>
          <SectionTitle>Usuários</SectionTitle>
          <div style={{ fontSize: 13, color: B.muted }}>{profiles.length} cadastrado{profiles.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="outline" onClick={() => setPwModal(true)}><Lock size={14} /> Minha senha</Btn>
          <Btn onClick={openCreate}><Plus size={14} /> Novo usuário</Btn>
        </div>
      </div>

      {/* ── Lista ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {profiles.map(p => {
          const rc       = ROLE_COLOR[p.role] || ROLE_COLOR.employee;
          const isMe     = p.id === session?.user?.id;
          const expanded = expandedId === p.id;
          const attended = expanded ? clientsAttendedBy(p.id) : [];
          return (
            <Card key={p.id} style={{ padding: "16px 20px", opacity: p.active ? 1 : 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <Avatar name={p.name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {p.name} {isMe && <span style={{ fontSize: 10, background: B.light, color: B.brand, border: `1px solid ${B.border}`, borderRadius: 10, padding: "1px 6px", marginLeft: 4 }}>Você</span>}
                  </div>
                  <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>{p.email || "—"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}`, display: "flex", alignItems: "center", gap: 4 }}>
                    {p.role === "admin" ? <Shield size={10} /> : <User2 size={10} />}
                    {ROLE_LABEL[p.role] || p.role}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: p.active ? "#16a34a" : "#9ca3af", background: p.active ? "#f0fdf4" : "#f9fafb", border: `1px solid ${p.active ? "#86efac" : "#e5e7eb"}` }}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                  {p.role !== "admin" && (
                    <button onClick={() => setExpandedId(expanded ? null : p.id)} title="Clientes atendidos" style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "5px 9px", background: expanded ? B.light : "#fff", cursor: "pointer" }}>
                      <Users size={14} color={B.muted} />
                      {expanded ? <ChevronUp size={12} color={B.muted} /> : <ChevronDown size={12} color={B.muted} />}
                    </button>
                  )}
                  <button onClick={() => openEdit(p)} title="Editar" style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "5px 9px", background: "#fff", cursor: "pointer" }}>
                    <Edit2 size={14} color={B.muted} />
                  </button>
                  <button onClick={() => toggleActive(p)} title={p.active ? "Desativar" : "Ativar"} style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "5px 9px", background: "#fff", cursor: "pointer" }}>
                    <Power size={14} color={p.active ? "#dc2626" : "#16a34a"} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                    Clientes atendidos ({attended.length})
                  </div>
                  {attended.length === 0
                    ? <div style={{ fontSize: 13, color: B.muted }}>Nenhum atendimento concluído ainda</div>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {attended.map(({ client, count }) => (
                          <div key={client.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 8, background: "#fafafa" }}>
                            <Avatar name={client.name} size={26} />
                            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: B.brand, background: B.light, borderRadius: 10, padding: "1px 8px", flexShrink: 0 }}>
                              {count} atend.
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              )}
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

      {/* ── Modal: Criar usuário ────────────────────────────────── */}
      {createModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <Card style={{ padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Novo usuário</div>
              <button onClick={() => setCreateModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} color={B.muted} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Nome completo *" value={createForm.name} onChange={v => setCreateForm(f => ({ ...f, name: v }))} placeholder="Ex: Juliana Souza" />
              <Field label="E-mail *" type="email" value={createForm.email} onChange={v => setCreateForm(f => ({ ...f, email: v }))} placeholder="julia@spazzio.com" />
              {/* Campo senha com toggle */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Senha inicial *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCreatePw ? "text" : "password"}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    style={{
                      border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "8px 38px 8px 11px",
                      fontSize: 14, fontFamily: "inherit", outline: "none",
                      color: B.text, background: "#fff", width: "100%", boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePw(v => !v)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      border: "none", background: "none", cursor: "pointer", padding: 2,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showCreatePw ? <EyeOff size={16} color={B.muted} /> : <Eye size={16} color={B.muted} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de acesso *</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { value: "manicure",     label: "Manicure",      Icon: User2,  desc: "Vê seus apts" },
                    { value: "receptionist", label: "Recepcionista",  Icon: User2,  desc: "Vê faturamento" },
                    { value: "admin",        label: "Administrador",  Icon: Shield, desc: "Acesso completo" },
                  ].map(({ value, label, Icon, desc }) => {
                    const active = createForm.role === value;
                    const rc = ROLE_COLOR[value];
                    return (
                      <button key={value} onClick={() => setCreateForm(f => ({ ...f, role: value }))} type="button" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", border: `2px solid ${active ? rc.color : B.border}`, borderRadius: 10, cursor: "pointer", background: active ? rc.bg : "#fff", fontFamily: "inherit", transition: "all 0.15s" }}>
                        <Icon size={20} color={active ? rc.color : B.muted} />
                        <div style={{ fontWeight: 700, fontSize: 12, color: active ? rc.color : B.text }}>{label}</div>
                        <div style={{ fontSize: 10, color: B.muted }}>{desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {createErr && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#dc2626" }}>{createErr}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setCreateModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={createUser} disabled={!createForm.name || !createForm.email || !createForm.password || creating}>
                <Check size={13} /> {creating ? "Criando…" : "Criar usuário"}
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal: Editar usuário ───────────────────────────────── */}
      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <Card style={{ padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Editar usuário</div>
              <button onClick={() => setEditTarget(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} color={B.muted} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Nome completo *" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} placeholder="Nome completo" />

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de acesso</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { value: "manicure",     label: "Manicure",      Icon: User2  },
                    { value: "receptionist", label: "Recepcionista",  Icon: User2  },
                    { value: "admin",        label: "Administrador",  Icon: Shield },
                  ].map(({ value, label, Icon }) => {
                    const active = editForm.role === value;
                    const rc = ROLE_COLOR[value];
                    return (
                      <button key={value} onClick={() => setEditForm(f => ({ ...f, role: value }))} type="button" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 8px", border: `2px solid ${active ? rc.color : B.border}`, borderRadius: 10, cursor: "pointer", background: active ? rc.bg : "#fff", fontFamily: "inherit" }}>
                        <Icon size={14} color={active ? rc.color : B.muted} />
                        <span style={{ fontWeight: 600, fontSize: 12, color: active ? rc.color : B.text }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  <KeyRound size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Nova senha (deixe em branco para manter)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showEditPw ? "text" : "password"}
                    value={editForm.newPassword}
                    onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    style={{
                      border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "8px 38px 8px 11px",
                      fontSize: 14, fontFamily: "inherit", outline: "none",
                      color: B.text, background: "#fff", width: "100%", boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPw(v => !v)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      border: "none", background: "none", cursor: "pointer", padding: 2,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showEditPw ? <EyeOff size={16} color={B.muted} /> : <Eye size={16} color={B.muted} />}
                  </button>
                </div>
              </div>

              {editErr && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#dc2626" }}>{editErr}</div>}
            </div>

            {confirmDel ? (
              <div style={{ marginTop: 18, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 12 }}>⚠️ Excluir <strong>{editTarget.name}</strong> permanentemente?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setConfirmDel(false)} style={{ flex: 1 }}>Cancelar</Btn>
                  <Btn variant="danger" onClick={handleDelete} disabled={saving} style={{ flex: 1 }}>
                    <Trash2 size={13} /> {saving ? "Excluindo…" : "Excluir"}
                  </Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "space-between" }}>
                <Btn variant="danger" onClick={() => setConfirmDel(true)}><Trash2 size={13} /> Excluir</Btn>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setEditTarget(null)}>Cancelar</Btn>
                  <Btn variant="primary" onClick={saveEdit} disabled={!editForm.name || saving}>
                    <Check size={13} /> {saving ? "Salvando…" : "Salvar"}
                  </Btn>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Modal: Minha senha ──────────────────────────────────── */}
      {pwModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <Card style={{ padding: 28, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={18} color={B.brand} /> Trocar minha senha
              </div>
              <button onClick={() => setPwModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} color={B.muted} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Field label="Nova senha *" type="password" value={pwForm.next} onChange={v => setPwForm(f => ({ ...f, next: v }))} placeholder="Mínimo 6 caracteres" />
              <Field label="Confirmar nova senha *" type="password" value={pwForm.confirm} onChange={v => setPwForm(f => ({ ...f, confirm: v }))} placeholder="Repita a nova senha" />
              {pwErr && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#dc2626" }}>{pwErr}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setPwModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={changeMyPw} disabled={!pwForm.next || !pwForm.confirm || pwSaving}>
                <Check size={13} /> {pwSaving ? "Salvando…" : "Atualizar senha"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
