import { useState } from "react";
import { Search, Plus, Phone, Edit2, History, X, Check, Users, Trash2, CreditCard } from "lucide-react";
import { B } from "../constants/brand";
import { currency, applyDiscount, ptShort, weekDay } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import Btn from "./ui/Btn";
import Field from "./ui/Field";
import TextArea from "./ui/TextArea";
import StatusBadge from "./ui/StatusBadge";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function Clientes({ clients, onAdd, onUpdate, onDelete, appointments, services, setPage }) {
  const { isMobile } = useBreakpoint();
  const [q,      setQ]      = useState("");
  const [sel,        setSel]        = useState(null);
  const [modal,      setModal]      = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({ name: "", phone: "", cpf: "", birthdate: "", notes: "" });
  const [confirmDel, setConfirmDel] = useState(false); // id do cliente aguardando confirmação
  // No mobile, controla se estamos vendo a lista ou o perfil
  const [showProfile, setShowProfile] = useState(false);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
  );

  const openAdd  = () => { setForm({ name: "", phone: "", cpf: "", birthdate: "", notes: "" }); setEditId(null); setModal(true); };
  const openEdit = c  => { setForm({ name: c.name, phone: c.phone, cpf: c.cpf || "", birthdate: c.birthdate || "", notes: c.notes || "" }); setEditId(c.id); setModal(true); };

  const save = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    if (editId) await onUpdate(editId, form);
    else        await onAdd(form);
    setSaving(false);
    setModal(false);
  };

  const del = async (id) => {
    await onDelete(id);
    if (sel === id) { setSel(null); setShowProfile(false); }
    setConfirmDel(false);
  };

  const selectClient = (id) => {
    setSel(id);
    if (isMobile) setShowProfile(true);
  };

  const selCl = sel ? clients.find(c => c.id === sel) : null;
  const hist  = selCl
    ? appointments
        .filter(a => a.clientId === selCl.id && ["completed", "no_show", "cancelled"].includes(a.status))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  // Apenas concluídos para cálculos de frequência/gasto
  const histCompleted = hist.filter(a => a.status === "completed");

  const hourBag = {}, dowBag = {}, svcBag = {};
  histCompleted.forEach(a => {
    const h = a.time.split(":")[0] + "h";
    hourBag[h] = (hourBag[h] || 0) + 1;
    const w = weekDay(a.date).split("-")[0];
    dowBag[w] = (dowBag[w] || 0) + 1;
    svcBag[a.serviceId] = (svcBag[a.serviceId] || 0) + 1;
  });
  const favHour    = Object.entries(hourBag).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favDow     = Object.entries(dowBag).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSvcId   = Object.entries(svcBag).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSvcName = topSvcId ? services.find(s => s.id === topSvcId)?.name : null;
  const totalSpent = histCompleted.reduce((s, a) => {
    const sv = services.find(x => x.id === a.serviceId);
    return s + (sv ? applyDiscount(sv.price, a.discount) : 0);
  }, 0);

  const profileContent = selCl ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <Avatar name={selCl.name} size={52} />
            <div>
              <div style={{ fontFamily: "inherit", fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>{selCl.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: B.muted, marginTop: 2 }}>
                <Phone size={11} /> {selCl.phone}
              </div>
              {selCl.cpf && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: B.muted, marginTop: 1 }}>
                  <CreditCard size={11} /> CPF: {selCl.cpf}
                </div>
              )}
              {selCl.birthdate && <div style={{ fontSize: 12, color: B.muted, marginTop: 1 }}>Nascimento: {ptShort(selCl.birthdate)}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Btn small variant="outline" onClick={() => openEdit(selCl)}><Edit2 size={12} /> Editar</Btn>
            <Btn small onClick={() => setPage("novo")}><Plus size={12} /> Agendar</Btn>
            <Btn small variant="danger" onClick={() => setConfirmDel(selCl.id)}><Trash2 size={12} /></Btn>
          </div>
        </div>
        {selCl.notes && (
          <div style={{ marginTop: 12, background: B.light, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: B.dark, borderLeft: `3px solid ${B.brand}` }}>
            {selCl.notes}
          </div>
        )}
      </Card>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 10,
      }}>
        {[
          { label: "Visitas",       value: histCompleted.length },
          { label: "Total gasto",   value: currency(totalSpent) },
          { label: "Serviço fav.",  value: topSvcName || "—" },
          { label: "Horário usual", value: favHour ? `${favHour} / ${favDow || "—"}` : "—" },
        ].map(({ label, value }) => (
          <Card key={label} style={{ padding: "13px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: B.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: B.brand, marginTop: 4, fontFamily: "inherit" }}>{value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <History size={15} color={B.brand} /> Histórico de atendimentos
        </div>
        {hist.length === 0
          ? <div style={{ fontSize: 13, color: B.muted, textAlign: "center", padding: "16px 0" }}>Nenhum atendimento registrado</div>
          : isMobile
            /* Mobile: cards verticais no lugar de tabela */
            ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hist.map(a => {
                  const sv    = services.find(s => s.id === a.serviceId);
                  const total = sv && a.status === "completed" ? applyDiscount(sv.price, a.discount) : null;
                  return (
                    <div key={a.id} style={{ borderRadius: 8, border: "1px solid #f3f4f6", padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: B.muted }}>{ptShort(a.date)} {a.time}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sv?.name || "—"}</div>
                      {total !== null && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          {a.discount
                            ? <span style={{ fontSize: 12, color: "#16a34a" }}>
                                {a.discount.type === "percent" ? `${a.discount.value}% desc.` : `${currency(a.discount.value)} desc.`}
                              </span>
                            : <span />
                          }
                          <span style={{ fontSize: 13, fontWeight: 700, color: B.brand }}>{currency(total)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
            /* Desktop: tabela */
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                      {["Data","Horário","Serviço","Status","Desconto","Total"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "5px 8px", fontSize: 10, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map(a => {
                      const sv    = services.find(s => s.id === a.serviceId);
                      const total = sv && a.status === "completed" ? applyDiscount(sv.price, a.discount) : null;
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #fafafa", opacity: a.status !== "completed" ? 0.75 : 1 }}>
                          <td style={{ padding: "8px 8px" }}>{ptShort(a.date)}</td>
                          <td style={{ padding: "8px 8px", fontWeight: 600, color: B.brand }}>{a.time}</td>
                          <td style={{ padding: "8px 8px" }}>{sv?.name || "—"}</td>
                          <td style={{ padding: "8px 8px" }}><StatusBadge status={a.status} /></td>
                          <td style={{ padding: "8px 8px" }}>
                            {a.discount && a.status === "completed"
                              ? <span style={{ color: "#16a34a", fontWeight: 600 }}>{a.discount.type === "percent" ? `${a.discount.value}%` : currency(a.discount.value)}</span>
                              : "—"}
                          </td>
                          <td style={{ padding: "8px 8px", fontWeight: 700, color: total ? B.brand : B.muted }}>
                            {total !== null ? currency(total) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
        }
      </Card>
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <Users size={44} color={B.border} style={{ margin: "0 auto 10px" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: B.text }}>Selecione uma cliente</div>
        <div style={{ fontSize: 13, color: B.muted, marginTop: 4 }}>Clique numa cliente para ver o perfil e histórico</div>
      </div>
    </div>
  );

  // Lista de clientes
  const listContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <div style={{ display: "flex", gap: 7 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: B.muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..."
            style={{ width: "100%", border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "8px 10px 8px 30px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <Btn small onClick={openAdd}><Plus size={14} /></Btn>
      </div>

      <Card style={{ flex: 1, overflowY: "auto", padding: 0 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: B.muted }}>Nenhuma cliente encontrada</div>
        )}
        {filtered.map((c, i) => {
          const last = appointments.filter(a => a.clientId === c.id && a.status === "completed")
            .sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
          return (
            <div key={c.id} onClick={() => selectClient(c.id)} style={{
              display: "flex", alignItems: "center", gap: 9, padding: "11px 14px",
              cursor: "pointer", transition: "all 0.1s",
              background: sel === c.id ? B.light : "transparent",
              borderBottom: i < filtered.length - 1 ? "1px solid #f5f0f4" : "none",
              borderLeft: sel === c.id ? `3px solid ${B.brand}` : "3px solid transparent",
            }}>
              <Avatar name={c.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{c.name}</div>
                <div style={{ fontSize: 11, color: B.muted }}>{last ? `Última visita: ${ptShort(last)}` : "Sem visitas"}</div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );

  return (
    <>
      {/* Mobile: tela de lista ou tela de perfil */}
      {isMobile ? (
        <div style={{ height: "calc(100vh - 140px)" }}>
          {showProfile && selCl ? (
            <>
              <button onClick={() => { setShowProfile(false); setSel(null); }} style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
                border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "6px 12px",
                background: "#fff", cursor: "pointer", fontSize: 13, color: B.brand, fontFamily: "inherit", fontWeight: 600,
              }}>
                ← Voltar
              </button>
              <div style={{ overflowY: "auto", maxHeight: "calc(100% - 50px)" }}>
                {profileContent}
              </div>
            </>
          ) : (
            listContent
          )}
        </div>
      ) : (
        /* Desktop: layout lado a lado */
        <div style={{ display: "flex", gap: 18, height: "calc(100vh - 72px)" }}>
          <div style={{ width: 290, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {listContent}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {profileContent}
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
          <Card style={{ padding: 28, width: 380, maxWidth: "90vw" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <Trash2 size={32} color="#ef4444" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 700, color: "#111" }}>Excluir cliente</div>
              <div style={{ fontSize: 13, color: B.muted, marginTop: 6, lineHeight: 1.5 }}>
                Você tem certeza que deseja excluir este cliente?<br />
                <strong style={{ color: "#374151" }}>{clients.find(c => c.id === confirmDel)?.name}</strong><br />
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

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <Card style={{ padding: 26, width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "inherit", fontSize: 20, fontWeight: 700 }}>{editId ? "Editar cliente" : "Nova cliente"}</div>
              <button onClick={() => setModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={17} color={B.muted} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Field label="Nome completo *"       value={form.name}      onChange={v => setForm(f => ({ ...f, name: v }))}      placeholder="Ex: Maria Silva" />
              <Field label="Telefone / WhatsApp *" value={form.phone}     onChange={v => setForm(f => ({ ...f, phone: v }))}     placeholder="71 99999-0000" />
              <Field label="CPF"                   value={form.cpf}       onChange={v => setForm(f => ({ ...f, cpf: v }))}       placeholder="000.000.000-00" />
              <Field label="Data de nascimento"    type="date" value={form.birthdate} onChange={v => setForm(f => ({ ...f, birthdate: v }))} />
              <TextArea label="Observações"        value={form.notes}     onChange={v => setForm(f => ({ ...f, notes: v }))}     placeholder="Ex: cabelo fino, alergias..." />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <Btn variant="ghost"   onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={!form.name || !form.phone || saving}>
                <Check size={13} /> {saving ? "Salvando…" : "Salvar"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
