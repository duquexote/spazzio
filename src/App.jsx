import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Agenda from "./components/Agenda";
import Clientes from "./components/Clientes";
import Servicos from "./components/Servicos";
import NovoAgendamento from "./components/NovoAgendamento";
import { B } from "./constants/brand";
import { useBreakpoint } from "./hooks/useBreakpoint";

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
  const { isMobile } = useBreakpoint();
  const [page,         setPage]         = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);

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

  // CLIENTS
  const addClient = async (data) => {
    const { data: row } = await supabase
      .from("clients")
      .insert({ name: data.name, phone: data.phone, birthdate: data.birthdate || null, notes: data.notes || "" })
      .select().single();
    if (row) setClients(p => [...p, row]);
    return row;
  };
  const updateClient = async (id, data) => {
    await supabase.from("clients")
      .update({ name: data.name, phone: data.phone, birthdate: data.birthdate || null, notes: data.notes || "" })
      .eq("id", id);
    setClients(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const deleteClient = async (id) => {
    await supabase.from("clients").delete().eq("id", id);
    setClients(p => p.filter(c => c.id !== id));
  };

  // SERVICES
  const addService = async (data) => {
    const { data: row } = await supabase
      .from("services")
      .insert({ name: data.name, price: data.price, duration: data.duration, description: data.description || "", active: true })
      .select().single();
    if (row) setServices(p => [...p, row]);
  };
  const updateService = async (id, data) => {
    await supabase.from("services")
      .update({ name: data.name, price: data.price, duration: data.duration, description: data.description || "", active: data.active })
      .eq("id", id);
    setServices(p => p.map(s => s.id === id ? { ...s, ...data } : s));
  };
  const deleteService = async (id) => {
    await supabase.from("services").delete().eq("id", id);
    setServices(p => p.filter(s => s.id !== id));
  };

  // APPOINTMENTS
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
      .select().single();
    if (row) setAppointments(p => [...p, normalizeAppointment(row)]);
  };
  const updateAppointmentStatus = async (id, status) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a));
  };

  if (loading) return <Spinner />;

  const mainStyle = {
    flex: 1,
    marginLeft: isMobile ? 0 : 224,
    padding: isMobile ? "72px 16px 80px" : "30px 32px",
    overflowY: "auto",
    minHeight: "100vh",
    maxHeight: isMobile ? "none" : "100vh",
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F9F7F9", minHeight: "100vh", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4A5C9; border-radius: 3px; }
        input[type]:focus, textarea:focus { border-color: #7B1F6A !important; box-shadow: 0 0 0 3px rgba(123,31,106,0.12); }
        button:not(:disabled):hover { filter: brightness(0.94); }
      `}</style>

      <Sidebar page={page} setPage={setPage} />

      <main style={mainStyle}>
        {page === "dashboard" && (
          <Dashboard appointments={appointments} clients={clients} services={services} setPage={setPage} />
        )}
        {page === "agenda" && (
          <Agenda appointments={appointments} onUpdateStatus={updateAppointmentStatus} clients={clients} services={services} setPage={setPage} />
        )}
        {page === "clientes" && (
          <Clientes clients={clients} onAdd={addClient} onUpdate={updateClient} onDelete={deleteClient} appointments={appointments} services={services} setPage={setPage} />
        )}
        {page === "servicos" && (
          <Servicos services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} />
        )}
        {page === "novo" && (
          <NovoAgendamento clients={clients} onAddClient={addClient} services={services} onSubmit={addAppointment} onCancel={() => setPage("agenda")} />
        )}
      </main>
    </div>
  );
}
