import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FitnessPage from "./pages/fitness/FitnessPage";
import ExpensesPage from "./pages/expenses/ExpensesPage";
import JournalPage from "./pages/journal/JournalPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading…</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/fitness" replace />} />
        <Route path="fitness" element={<FitnessPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="journal" element={<JournalPage />} />
      </Route>
    </Routes>
  );
}
