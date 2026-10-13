import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-bordeaux-950 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/img/login.jpg" alt="Calice di vino rosso" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-bordeaux-950/30 via-bordeaux-950/40 to-bordeaux-950" />
        <div className="absolute bottom-14 left-14 max-w-md">
          <p className="font-serif text-3xl italic leading-snug text-avorio-50 [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]">
            Ogni bottiglia racconta un territorio.
          </p>
        </div>
      </div>
      <div className="grain relative flex items-center justify-center px-6 py-16">
        <form onSubmit={submit} className="relative z-10 w-full max-w-sm animate-rise" data-testid="login-form">
          <div className="eyebrow !text-oro/80">Riservato al personale</div>
          <h1 className="mt-3 font-serif text-5xl font-semibold italic leading-none text-avorio-50 sm:text-6xl">Carta dei Vini</h1>
          <div className="gold-rule mt-6 opacity-70" />
          <div className="mt-10 space-y-5">
            <label className="block">
              <span className="eyebrow !text-oro/80">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" data-testid="login-email-input"
                className="mt-2 h-12 w-full border-b border-oro/40 bg-transparent text-base text-avorio-50 outline-none transition-colors placeholder:text-avorio-200/30 focus:border-oro" placeholder="nome@ristorante.it" />
            </label>
            <label className="block">
              <span className="eyebrow !text-oro/80">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" data-testid="login-password-input"
                className="mt-2 h-12 w-full border-b border-oro/40 bg-transparent text-base text-avorio-50 outline-none transition-colors focus:border-oro" />
            </label>
          </div>
          {error && <p className="mt-5 border-l-2 border-bordeaux-500 bg-bordeaux-900/60 px-3 py-2 text-sm text-avorio-100" data-testid="login-error">{error}</p>}
          <button type="submit" disabled={busy} data-testid="login-submit-button"
            className="mt-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-oro text-sm font-semibold uppercase tracking-[0.2em] text-bordeaux-950 transition-[background-color,transform] duration-200 hover:bg-oro-light active:scale-[0.99] disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Accedi
          </button>
          <p className="mt-6 text-xs leading-relaxed text-avorio-200/50">Gli account sono creati dall'amministratore del ristorante.</p>
        </form>
      </div>
    </div>
  );
}
