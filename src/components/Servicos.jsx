import { useState } from "react";
import { Plus, Scissors, Edit2, Trash2, Clock, X, Check } from "lucide-react";
import { B } from "../constants/brand";
import { currency } from "../utils/format";
import Card from "./ui/Card";
import Btn from "./ui/Btn";
import Field from "./ui/Field";
import TextArea from "./ui/TextArea";
import SectionTitle from "./ui/SectionTitle";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function Servicos({ services, onAdd, onUpdate, onDelete }) {
  const { isMobile } = useBreakpoint();
  const [modal,     setModal]     = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ name: "", price: "", duration: "", description: "" });
  const [confirmDel, setConfirmDel] = useState(false); // id do serviço aguardando confirmação

  const openAdd  = () => { setForm({ name: "", price: "", duration: "", description: "" }); setEditId(null); setModal(true); };
  const openEdit = s  => { setForm({ name: s.name, price: s.price, duration: s.duration, description: s.description || "" }); setEditId(s.id); setModal(true); };

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const d = { name: form.name, price: +form.price, duration: +form.duration || 60, description: form.description, active: true };
    if (editId) await onUpdate(editId, d);
    else        await onAdd(d);
    setSaving(false);
    setModal(false);
  };

  const toggle = (s) => onUpdate(s.id, { ...s, active: !s.active });
  const del    = (id) => { onDelete(id); setConfirmDel(false); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <SectionTitle>Serviços</SectionTitle>
          <div style={{ fontSize: 13, color: B.muted }}>{services.filter(s => s.active).length} ativos</div>
        </div>
        <Btn onClick={openAdd}><Plus size={14} /> Novo serviço</Btn>
      </div>

      {/* Grid: 1 col no mobile, 2 no tablet, 3 no desktop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
      }}>
        {services.map(s => (
          <Card key={s.id} style={{ padding: 20, opacity: s.active ? 1 : 0.55, transition: "opacity 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: B.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Scissors size={17} color={B.brand} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => openEdit(s)} style={{ border: `1.5px solid ${B.border}`, borderRadius: 6, padding: "4px 7px", background: "#fff", cursor: "pointer" }}>
                  <Edit2 size={12} color={B.muted} />
                </button>
                <button onClick={() => setConfirmDel(s.id)} style={{ border: "1.5px solid #fca5a5", borderRadius: 6, padding: "4px 7px", background: "#fff", cursor: "pointer" }}>
                  <Trash2 size={12} color="#ef4444" />
                </button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
              {s.description && <div style={{ fontSize: 12, color: B.muted, marginTop: 2 }}>{s.description}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #f5f0f4" }}>
              <div>
                <div style={{ fontFamily: "inherit", fontSize: 22, fontWeight: 700, color: B.brand }}>{currency(s.price)}</div>
                <div style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {s.duration} min</div>
              </div>
              <button onClick={() => toggle(s)} style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${s.active ? "#86efac" : "#e5e7eb"}`,
                background: s.active ? "#f0fdf4" : "#f9fafb",
                color: s.active ? "#16a34a" : B.muted, fontFamily: "inherit",
              }}>
                {s.active ? "Ativo" : "Inativo"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal confirmar exclusão */}
      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
          <Card style={{ padding: 28, width: 380, maxWidth: "90vw" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <Trash2 size={32} color="#ef4444" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 700, color: "#111" }}>Excluir serviço</div>
              <div style={{ fontSize: 13, color: B.muted, marginTop: 6, lineHeight: 1.5 }}>
                Você tem certeza que deseja excluir este serviço?<br />
                <strong style={{ color: "#374151" }}>{services.find(s => s.id === confirmDel)?.name}</strong><br />
                Esta ação não pode ser desfeita.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmDel(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="danger" onClick={() => del(confirmDel)} style={{ flex: 1 }}>
                <Trash2 size={13} /> Excluir
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <Card style={{ padding: 26, width: 400, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "inherit", fontSize: 20, fontWeight: 700 }}>{editId ? "Editar serviço" : "Novo serviço"}</div>
              <button onClick={() => setModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={17} color={B.muted} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Field label="Nome do serviço *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Corte Feminino" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Valor (R$) *"  type="number" value={form.price}    onChange={v => setForm(f => ({ ...f, price: v }))}    placeholder="80" />
                <Field label="Duração (min)" type="number" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="60" />
              </div>
              <TextArea label="Descrição" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Opcional..." />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <Btn variant="ghost"   onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={!form.name || !form.price || saving}>
                <Check size={13} /> {saving ? "Salvando…" : "Salvar"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
