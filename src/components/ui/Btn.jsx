import { B } from "../../constants/brand";

const variants = {
  primary: { background: B.brand,    color: "#fff",     border: "none" },
  outline: { background: "transparent", color: B.brand, border: `1.5px solid ${B.brand}` },
  ghost:   { background: "transparent", color: "#6b7280", border: "1.5px solid #e5e7eb" },
  danger:  { background: "#fee2e2",  color: "#dc2626",  border: "1.5px solid #fca5a5" },
  success: { background: "#f0fdf4",  color: "#16a34a",  border: "1.5px solid #86efac" },
};

export default function Btn({ children, variant = "primary", onClick, disabled, small, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant],
      borderRadius: 8,
      cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      fontSize: small ? 12 : 14,
      padding: small ? "5px 11px" : "8px 16px",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      opacity: disabled ? 0.45 : 1,
      transition: "opacity 0.15s, filter 0.15s",
      ...style,
    }}>
      {children}
    </button>
  );
}
