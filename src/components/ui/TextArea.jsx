import { B } from "../../constants/brand";

export default function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</label>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          border: `1.5px solid ${B.border}`, borderRadius: 8, padding: "8px 11px",
          fontSize: 14, fontFamily: "inherit", outline: "none", color: B.text,
          background: "#fff", resize: "vertical", width: "100%", boxSizing: "border-box",
        }}
      />
    </div>
  );
}
