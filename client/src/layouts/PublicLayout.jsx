import { useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { Menu, X, UserRound, Instagram, Facebook, Mail } from "lucide-react";
import { Brand } from "../components/UI";
export const navigation = [
  ["/", "Home"],
  ["/services", "Services"],
  ["/repair-charges", "Repair Charges"],
  ["/book-service", "Book a Service"],
  ["/about", "About Us"],
  ["/contact", "Contact Us"],
];
export function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <Brand />
        <nav aria-label="Footer">
          {navigation
            .filter(([p]) => p !== "/book-service")
            .map(([p, l]) => (
              <Link to={p} key={p}>
                {l}
              </Link>
            ))}
        </nav>
        <div className="footer-end">
          <div className="socials">
            <a href="https://www.facebook.com/" aria-label="Facebook">
              <Facebook size={14} />
            </a>
            <a href="https://www.instagram.com/" aria-label="Instagram">
              <Instagram size={14} />
            </a>
            <Link to="/contact" aria-label="Email us">
              <Mail size={14} />
            </Link>
          </div>
          <small>
            © {new Date().getFullYear()} Sunar Karighar. All rights reserved.
          </small>
        </div>
      </div>
    </footer>
  );
}
export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav
            aria-label="Main navigation"
            className={open ? "mobile-open" : ""}
          >
            {navigation.map(([path, label]) => (
              <NavLink
                end={path === "/"}
                key={path}
                to={path}
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link className="login-link" to="/login">
            <UserRound size={15} />
            Login
          </Link>
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main" key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
