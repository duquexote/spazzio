import { B } from "../../constants/brand";
import { initials } from "../../utils/format";

export default function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: B.light, color: B.brand, fontWeight: 700,
      fontSize: size * 0.33, display: "flex", alignItems: "center",
      justifyContent: "center", border: `1.5px solid ${B.border}`,
    }}>
      {initials(name)}
    </div>
  );
}
