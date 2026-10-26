import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout, { RequireAdmin } from "./layouts/AdminLayout";
import {
  Home,
  Services,
  RepairCharges,
  BookService,
  About,
  Contact,
  Login,
  NotFound,
} from "./pages/PublicPages";
import {
  Dashboard,
  Bookings,
  CatalogManager,
  Customers,
  Messages,
  Settings,
} from "./pages/AdminPages";
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const name =
      pathname === "/"
        ? "Gold Repair & Home Services"
        : pathname
            .split("/")
            .filter(Boolean)
            .map((s) => s.replaceAll("-", " "))
            .join(" · ");
    document.title = `${name.charAt(0).toUpperCase() + name.slice(1)} | Sunar Karighar`;
  }, [pathname]);
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="repair-charges" element={<RepairCharges />} />
        <Route path="book-service" element={<BookService />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<RequireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="services" element={<CatalogManager />} />
          <Route path="repair-charges" element={<CatalogManager charges />} />
          <Route path="customers" element={<Customers />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
