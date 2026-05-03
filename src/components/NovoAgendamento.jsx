import { useState } from "react";
import { ArrowLeft, Search, Plus, Clock, Tag, Percent, Banknote, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { B } from "../constants/brand";
import { todayStr } from "../constants/data";
import { currency, applyDiscount, ptFull } from "../utils/format";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import Btn from "./ui/Btn";
import Field from "./ui/Field";
import TextArea from "./ui/TextArea";
import SectionTitle from "./ui/SectionTitle";
import { useBreakpoint } from "../hooks/useBreakpoint";

const STEPS = ["Cliente", "Serviço", "Data & Hora", "Confirmar"];

const slots = [];
for (let h = 8; h < 20; h++) {
  slots.push(`${String(h).padStart(2, "0")}:00`);
  slots.push(`${String(h).padStart(2, "0")}:30`);
}

export default function NovoAgendamento({ clients, onAddClient, services, onSubmit, onCancel }) {
  const { isMobile } = useBreakpoint();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    clientId: null, serviceId: null,
    date: todayStr, time: "",
    discountOn: false, discountType: "percent", discountValue: "",
    notes: "", addNew: false,
    newName: "", newPhone: "",
  });
  const [cSearch,    setCSearch]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingCl,   setSavingCl]   = useState(false);

  const cl      = clients.find(c => c.id === form.clientId);
  const sv      = services.find(s => s.id === form.serviceId);
  const discObj = form.discountOn && form.discountValue ? { type: form.discountType, value: +form.discountValue } : null;
  const finalP  = sv ? applyDiscount(sv.price, discObj) : 0;

  const filtCl = clients.filter(c =>
    c.name.toLowerCase().includes(cSearch.toLowerCase()) || c.phone.includes(cSearch)
  );

  const addNewClient = async () => {
    if (!form.newName || !form.newPhone) return;
    setSavingCl(true);
    const nc = await onAddClient({ name: form.newName, phone: form.newPhone, birthdate: "", notes: "" });
    setSavingCl(false);
    if (nc) setForm(f => ({ ...f, clientId: nc.id, addNew: false, newName: "", newPhone: "" }));
  };

  const submit = async () => {
    setSubmitting(true);
    await onSubmit({
      clientId: form.clientId, serviceId: form.serviceId,
      date: form.date, time: form.time,
      discount: discObj, notes: form.notes,
    });
    setSubmitting(false);
    onCancel();
  };

  const canNext = [form.clientId, form.serviceId, form.date && form.time, true];

  // Número de colunas do grid de horários: 4 no mobile, 6 no desktop
  const slotCols = isMobile ? 4 : 6;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 26 }}>
        <button onClick={onCancel} style={{ border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "7px 10px", background: "#fff", cursor: "pointer" }}>
          <ArrowLeft size={15} color={B.brand} />
        </button>
        <div>
          <SectionTitle>Novo Agendamento</SectionTitle>
          <div style={{ fontSize: 13, color: B.muted }}>Passo {step} de {STEPS.length}</div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 27, height: 27, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: step > i + 1 ? "#16a34a" : step === i + 1 ? B.brand : "#e5e7eb",
                color: step >= i + 1 ? "#fff" : B.muted, fontSize: 11, fontWeight: 700,
              }}>
                {step > i + 1 ? <Check size={13} /> : i + 1}
              </div>
              {/* Oculta rótulos no mobile para economizar espaço */}
              {!isMobile && (
                <div style={{ fontSize: 10, fontWeight: 600, color: step === i + 1 ? B.brand : B.muted, marginTop: 3, textAlign: "center" }}>{s}</div>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: step > i + 1 ? "#16a34a" : "#e5e7eb", marginBottom: isMobile ? 0 : 14, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      <Card style={{ padding: isMobile ? 18 : 26 }}>
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Selecionar cliente</div>
            {!form.addNew ? (
              <>
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: B.muted }} />
                  <input value={cSearch} onChange={e => setCSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
                    style={{ width: "100%", border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "8px 10px 8px 32px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ maxHeight: 250, overflowY: "auto", border: "1.5px solid #f3f4f6", borderRadius: 8 }}>
                  {filtCl.map((c, i) => (
                    <div key={c.id} onClick={() => setForm(f => ({ ...f, clientId: c.id }))} style={{
                      display: "flex", alignItems: "center", gap: 9, padding: "9px 13px", cursor: "pointer",
                      background: form.clientId === c.id ? B.light : "#fff",
                      borderBottom: i < filtCl.length - 1 ? "1px solid #f9fafb" : "none",
                      borderLeft: form.clientId === c.id ? `3px solid ${B.brand}` : "3px solid transparent",
                    }}>
                      <Avatar name={c.name} size={30} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: B.muted }}>{c.phone}</div>
                      </div>
                      {form.clientId === c.id && <Check size={15} color={B.brand} />}
                    </div>
                  ))}
                </div>
                <button onClick={() => setForm(f => ({ ...f, addNew: true }))} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
                  marginTop: 10, border: "1.5px dashed #D4A5C9", borderRadius: 8, padding: "9px",
                  background: "transparent", cursor: "pointer", color: B.brand, fontFamily: "inherit", fontWeight: 600, fontSize: 13,
                }}>
                  <Plus size={14} /> Cadastrar nova cliente
                </button>
              </>
            ) : (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 14 }}>
                  <Field label="Nome *"     value={form.newName}  onChange={v => setForm(f => ({ ...f, newName: v }))}  placeholder="Nome completo" />
                  <Field label="Telefone *" value={form.newPhone} onChange={v => setForm(f => ({ ...f, newPhone: v }))} placeholder="71 99999-0000" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost"   onClick={() => setForm(f => ({ ...f, addNew: false }))}>Voltar</Btn>
                  <Btn variant="primary" onClick={addNewClient} disabled={!form.newName || !form.newPhone || savingCl}>
                    <Check size={13} /> {savingCl ? "Salvando…" : "Cadastrar"}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Serviço e desconto</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {services.filter(s => s.active).map(s => (
                <div key={s.id} onClick={() => setForm(f => ({ ...f, serviceId: s.id }))} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 15px", border: `1.5px solid ${form.serviceId === s.id ? B.brand : B.border}`,
                  borderRadius: 9, cursor: "pointer",
                  background: form.serviceId === s.id ? B.light : "#fff", transition: "all 0.15s",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}><Clock size={10} /> {s.duration} min</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 700, color: B.brand }}>{currency(s.price)}</div>
                    {form.serviceId === s.id && <Check size={15} color={B.brand} />}
                  </div>
                </div>
              ))}
            </div>

            {form.serviceId && (
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    <Tag size={14} color={B.brand} /> Aplicar desconto
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, discountOn: !f.discountOn, discountValue: "" }))}
                    style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: form.discountOn ? B.brand : "#e5e7eb", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: form.discountOn ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </button>
                </div>
                {form.discountOn && (
                  <div>
                    <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
                      {[{ id: "percent", label: "Percentual (%)", Icon: Percent }, { id: "fixed", label: "Valor fixo (R$)", Icon: Banknote }].map(({ id, label, Icon }) => (
                        <button key={id} onClick={() => setForm(f => ({ ...f, discountType: id, discountValue: "" }))} style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px", border: `1.5px solid ${form.discountType === id ? B.brand : B.border}`,
                          borderRadius: 8, background: form.discountType === id ? B.light : "#fff",
                          cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: isMobile ? 11 : 12,
                          color: form.discountType === id ? B.brand : B.muted,
                        }}>
                          <Icon size={13} /> {label}
                        </button>
                      ))}
                    </div>
                    <Field
                      label={form.discountType === "percent" ? "Percentual (%)" : "Valor (R$)"}
                      type="number" value={form.discountValue}
                      onChange={v => setForm(f => ({ ...f, discountValue: v }))}
                      placeholder={form.discountType === "percent" ? "Ex: 10" : "Ex: 20"}
                    />
                    {form.discountValue && sv && (
                      <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: B.muted }}>
                          <span>Valor original</span>
                          <span style={{ textDecoration: "line-through" }}>{currency(sv.price)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, color: "#16a34a", marginTop: 5 }}>
                          <span>Valor final</span><span>{currency(finalP)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Data e horário</div>
            <Field label="Data *" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v, time: "" }))} style={{ marginBottom: 16 }} />
            <div style={{ fontWeight: 600, fontSize: 12, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Selecione o horário</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${slotCols}, 1fr)`, gap: 6, marginBottom: 18 }}>
              {slots.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, time: t }))} style={{
                  padding: "8px 3px", border: `1.5px solid ${form.time === t ? B.brand : B.border}`,
                  borderRadius: 8, background: form.time === t ? B.brand : "#fff",
                  color: form.time === t ? "#fff" : B.text, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 600, fontSize: isMobile ? 11 : 12, transition: "all 0.1s",
                }}>{t}</button>
              ))}
            </div>
            <TextArea label="Observações (opcional)" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Ex: cliente quer mechas mais claras..." />
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Confirmar agendamento</div>
            <div style={{ background: B.light, borderRadius: 10, padding: isMobile ? 14 : 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${B.border}` }}>
                <Avatar name={cl?.name || "?"} size={44} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{cl?.name}</div>
                  <div style={{ fontSize: 12, color: B.muted }}>{cl?.phone}</div>
                </div>
              </div>
              {[
                ["Serviço",  sv?.name],
                ["Data",     ptFull(form.date)],
                ["Horário",  form.time],
                ["Duração",  `${sv?.duration} min`],
                ["Valor",    sv ? currency(sv.price) : "—"],
                ...(discObj ? [["Desconto", discObj.type === "percent" ? `${discObj.value}%` : currency(discObj.value)]] : []),
                ["Total",    currency(finalP)],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between", fontSize: k === "Total" ? 15 : 13,
                  padding: "6px 0", borderBottom: k === "Total" ? "none" : `1px solid ${B.border}`,
                }}>
                  <span style={{ color: B.muted }}>{k}</span>
                  <span style={{ fontWeight: k === "Total" ? 700 : 600, color: k === "Total" ? B.brand : B.text }}>{v}</span>
                </div>
              ))}
            </div>
            {form.notes && (
              <div style={{ background: "#fafafa", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>Obs:</strong> {form.notes}
              </div>
            )}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Btn variant="ghost" onClick={() => step === 1 ? onCancel() : setStep(s => s - 1)}>
          <ChevronLeft size={14} /> {step === 1 ? "Cancelar" : "Voltar"}
        </Btn>
        {step < 4
          ? <Btn variant="primary" disabled={!canNext[step - 1]} onClick={() => setStep(s => s + 1)}>
              Continuar <ChevronRight size={14} />
            </Btn>
          : <Btn variant="primary" onClick={submit} disabled={submitting}>
              <Check size={14} /> {submitting ? "Salvando…" : "Confirmar"}
            </Btn>
        }
      </div>
    </div>
  );
}
