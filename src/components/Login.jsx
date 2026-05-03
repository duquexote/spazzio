import { useState } from "react";
import { supabase } from "../supabase";
import { B } from "../constants/brand";
import { Lock, Mail, Eye, EyeOff, Scissors } from "lucide-react";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message === "Invalid login credentials"
      ? "E-mail ou senha incorretos."
      : err.message);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${B.brand} 0%, #4a1240 100%)`,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: 16,
    }}>
      {/* Card */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 400,
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: B.light,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Scissors size={26} color={B.brand} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: B.brand }}>Spazzio Diva</div>
          <div style={{ fontSize: 13, color: B.muted, marginTop: 3 }}>Salão de Beleza & Estética</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* E-mail */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              E-mail
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: B.muted }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com" required
                style={{
                  width: "100%", padding: "10px 12px 10px 38px",
                  border: `1.5px solid ${B.border}`, borderRadius: 10,
                  fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: B.muted }} />
              <input
                type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: "100%", padding: "10px 40px 10px 38px",
                  border: `1.5px solid ${B.border}`, borderRadius: 10,
                  fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                border: "none", background: "none", cursor: "pointer", padding: 4,
              }}>
                {showPwd ? <EyeOff size={16} color={B.muted} /> : <Eye size={16} color={B.muted} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div style={{
              background: "#fee2e2", border: "1px solid #fca5a5",
              borderRadius: 8, padding: "9px 13px",
              fontSize: 13, color: "#dc2626", fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Botão */}
          <button type="submit" disabled={loading || !email || !password} style={{
            background: loading ? B.mid : B.brand, color: "#fff",
            border: "none", borderRadius: 10, padding: "12px",
            fontFamily: "inherit", fontWeight: 700, fontSize: 15,
            cursor: loading ? "default" : "pointer",
            marginTop: 4, transition: "background 0.2s",
            opacity: (!email || !password) ? 0.5 : 1,
          }}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
