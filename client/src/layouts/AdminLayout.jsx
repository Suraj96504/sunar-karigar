import { Navigate, NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Wrench,
  IndianRupee,
  Users,
  Mail,
  Settings,
  LogOut,
  UserRound,
  ArrowUpRight,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Brand, Notice } from "../components/UI";
export const adminLinks = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/bookings", "Bookings", CalendarDays],
  ["/admin/services", "Services", Wrench],
  ["/admin/repair-charges", "Repair Charges", IndianRupee],
  ["/admin/customers", "Customers", Users],
  ["/admin/messages", "Messages", Mail],
  ["/admin/settings", "Settings", Settings],
];
export function RequireAdmin() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return <div className="loading-screen">Checking your session…</div>;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="admin-app">
      <header className="admin-header">
        <Brand />
        <Link className="visit-site" to="/">
          Visit website <ArrowUpRight size={15} />
        </Link>
        <span className="admin-user">
          <span className="avatar">
            <UserRound size={15} />
          </span>
          {user.name}
        </span>
        <button
          className="menu-toggle"
          aria-label="Toggle admin navigation"
          onClick={() => setOpen(!open)}
        >
          <Menu />
        </button>
      </header>
      <div className="admin-body">
        <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
          <span className="sidebar-label">WORKSPACE</span>
          <nav aria-label="Admin navigation">
            {adminLinks.map(([path, label, Icon]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/admin"}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={async () => {
                try {
                  await logout();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
          <div className="sidebar-note">
            <ShieldIcon />
            <p>
              Your craft.
              <br />
              Our commitment.
            </p>
          </div>
        </aside>
        <main className="admin-main">
          <Notice error>{error}</Notice>
          <Outlet />
        </main>
      </div>
      <div className="admin-footer">
        <Brand />
        <small>
          © {new Date().getFullYear()} Sunar Karighar. All rights reserved.
        </small>
      </div>
    </div>
  );
}
function ShieldIcon() {
  return <Wrench size={23} />;
}
