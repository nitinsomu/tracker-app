import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/fitness", label: "Fitness" },
  { to: "/expenses", label: "Expenses" },
  { to: "/journal", label: "Journal" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-4">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{user?.username}</span>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
