import { useState } from "react";
import { Trash2, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Page, PageHeader, GoldButton } from "@/components/ui-kit";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const Card = ({ title, icon: Icon, children, testid }) => (
  <section className="border border-avorio-200 bg-white/60 p-6 md:p-8" data-testid={testid}>
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-oro" strokeWidth={1.4} />
      <h2 className="font-serif text-2xl font-semibold text-bordeaux-900">{title}</h2>
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const Labeled = ({ label, children }) => (
  <label className="block"><span className="eyebrow">{label}</span><div className="mt-1.5">{children}</div></label>
);

const PasswordForm = () => {
  const [f, setF] = useState({ current_password: "", new_password: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/password", f);
      toast.success("Password aggiornata");
      setF({ current_password: "", new_password: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Labeled label="Password attuale"><input type="password" className="field" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} data-testid="current-password-input" required /></Labeled>
      <Labeled label="Nuova password (min. 8 caratteri)"><input type="password" className="field" minLength={8} value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} data-testid="new-password-input" required /></Labeled>
      <GoldButton type="submit" disabled={busy} data-testid="change-password-button">Aggiorna password</GoldButton>
    </form>
  );
};

const NewUserForm = ({ onCreated }) => {
  const empty = { name: "", email: "", password: "", role: "staff" };
  const [f, setF] = useState(empty);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", f);
      toast.success(`Account creato per ${f.name}`);
      setF(empty);
      onCreated();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Labeled label="Nome"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="new-user-name-input" required /></Labeled>
      <Labeled label="Email"><input type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="new-user-email-input" required /></Labeled>
      <Labeled label="Password iniziale"><input type="text" className="field" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="new-user-password-input" required /></Labeled>
      <Labeled label="Ruolo">
        <select className="field" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} data-testid="new-user-role-select">
          <option value="staff">Personale</option>
          <option value="admin">Amministratore</option>
        </select>
      </Labeled>
      <div className="sm:col-span-2"><GoldButton type="submit" data-testid="create-user-button"><UserPlus className="h-4 w-4" /> Crea account</GoldButton></div>
    </form>
  );
};

const UsersAdmin = ({ me }) => {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users")).data });
  const [toDelete, setToDelete] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const remove = async () => {
    try {
      await api.delete(`/users/${toDelete.id}`);
      toast.success("Account eliminato");
      refresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setToDelete(null);
  };
  return (
    <Card title="Personale con accesso" icon={UserPlus} testid="users-admin-card">
      <ul className="divide-y divide-avorio-200 border-y border-avorio-200" data-testid="users-list">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-4 py-3" data-testid={`user-row-${u.email}`}>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{u.name}</div>
              <div className="truncate text-xs text-ink-muted">{u.email} · {u.role === "admin" ? "Amministratore" : "Personale"}</div>
            </div>
            {u.id !== me.id && (
              <button onClick={() => setToDelete(u)} data-testid={`delete-user-${u.email}`} aria-label="Elimina account" className="p-2 text-bordeaux-600 hover:text-bordeaux-800">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-8"><NewUserForm onCreated={refresh} /></div>
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-avorio-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl text-bordeaux-900">Eliminare l'account?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.name} ({toDelete?.email}) non potrà più accedere.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-bordeaux-700 hover:bg-bordeaux-600" data-testid="confirm-delete-user-button">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <Page>
      <PageHeader eyebrow="Accesso" title="Account e utenti" testid="account-page"
        description={`Hai effettuato l'accesso come ${user.name} (${user.role === "admin" ? "amministratore" : "personale"}).`} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card title="Cambia password" icon={KeyRound} testid="password-card"><PasswordForm /></Card>
        {user.role === "admin" && <UsersAdmin me={user} />}
      </div>
    </Page>
  );
}
