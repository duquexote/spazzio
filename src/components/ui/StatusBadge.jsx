import { statusMeta } from "../../constants/data";

export default function StatusBadge({ status }) {
  const m = statusMeta[status] || statusMeta.scheduled;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
    }}>
      {m.label}
    </span>
  );
}
