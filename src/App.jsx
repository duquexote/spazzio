import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Agenda from "./components/Agenda";
import Clientes from "./components/Clientes";
import Servicos from "./components/Servicos";
import NovoAgendamento from "./components/NovoAgendamento";
import Usuarios from "./components/Usuarios";
import Comissoes from "./components/Comissoes";
import Login from "./components/Login";
import { B } from "./constants/brand";
import { useBreakpoint } from "./hooks/useBreakpoint";

function normalizeAppointment(a, serviceIds = null) {
  // serviceIds vem do join com appointment_services
  // se não fornecido, usa o service_id legado
  const ids = serviceIds ?? (a.service_id ? [a.service_id] : []);
  return {
    id:            a.id,
    clientId:      a.client_id,
    serviceId:     ids[0] || a.service_id || null, // compatibilidade
    serviceIds:    ids,                             // múltiplos serviços
    employeeId:    a.employee_id || null,
    date:          a.date,
    time:          a.time,
    status:        a.status,
    notes:         a.notes || "",
    paymentMethod: a.payment_method || null,
    discount:      a.discount_type
      ? { type: a.discount_type, value: Number(a.discount_value) }
      : null,
  };
}

function Spinner({ text = "Carregando dados…" }) {
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
      <div style={{ fontSize: 13, color: B.muted }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const { isMobile } = useBreakpoint();

  // ── Auth state ────────────────────────────────────────────────
  const [session,  setSession]  = useState(undefined); // undefined = ainda carregando
  const [profile,  setProfile]  = useState(null);

  // ── App data ──────────────────────────────────────────────────
  const [page,         setPage]         = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [services,     setServices]     = useState([]);
  const [profiles,     setProfiles]     = useState([]);   // todos os usuários (admin/employee)
  const [loading,      setLoading]      = useState(true);

  // ── Auth listener ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Carregar perfil do usuário logado ─────────────────────────
  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data || null));
  }, [session]);

  // ── Carregar todos os dados ───────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: svcs }, { data: clts }, { data: apts }, { data: profs }, { data: aptSvcs }] = await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase.from("clients").select("*").order("name"),
      supabase.from("appointments").select("*").order("date").order("time"),
      supabase.from("profiles").select("*").order("name"),
      supabase.from("appointment_services").select("appointment_id, service_id"),
    ]);
    setServices(svcs || []);
    setClients(clts || []);
    // Mapeia: appointmentId → [serviceId, ...]
    const svcMap = {};
    (aptSvcs || []).forEach(({ appointment_id, service_id }) => {
      if (!svcMap[appointment_id]) svcMap[appointment_id] = [];
      svcMap[appointment_id].push(service_id);
    });
    setAppointments((apts || []).map(a => normalizeAppointment(a, svcMap[a.id] || null)));
    setProfiles(profs || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) loadAll();
  }, [session, loadAll]);

  // ── CLIENTS ───────────────────────────────────────────────────
  const addClient = async (data) => {
    const { data: row } = await supabase
      .from("clients")
      .insert({ name: data.name, phone: data.phone, cpf: data.cpf || "", birthdate: data.birthdate || null, notes: data.notes || "" })
      .select().single();
    if (row) setClients(p => [...p, row]);
    return row;
  };
  const updateClient = async (id, data) => {
    await supabase.from("clients")
      .update({ name: data.name, phone: data.phone, cpf: data.cpf || "", birthdate: data.birthdate || null, notes: data.notes || "" })
      .eq("id", id);
    setClients(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const deleteClient = async (id) => {
    await supabase.from("clients").delete().eq("id", id);
    setClients(p => p.filter(c => c.id !== id));
  };

  // ── SERVICES ──────────────────────────────────────────────────
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

  // ── APPOINTMENTS ──────────────────────────────────────────────
  const addAppointment = async (data) => {
    // serviceIds é array; serviceId é o primeiro (para campo legado)
    const serviceIds = data.serviceIds || (data.serviceId ? [data.serviceId] : []);
    const firstServiceId = serviceIds[0] || null;

    const { data: row } = await supabase
      .from("appointments")
      .insert({
        client_id:      data.clientId,
        service_id:     firstServiceId,
        employee_id:    data.employeeId || null,
        date:           data.date,
        time:           data.time,
        status:         "scheduled",
        notes:          data.notes || "",
        discount_type:  data.discount?.type  || null,
        discount_value: data.discount?.value || null,
      })
      .select().single();

    if (row && serviceIds.length > 0) {
      // Inserir todos os serviços na tabela de relação
      await supabase.from("appointment_services").insert(
        serviceIds.map(sid => ({ appointment_id: row.id, service_id: sid }))
      );
    }

    if (row) setAppointments(p => [...p, normalizeAppointment(row, serviceIds)]);
  };
  const updateAppointmentStatus = async (id, status, paymentMethod = null) => {
    const payload = { status };
    if (paymentMethod) payload.payment_method = paymentMethod;
    await supabase.from("appointments").update(payload).eq("id", id);
    setAppointments(p => p.map(a => a.id === id
      ? { ...a, status, paymentMethod: paymentMethod || a.paymentMethod }
      : a));
  };

  const updateAppointment = async (id, data) => {
    const serviceIds = data.serviceIds || (data.serviceId ? [data.serviceId] : null);
    const firstServiceId = serviceIds?.[0] || null;

    const payload = {
      date:           data.date,
      time:           data.time,
      notes:          data.notes || "",
      discount_type:  data.discount?.type  || null,
      discount_value: data.discount?.value || null,
      ...(firstServiceId ? { service_id: firstServiceId } : {}),
    };
    await supabase.from("appointments").update(payload).eq("id", id);

    // Atualiza tabela de relação se vieram serviceIds
    if (serviceIds && serviceIds.length > 0) {
      await supabase.from("appointment_services").delete().eq("appointment_id", id);
      await supabase.from("appointment_services").insert(
        serviceIds.map(sid => ({ appointment_id: id, service_id: sid }))
      );
    }

    setAppointments(p => p.map(a => a.id === id ? {
      ...a,
      date:      data.date,
      time:      data.time,
      notes:     data.notes || "",
      discount:  data.discount || null,
      ...(serviceIds ? { serviceId: serviceIds[0] || a.serviceId, serviceIds } : {}),
    } : a));
  };

  const deleteAppointment = async (id) => {
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments(p => p.filter(a => a.id !== id));
  };

  // ── USERS (admin only) ────────────────────────────────────────
  const updateUserProfile = async (id, data) => {
    // Atualiza nome na tabela profiles
    await supabase.from("profiles").update({ name: data.name, role: data.role }).eq("id", id);
    // Se veio nova senha, usa admin API via edge function (ou auth.updateUser se for o próprio usuário)
    if (data.newPassword) {
      // Para o admin alterar senha de outro usuário precisamos de service_role
      // Usamos a função edge ou, se for o próprio usuário:
      if (id === session?.user?.id) {
        await supabase.auth.updateUser({ password: data.newPassword });
      }
    }
    setProfiles(p => p.map(u => u.id === id ? { ...u, name: data.name, role: data.role } : u));
  };

  const deleteUserProfile = async (id) => {
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { userId: id },
    });
    if (error || data?.error) {
      return data?.error || error?.message || "Erro ao excluir usuário";
    }
    setProfiles(p => p.filter(u => u.id !== id));
    return null;
  };

  const changeMyPassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error;
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = () => supabase.auth.signOut();

  // ── Renderização ──────────────────────────────────────────────

  // Ainda resolvendo sessão
  if (session === undefined) return <Spinner text="Verificando autenticação…" />;

  // Não logado
  if (!session) return <Login />;

  // Carregando dados
  if (loading) return <Spinner />;

  const mainStyle = {
    flex: 1,
    marginLeft: isMobile ? 0 : 224,
    padding: isMobile ? "72px 16px 80px" : "30px 32px",
    overflowY: "auto",
    minHeight: "100vh",
    maxHeight: isMobile ? "none" : "100vh",
  };

  const isAdmin = profile?.role === "admin";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F9F7F9", minHeight: "100vh", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4A5C9; border-radius: 3px; }
        input[type]:focus, textarea:focus { border-color: #7B1F6A !important; box-shadow: 0 0 0 3px rgba(123,31,106,0.12); }
        button:not(:disabled):hover { filter: brightness(0.94); }
      `}</style>

      <Sidebar page={page} setPage={setPage} profile={profile} onLogout={handleLogout} />

      <main style={mainStyle}>
        {page === "dashboard" && (
          <Dashboard appointments={appointments} clients={clients} services={services} setPage={setPage} profile={profile} profiles={profiles} />
        )}
        {page === "agenda" && (
          <Agenda
            appointments={appointments}
            onUpdateStatus={updateAppointmentStatus}
            onUpdateAppointment={updateAppointment}
            onDeleteAppointment={deleteAppointment}
            clients={clients} services={services} setPage={setPage} profiles={profiles} profile={profile}
          />
        )}
        {page === "clientes" && (
          <Clientes clients={clients} onAdd={addClient} onUpdate={updateClient} onDelete={deleteClient} appointments={appointments} services={services} setPage={setPage} />
        )}
        {page === "servicos" && (
          <Servicos services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} />
        )}
        {page === "usuarios" && isAdmin && (
          <Usuarios
            profiles={profiles}
            session={session}
            onRefresh={loadAll}
            onUpdateProfile={updateUserProfile}
            onDeleteProfile={deleteUserProfile}
            onChangeMyPassword={changeMyPassword}
          />
        )}
        {page === "novo" && (
          <NovoAgendamento clients={clients} onAddClient={addClient} services={services} profiles={profiles} onSubmit={addAppointment} onCancel={() => setPage("agenda")} />
        )}
        {page === "comissoes" && (
          <Comissoes
            profile={profile}
            profiles={profiles}
            appointments={appointments}
            services={services}
            clients={clients}
          />
        )}
      </main>
    </div>
  );
}
