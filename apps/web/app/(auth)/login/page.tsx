"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const ROLE_REDIRECT: Record<string, string> = {
  SUPER_ADMIN: "/vendors",
  ADMIN:       "/vendors",
  VENDOR:      "/dashboard",
  USER:        "/services",
  CLIENT:      "/services",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") || null;

  const [mode,     setMode]     = useState<"login" | "register">("login");
  const [role,     setRole]     = useState<"CLIENT" | "VENDOR">("CLIENT");

  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [businessName,  setBusinessName]  = useState("");
  const [phone,         setPhone]         = useState("");
  const [locationText,  setLocationText]  = useState("");

  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const isLogin   = mode === "login";
      const endpoint  = isLogin ? "/auth/login" : "/auth/register";
      const mappedRole = role === "VENDOR" ? "VENDOR" : "USER";

      const payload = isLogin
        ? { email, password }
        : {
            email, password, firstName, lastName,
            role: mappedRole,
            ...(role === "VENDOR" && { businessName, phone, locationText }),
          };

      const res  = await fetch(`${API}${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();

      const ok = data.status === "success" || res.status === 200 || res.status === 201;

      if (ok) {
        if (!isLogin) {
          setSuccess(
            mappedRole === "VENDOR"
              ? "Vendor registration submitted! Pending admin approval. You can now sign in."
              : "Account created! You can now sign in."
          );
          setMode("login");
        } else {
          const dest = redirectTo ?? ROLE_REDIRECT[data.data?.user?.role] ?? "/services";
          window.location.href = dest;
        }
      } else {
        setError(data.message || (isLogin ? "Invalid credentials." : "Registration failed."));
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  };

  const isLogin = mode === "login";

  return (
    <>
      <style>{`
        .auth-wrap     { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f4f6f8; padding:20px; font-family:sans-serif; }
        .auth-card     { background:#fff; border-radius:16px; width:100%; max-width:440px; box-shadow:0 4px 24px rgba(0,0,0,.1); overflow:hidden; }
        .auth-top      { background:#0A0A0A; padding:28px 32px; position:relative; }
        .auth-back     { position:absolute; top:20px; left:20px; color:rgba(255,255,255,.6); text-decoration:none; font-size:13px; font-weight:600; }
        .auth-back:hover{ color:#fff; }
        .auth-logo     { color:${RED}; font-size:28px; font-weight:900; display:block; text-align:center; text-decoration:none; }
        .auth-tagline  { color:rgba(255,255,255,.4); text-align:center; font-size:13px; margin-top:4px; }

        .auth-body     { padding:28px 32px; }
        .auth-title    { font-size:22px; font-weight:900; color:#0A0A0A; text-align:center; margin:0 0 20px; }

        .role-toggle   { display:flex; border:1.5px solid #eaeaea; border-radius:8px; overflow:hidden; margin-bottom:24px; }
        .role-btn      { flex:1; padding:12px; border:none; cursor:pointer; font-weight:700; font-size:14px; transition:all .15s; }
        .role-btn.active { background:${RED}; color:#fff; }
        .role-btn:not(.active) { background:#fff; color:#71717A; }

        .auth-alert    { padding:12px 14px; border-radius:8px; font-size:13px; font-weight:600; margin-bottom:16px; }
        .auth-alert.error   { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
        .auth-alert.success { background:#d1fae5; color:#065f46; border:1px solid #6ee7b7; }

        .vendor-fields { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:8px; display:flex; flex-direction:column; gap:12px; }
        .field-label   { font-size:13px; font-weight:700; color:#333; margin-bottom:5px; display:block; }
        .field-input   { width:100%; padding:11px 14px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; }
        .field-input:focus { border-color:${RED}; }
        .name-row      { display:flex; gap:10px; }

        .auth-submit   { width:100%; padding:14px; background:${RED}; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:16px; cursor:pointer; margin-top:8px; transition:opacity .15s; }
        .auth-submit:disabled { opacity:.6; cursor:not-allowed; }
        .auth-switch   { text-align:center; margin-top:20px; font-size:14px; color:#71717A; }
        .auth-switch span { color:${RED}; cursor:pointer; font-weight:700; }
        .auth-switch span:hover { text-decoration:underline; }
        .pass-wrap     { position:relative; }
        .pass-wrap .field-input { padding-right:52px; }
        .pass-eye      { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; font-size:14px; font-weight:600; padding:4px 6px; border-radius:4px; line-height:1; }
        .pass-eye:hover { color:#374151; }

        @media (max-width:480px) {
          .auth-card  { border-radius:0; max-width:100%; }
          .auth-body  { padding:20px; }
        }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-card">
          {/* Top bar */}
          <div className="auth-top">
            <Link href="/" className="auth-back">← Back to marketplace</Link>
            <Link href="/" className="auth-logo">kasiFix</Link>
            <p className="auth-tagline">South Africa&apos;s Service Marketplace</p>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </h2>

            {/* Role toggle (register only) */}
            {!isLogin && (
              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-btn${role === "CLIENT" ? " active" : ""}`}
                  onClick={() => setRole("CLIENT")}
                >
                  I&apos;m a Customer
                </button>
                <button
                  type="button"
                  className={`role-btn${role === "VENDOR" ? " active" : ""}`}
                  onClick={() => setRole("VENDOR")}
                >
                  I&apos;m a Vendor
                </button>
              </div>
            )}

            {error   && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <form style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Registration-only fields */}
              {!isLogin && (
                <>
                  <div className="name-row">
                    <div style={{ flex: 1 }}>
                      <label className="field-label">First Name</label>
                      <input className="field-input" type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Last Name</label>
                      <input className="field-input" type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>

                  {role === "VENDOR" && (
                    <div className="vendor-fields">
                      <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Business Details
                      </p>
                      <div>
                        <label className="field-label">Business Name</label>
                        <input className="field-input" type="text" placeholder="e.g. Kasi Fixers Pty Ltd" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                      </div>
                      <div>
                        <label className="field-label">Business Phone</label>
                        <input className="field-input" type="tel" placeholder="011 234 5678" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="field-label">Location (Town / City)</label>
                        <input className="field-input" type="text" placeholder="Soweto, Johannesburg" value={locationText} onChange={e => setLocationText(e.target.value)} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Common fields */}
              <div>
                <label className="field-label">Email Address</label>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Password</label>
                <div className="pass-wrap">
                  <input
                    className="field-input"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="pass-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div style={{ textAlign: "right" }}>
                  <Link href="/forgot-password" style={{ fontSize: "13px", color: RED, textDecoration: "none", fontWeight: 600 }}>
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="button"
                className="auth-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="auth-switch">
              {isLogin ? (
                <>Don&apos;t have an account?{" "}<span onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>Sign Up</span></>
              ) : (
                <>Already have an account?{" "}<span onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Sign In</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f8", fontFamily: "sans-serif", color: "#71717A" }}>Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
