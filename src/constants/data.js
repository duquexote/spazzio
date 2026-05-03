export const todayStr = new Date().toISOString().split("T")[0];

function ago(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function fwd(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export const SVCS_INIT = [
  { id: 1, name: "Corte Feminino", price: 80,  duration: 60,  active: true, description: "" },
  { id: 2, name: "Escova",         price: 60,  duration: 45,  active: true, description: "" },
  { id: 3, name: "Coloração",      price: 150, duration: 120, active: true, description: "" },
  { id: 4, name: "Hidratação",     price: 70,  duration: 60,  active: true, description: "" },
  { id: 5, name: "Mechas / Luzes", price: 220, duration: 180, active: true, description: "" },
  { id: 6, name: "Progressiva",    price: 180, duration: 150, active: true, description: "" },
];

export const CLTS_INIT = [
  { id: 1, name: "Ana Silva",      phone: "71 99999-0001", birthdate: "1990-05-15", notes: "Cabelo fino, sensível ao calor" },
  { id: 2, name: "Beatriz Santos", phone: "71 99999-0002", birthdate: "1988-03-22", notes: "" },
  { id: 3, name: "Carla Oliveira", phone: "71 99999-0003", birthdate: "1995-11-08", notes: "Alergia a amônia" },
  { id: 4, name: "Daniela Costa",  phone: "71 99999-0004", birthdate: "1992-07-30", notes: "" },
  { id: 5, name: "Fernanda Lima",  phone: "71 99999-0005", birthdate: "1985-01-12", notes: "Prefere produtos naturais" },
];

export const APTS_INIT = [
  { id:  1, clientId: 1, serviceId: 2, date: todayStr,  time: "09:00", status: "completed", discount: { type: "percent", value: 10 }, notes: "" },
  { id:  2, clientId: 3, serviceId: 3, date: todayStr,  time: "11:00", status: "scheduled", discount: null, notes: "Mechas loiras" },
  { id:  3, clientId: 2, serviceId: 1, date: todayStr,  time: "14:00", status: "scheduled", discount: null, notes: "" },
  { id:  4, clientId: 5, serviceId: 4, date: todayStr,  time: "16:00", status: "scheduled", discount: { type: "fixed", value: 10 }, notes: "" },
  { id:  5, clientId: 4, serviceId: 5, date: fwd(2),    time: "10:00", status: "scheduled", discount: null, notes: "" },
  { id:  6, clientId: 1, serviceId: 6, date: fwd(3),    time: "09:00", status: "scheduled", discount: null, notes: "" },
  { id:  7, clientId: 1, serviceId: 1, date: ago(7),    time: "10:00", status: "completed", discount: null, notes: "" },
  { id:  8, clientId: 2, serviceId: 3, date: ago(7),    time: "14:00", status: "completed", discount: null, notes: "" },
  { id:  9, clientId: 4, serviceId: 6, date: ago(14),   time: "09:00", status: "completed", discount: null, notes: "" },
  { id: 10, clientId: 3, serviceId: 2, date: ago(14),   time: "11:00", status: "completed", discount: null, notes: "" },
  { id: 11, clientId: 5, serviceId: 5, date: ago(21),   time: "15:00", status: "completed", discount: null, notes: "" },
  { id: 12, clientId: 1, serviceId: 4, date: ago(21),   time: "09:00", status: "completed", discount: null, notes: "" },
  { id: 13, clientId: 2, serviceId: 2, date: ago(3),    time: "10:00", status: "completed", discount: null, notes: "" },
  { id: 14, clientId: 4, serviceId: 1, date: ago(3),    time: "13:00", status: "completed", discount: null, notes: "" },
  { id: 15, clientId: 3, serviceId: 4, date: ago(5),    time: "15:00", status: "completed", discount: null, notes: "" },
];

export const statusMeta = {
  completed: { label: "Concluído",       color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  scheduled: { label: "Agendado",        color: "#7B1F6A", bg: "#F7EDF5", border: "#EAD4E4" },
  cancelled: { label: "Cancelado",       color: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb" },
  no_show:   { label: "Não compareceu",  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};
