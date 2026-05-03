import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Agenda from "./components/Agenda";
import Clientes from "./components/Clientes";
import Servicos from "./components/Servicos";
import NovoAgendamento from "./components/NovoAgendamento";
import { B } from "./constants/brand";

// ── Normaliza registro do Supabase para formato interno ──────────
function normalizeAppointment(a) {
  return {
    id:        a.id,
    clientId:  a.client_id,
    serviceId: a.service_id,
    date:      a.date,
    time:      a.time,
    status:    a.status,
    notes:     a.notes || "",
    discount:  a.discount_type
      ? { type: a.discount_type, value: Number(a.discount_value) }
      : null,
  };
}

// ── Spinner simples ──────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: 14, background: "#F9F7F9",
    }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${B.light}`,
        borderTop: `3px solid ${B.brand}`, borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <div style={{ fontSize: 13, color: B.muted }}>Carregando dados…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [page,         setPage]         = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Carrega dados iniciais ────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: svcs }, { data: clts }, { data: apts }] = await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase.from("clients").select("*").order("name"),
      supabase.from("appointments").select("*").order("date").order("time"),
    ]);
    setServices(svcs || []);
    setClients(clts || []);
    setAppointments((apts || []).map(normalizeAppointment));
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── CLIENTS CRUD ──────────────────────────────────────────────
  const addClient = async (data) => {
    const { data: row } = await supabase
      .from("clients")
      .insert({ name: data.name, phone: data.phone, birthdate: data.birthdate || null, notes: data.notes || "" })
      .select()
      .single();
    if (row) setClients(p => [...p, row]);
    return row;
  };

  const updateClient = async (id, data) => {
    await supabase
      .from("clients")
      .update({ name: data.name, phone: data.phone, birthdate: data.birthdate || null, notes: data.notes || "" })
      .eq("id", id);
    setClients(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteClient = async (id) => {
    await supabase.from("clients").delete().eq("id", id);
    setClients(p => p.filter(c => c.id !== id));
  };

  // ── SERVICES CRUD ─────────────────────────────────────────────
  const addService = async (data) => {
    const { data: row } = await supabase
      .from("services")
      .insert({ name: data.name, price: data.price, duration: data.duration, description: data.description || "", active: true })
      .select()
      .single();
    if (row) setServices(p => [...p, row]);
  };

  const updateService = async (id, data) => {
    await supabase
      .from("services")
      .update({ name: data.name, price: data.price, duration: data.duration, description: data.description || "", active: data.active })
      .eq("id", id);
    setServices(p => p.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteService = async (id) => {
    await supabase.from("services").delete().eq("id", id);
    setServices(p => p.filter(s => s.id !== id));
  };

  // ── APPOINTMENTS CRUD ─────────────────────────────────────────
  const addAppointment = async (data) => {
    const { data: row } = await supabase
      .from("appointments")
      .insert({
        client_id:      data.clientId,
        service_id:     data.serviceId,
        date:           data.date,
        time:           data.time,
        status:         "scheduled",
        notes:          data.notes || "",
        discount_type:  data.discount?.type  || null,
        discount_value: data.discount?.value || null,
      })
      .select()
      .single();
    if (row) setAppointments(p => [...p, normalizeAppointment(row)]);
  };

  const updateAppointmentStatus = async (id, status) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a));
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F9F7F9", minHeight: "100vh", display: "flex" }}>
      <Sidebar page={page} setPage={setPage} />

      <main style={{ flex: 1, marginLeft: 224, padding: "30px 32px", overflowY: "auto", minHeight: "100vh", maxHeight: "100vh" }}>
        {page === "dashboard" && (
          <Dashboard
            appointments={appointments}
            clients={clients}
            services={services}
            setPage={setPage}
          />
        )}
        {page === "agenda" && (
          <Agenda
            appointments={appointments}
            onUpdateStatus={updateAppointmentStatus}
            clients={clients}
            services={services}
            setPage={setPage}
          />
        )}
        {page === "clientes" && (
          <Clientes
            clients={clients}
            onAdd={addClient}
            onUpdate={updateClient}
            onDelete={deleteClient}
            appointments={appointments}
            services={services}
            setPage={setPage}
          />
        )}
        {page === "servicos" && (
          <Servicos
            services={services}
            onAdd={addService}
            onUpdate={updateService}
            onDelete={deleteService}
          />
        )}
        {page === "novo" && (
          <NovoAgendamento
            clients={clients}
            onAddClient={addClient}
            services={services}
            onSubmit={addAppointment}
            onCancel={() => setPage("agenda")}
          />
        )}
      </main>
    </div>
  );
}
