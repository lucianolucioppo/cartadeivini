import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Wine, Warehouse, MapPinned, Star, ScrollText, DatabaseBackup, UserCog, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/lib/queries";

const MAIN = [
  { to: "/vini", label: "Tutti i vini", short: "Vini", icon: Wine, id: "vini" },
  { to: "/produttori", label: "Produttori", short: "Produttori", icon: Warehouse, id: "produttori" },
  { to: "/regioni", label: "Regioni e tipologie", short: "Regioni", icon: MapPinned, id: "regioni" },
  { to: "/preferiti", label: "Preferiti", short: "Preferiti", icon: Star, id: "preferiti" },
];
const TOOLS = [
  { to: "/carta", label: "Carta per i clienti", icon: ScrollText, id: "carta" },
  { to: "/backup", label: "Importa, esporta e backup", icon: DatabaseBackup, id: "backup" },
  { to: "/account", label: "Account e utenti", icon: UserCog, id: "account" },
];

const Brand = () => {
  const { data: settings } = useSettings();
  return (
  <div className="px-7 pt-9 pb-7">
    <div className="eyebrow !text-oro/80 truncate" data-testid="brand-restaurant-name">{settings?.nome_ristorante || "Ristorante"}</div>
    <div className="mt-1 font-serif text-[2.1rem] font-semibold italic leading-none text-avorio-50">Carta dei Vini</div>
    <div className="gold-rule mt-5 opacity-60" />
  </div>
  );
};

const SideLink = ({ item, onClick, prefix = "nav" }) => (
  <NavLink
    to={item.to}
    onClick={onClick}
    data-testid={`${prefix}-${item.id}-link`}
    className={({ isActive }) =>
      `group flex items-center gap-3 border-l-2 px-7 py-3 text-sm transition-colors duration-200 ${
        isActive
          ? "border-oro bg-bordeaux-900 text-oro-light"
          : "border-transparent text-avorio-200/70 hover:bg-bordeaux-900/60 hover:text-avorio-50"
      }`
    }
  >
    <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
    <span className="tracking-wide">{item.label}</span>
  </NavLink>
);

const UserBox = () => {
  const { user, logout } = useAuth();
  return (
    <div className="border-t border-oro/20 px-7 py-5">
      <div className="truncate text-sm text-avorio-50" data-testid="current-user-name">{user?.name}</div>
      <div className="truncate text-xs text-avorio-200/50">{user?.email}</div>
      <button onClick={logout} data-testid="logout-button"
        className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-oro transition-colors hover:text-oro-light">
        <LogOut className="h-3.5 w-3.5" /> Esci
      </button>
    </div>
  );
};

const Sidebar = () => (
  <aside className="grain fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-bordeaux-950 print:hidden lg:flex">
    <Brand />
    <nav className="flex-1 space-y-0.5">
      {MAIN.map((i) => <SideLink key={i.id} item={i} />)}
      <div className="eyebrow !text-oro/50 px-7 pb-2 pt-8">Strumenti</div>
      {TOOLS.map((i) => <SideLink key={i.id} item={i} />)}
    </nav>
    <UserBox />
  </aside>
);

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const toolActive = TOOLS.some((t) => pathname.startsWith(t.to));
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-oro/25 bg-bordeaux-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl print:hidden lg:hidden">
        {MAIN.map((i) => (
          <NavLink key={i.id} to={i.to} data-testid={`mobile-nav-${i.id}-link`}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors ${isActive ? "text-oro-light" : "text-avorio-200/60"}`}>
            <i.icon className="h-5 w-5" strokeWidth={1.5} />
            {i.short}
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)} data-testid="mobile-nav-more-button"
          className={`flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide ${toolActive ? "text-oro-light" : "text-avorio-200/60"}`}>
          <Menu className="h-5 w-5" strokeWidth={1.5} />
          Altro
        </button>
      </nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="border-oro/30 bg-bordeaux-950 p-0 text-avorio-50" data-testid="mobile-more-sheet">
          <SheetHeader className="px-7 pt-6">
            <SheetTitle className="font-serif text-2xl italic text-avorio-50">Strumenti</SheetTitle>
          </SheetHeader>
          <div className="py-3">{TOOLS.map((i) => <SideLink key={i.id} item={i} prefix="mobile-nav" onClick={() => setOpen(false)} />)}</div>
          <UserBox />
        </SheetContent>
      </Sheet>
    </>
  );
};

const MobileTop = () => (
  <header className="sticky top-0 z-30 flex items-center justify-between border-b border-oro/25 bg-bordeaux-950/95 px-5 py-3.5 backdrop-blur-xl print:hidden lg:hidden">
    <span className="font-serif text-xl font-semibold italic text-avorio-50">Carta dei Vini</span>
    <Wine className="h-5 w-5 text-oro" strokeWidth={1.5} />
  </header>
);

export const Layout = () => (
  <div className="min-h-screen bg-avorio-50">
    <Sidebar />
    <MobileTop />
    <main className="pb-28 lg:pb-0 lg:pl-72 print:p-0">
      <Outlet />
    </main>
    <MobileNav />
  </div>
);
