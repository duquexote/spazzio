import { B } from "../../constants/brand";

export default function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      border: `1px solid ${B.border}`,
      boxShadow: "0 1px 6px rgba(123,31,106,0.05)",
      ...style,
    }}>
      {children}
    </div>
  );
}
