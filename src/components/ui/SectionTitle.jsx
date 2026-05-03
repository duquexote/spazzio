import { B } from "../../constants/brand";

export default function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26, fontWeight: 700, color: B.text, marginBottom: 4,
    }}>
      {children}
    </div>
  );
}
