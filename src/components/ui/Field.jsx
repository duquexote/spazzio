import { B } from "../../constants/brand";

export default function Field({ label, value, onChange, placeholder, type = "text", style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "8px 11px",
          fontSize: 14, fontFamily: "inherit", outline: "none",
          color: B.text, background: "#fff", width: "100%", boxSizing: "border-box",
        }}
      />
    </div>
  );
}
