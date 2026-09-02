export const currency = v =>
  "R$ " + v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const formatPaymentMethod = (method) => {
  if (!method) return "—";
  try {
    const parsed = JSON.parse(method);
    if (typeof parsed === "object" && parsed !== null) {
      const names = { card: "Cartão", pix: "Pix", cash: "Dinheiro", voucher: "Voucher" };
      return Object.entries(parsed)
        .filter(([_, val]) => val > 0)
        .map(([key, val]) => `${names[key] || key} (${currency(val)})`)
        .join(" + ");
    }
  } catch (e) {
    // Não é JSON, fluxo legado
  }
  const names = { card: "Cartão", pix: "Pix", cash: "Dinheiro", voucher: "Voucher" };
  return names[method] || method;
};

export const applyDiscount = (price, d) => {
  if (!d) return price;
  return d.type === "percent" ? price * (1 - d.value / 100) : Math.max(0, price - d.value);
};

export const ptShort = s => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  const mo = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${d}/${mo[+m - 1]}/${y}`;
};

export const ptFull = s => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  const mo = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${+d} de ${mo[+m - 1]} de ${y}`;
};

export const weekDay = s => {
  const days = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  return days[new Date(s + "T12:00:00").getDay()];
};

export const addDays = (s, n) => {
  const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const initials = name =>
  name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

// Remove acentos/diacríticos para permitir busca "café" === "cafe"
export const normalize = s =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
