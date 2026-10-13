import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import WinesPage from "@/pages/WinesPage";
import ProducersPage from "@/pages/ProducersPage";
import RegionsPage from "@/pages/RegionsPage";
import FavoritesPage from "@/pages/FavoritesPage";
import CartaPage from "@/pages/CartaPage";
import BackupPage from "@/pages/BackupPage";
import AccountPage from "@/pages/AccountPage";

const Splash = () => (
  <div className="flex min-h-screen items-center justify-center bg-bordeaux-950" data-testid="app-loading">
    <div className="font-serif text-2xl italic text-oro-light/80">Carta dei Vini…</div>
  </div>
);

const Protected = ({ children }) => {
  const { user } = useAuth();
  if (user === null) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user } = useAuth();
  if (user === null) return <Splash />;
  if (user) return <Navigate to="/vini" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route element={<Protected><Layout /></Protected>}>
              <Route index element={<Navigate to="/vini" replace />} />
              <Route path="/vini" element={<WinesPage />} />
              <Route path="/produttori" element={<ProducersPage />} />
              <Route path="/regioni" element={<RegionsPage />} />
              <Route path="/preferiti" element={<FavoritesPage />} />
              <Route path="/carta" element={<CartaPage />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="*" element={<Navigate to="/vini" replace />} />
            </Route>
          </Routes>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
