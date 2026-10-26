import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  Gem,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import {
  Banner,
  Photo,
  ButtonLink,
  ServiceCard,
  ReasonList,
  Notice,
  useResource,
  benefits,
  values,
} from "../components/UI";
import {
  services as catalog,
  charges as priceList,
  business,
} from "../data/catalog";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
export function Home() {
  const { data } = useResource("/services", catalog);
  return (
    <>
      <section className="home-hero">
        <Photo kind="hero" />
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="eyebrow">TRUSTED GOLD REPAIR & HOME SERVICES</span>
          <h1>
            Your Precious Gold
            <br />
            <em>Our Expert Care</em>
          </h1>
          <p>
            Get your gold jewellery repaired by skilled artisans and book
            <br className="desktop-br" /> our home service for a hassle-free
            experience. Transparent
            <br className="desktop-br" /> pricing, trusted service, and doorstep
            convenience.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <ButtonLink to="/book-service">Book a Service</ButtonLink>
            <ButtonLink to="/repair-charges" className="outline">
              View Repair Charges
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="trust-strip">
        <div className="container trust-grid">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon />
              <span>
                {title}
                <br />
                {text}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="container home-services">
        <div className="section-heading">
          <div>
            <h2>Our Popular Services</h2>
            <p>
              Professional repair and maintenance for all your precious
              jewellery.
            </p>
          </div>
          <Link to="/services">
            View All Services <ArrowRight size={13} />
          </Link>
        </div>
        <div className="popular-grid">
          {data.map((s, i) => (
            <ServiceCard key={s._id || i} service={s} compact />
          ))}
        </div>
        <div className="home-cta">
          <Gem size={40} />
          <div>
            <h2>Need a Repair or Home Service?</h2>
            <p>Book now and get your precious items repaired by experts.</p>
          </div>
          <ButtonLink to="/book-service">Book Now</ButtonLink>
        </div>
      </section>
    </>
  );
}
export function Services() {
  const { data, error } = useResource("/services", catalog);
  return (
    <>
      <Banner title="Our Services" gold>
        Expert repair and maintenance for all types of gold and silver
        jewellery.
      </Banner>
      <section className="container page-section">
        <Notice>
          {error
            ? "Showing our standard service catalogue. Availability is confirmed when booking."
            : ""}
        </Notice>
        <div className="services-grid">
          {data.map((s, i) => (
            <ServiceCard key={s._id || i} service={s} />
          ))}
          <article className="visit-card">
            <Photo kind="service" />
            <div>
              <HouseIcon />
              <h2>Can't Visit Us?</h2>
              <p>
                We also provide home service
                <br />
                for your convenience.
              </p>
              <ButtonLink to="/book-service" className="small">
                Book Home Service
              </ButtonLink>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
function HouseIcon() {
  return (
    <span className="outline-icon">
      <ShieldCheck size={29} />
    </span>
  );
}
export function RepairCharges() {
  const { data } = useResource("/repair-charges", priceList);
  return (
    <>
      <Banner title="Repair Charges">
        Transparent pricing for all repair services.
        <br />
        Final charges may vary based on design, material and damage level.
      </Banner>
      <section className="container page-section pricing-layout">
        <div className="panel price-panel">
          <h2>Gold Jewellery Repair Charges</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Charges (₹)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r._id || i}>
                    <td>{r.name}</td>
                    <td>
                      {r.min.toLocaleString("en-IN")} –{" "}
                      {r.max.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="price-note">
            ⓘ Note: Final charges may vary based on design, material, and damage
            level.
          </p>
        </div>
        <ReasonList />
      </section>
    </>
  );
}
export function BookService() {
  const [params] = useSearchParams();
  const {
    data: services,
    loading,
    error: catalogError,
  } = useResource("/services", []);
  const [status, setStatus] = useState({});
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus({});
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const result = await api("/bookings", { method: "POST", body });
      setStatus({
        message: `${result.message} Reference: ${result.id.slice(-8).toUpperCase()}`,
      });
      e.target.reset();
    } catch (error) {
      setStatus({ error: error.message });
    } finally {
      setBusy(false);
    }
  }
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  return (
    <>
      <Banner title="Book a Home Service">
        Fill in the details and we'll take care of the rest.
        <br />
        Our expert will visit your location at your preferred time.
      </Banner>
      <section className="container page-section booking-layout">
        <form className="booking-form panel" onSubmit={submit}>
          <div className="booking-columns">
            <fieldset>
              <legend>Service Details</legend>
              <label>
                Select Service <b>*</b>
                <select
                  name="service"
                  required
                  defaultValue={
                    services.find((s) => s.name === params.get("service"))
                      ?._id || ""
                  }
                  key={services.length}
                >
                  <option value="" disabled>
                    {loading ? "Loading services…" : "Choose a service"}
                  </option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {params.get("service") && (
                <p className="field-hint">Requested: {params.get("service")}</p>
              )}
              <label>
                Preferred Date <b>*</b>
                <input type="date" name="date" min={today} required />
              </label>
              <label>
                Preferred Time <b>*</b>
                <select name="time" defaultValue="" required>
                  <option value="" disabled>
                    Select time slot
                  </option>
                  {[
                    "9:00 AM – 12:00 PM",
                    "12:00 PM – 3:00 PM",
                    "3:00 PM – 7:00 PM",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>Your Details</legend>
              <label>
                Full Name <b>*</b>
                <input
                  name="name"
                  placeholder="Enter your name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={160}
                  required
                />
              </label>
              <label>
                Mobile Number <b>*</b>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter mobile number"
                  autoComplete="tel"
                  pattern="(\+91[ \-]?)?[6-9][0-9]{9}"
                  required
                />
              </label>
              <label>
                Address <b>*</b>
                <textarea
                  name="address"
                  placeholder="Enter your complete address"
                  autoComplete="street-address"
                  minLength={8}
                  maxLength={500}
                  required
                />
              </label>
              <label>
                City <b>*</b>
                <input
                  name="city"
                  placeholder="Enter city"
                  autoComplete="address-level2"
                  minLength={2}
                  maxLength={160}
                  required
                />
              </label>
            </fieldset>
          </div>
          <div className="booking-submit">
            <Notice error={!!status.error}>
              {status.error || status.message}
            </Notice>
            <Notice error>
              {catalogError
                ? "Services could not be loaded. Please check your connection and try again."
                : ""}
            </Notice>
            <button
              className="button"
              disabled={busy || loading || !services.length}
            >
              {busy ? "Booking…" : "Book Now"}
            </button>
          </div>
        </form>
        <aside className="booking-promise">
          <div>
            {[
              {
                icon: Truck,
                title: "Free Pickup & Delivery",
                text: "(Selected Areas)",
              },
              {
                icon: Award,
                title: "Expert Goldsmiths",
                text: "At Your Doorstep",
              },
              { icon: ShieldCheck, title: "Safe & Secure", text: "Handling" },
            ].map(({ icon: Icon, title, text }) => (
              <div className="promise-row" key={title}>
                <Icon size={29} />
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Photo kind="van" />
          <p className="promise-bottom">Precious to you. Protected by us.</p>
        </aside>
      </section>
    </>
  );
}
export function About() {
  return (
    <>
      <Banner title="About Us" kind="about" gold>
        Preserving Your Precious Moments
      </Banner>
      <section className="container page-section about-section">
        <div className="about-story">
          <div>
            <span className="eyebrow muted">CARE THAT LASTS A LIFETIME</span>
            <h2>Our Story</h2>
            <p>
              Sunar Karighar is a trusted name in gold repair and home services,
              with a vision to bring expert craftsmanship and convenience to
              your doorstep. With years of experience in jewellery repair, we
              combine traditional skills with modern tools to ensure your
              precious items are restored with care and perfection.
            </p>
            <p>
              From a treasured family heirloom to your everyday favourites,
              every piece receives the attention it deserves.
            </p>
          </div>
          <div className="panel stats-panel">
            {[
              ["5+", "Years of Experience"],
              ["10K+", "Happy Customers"],
              ["100%", "Trusted & Secure"],
            ].map(([n, t]) => (
              <div key={n}>
                <span className="round-icon">
                  <ShieldCheck size={21} />
                </span>
                <div>
                  <strong>{n}</strong>
                  <p>{t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel values-panel">
          <h2>Our Values</h2>
          <div className="values-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span className="round-icon">
                  <Icon size={25} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
export function Contact() {
  const { data: info } = useResource("/settings", business);
  const [status, setStatus] = useState({});
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus({});
    try {
      const result = await api("/messages", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setStatus({ message: result.message });
      e.target.reset();
    } catch (error) {
      setStatus({ error: error.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Banner title="Get in Touch" gold>
        We're here to help! Reach out to us for any query,
        <br />
        booking or support.
      </Banner>
      <section className="container page-section contact-layout">
        <div className="panel contact-info">
          <h2>Contact Information</h2>
          {[
            {
              icon: Phone,
              title: info.phone,
              text: info.hours,
              href: `tel:${info.phone.replace(/[^+\d]/g, "")}`,
            },
            {
              icon: Phone,
              title: info.phone,
              text: "Call for booking and support",
              href: `tel:${info.phone.replace(/[^+\d]/g, "")}`,
            },
            {
              icon: Mail,
              title: info.email,
              text: "We reply within 24 hours",
              href: `mailto:${info.email}`,
            },
            { icon: MapPin, title: info.address, text: "(Serving Delhi NCR)" },
          ].map(({ icon: Icon, title, text, href }, i) => (
            <div className="contact-item" key={i}>
              <span className="round-icon">
                <Icon size={20} />
              </span>
              <div>
                {href ? <a href={href}>{title}</a> : <strong>{title}</strong>}
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="panel contact-form" onSubmit={submit}>
          <h2>Send Us a Message</h2>
          <label>
            Full Name <b>*</b>
            <input
              name="name"
              placeholder="Enter your name"
              minLength={2}
              maxLength={160}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email Address <b>*</b>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          <label>
            Message <b>*</b>
            <textarea
              name="message"
              placeholder="Your message…"
              minLength={10}
              maxLength={3000}
              required
            />
          </label>
          <Notice error={!!status.error}>
            {status.error || status.message}
          </Notice>
          <button className="button" disabled={busy}>
            {busy ? "Sending…" : "Send Message"}
          </button>
        </form>
        <a
          className="map-panel"
          href="https://www.google.com/maps/search/?api=1&query=Sector+62+Noida"
          target="_blank"
          rel="noreferrer"
          aria-label="View Sector 62 Noida on Google Maps"
        >
          <div className="map-grid" />
          <MapPin size={40} fill="#b94432" color="white" />
          <span>
            Explore our service area <ArrowRight size={15} />
          </span>
        </a>
        <div className="panel location-panel">
          <h3>Our Location</h3>
          <p>{info.address}</p>
          <p className="field-hint">
            Home visits across selected Delhi NCR areas.
          </p>
        </div>
      </section>
    </>
  );
}
export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(Object.fromEntries(new FormData(e.currentTarget)));
      const destination = location.state?.from;
      navigate(destination?.startsWith("/admin") ? destination : "/admin", {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Banner title="Welcome Back" gold>
        Secure access for the Sunar Karighar team.
      </Banner>
      <section className="container login-section">
        <form className="panel login-form" onSubmit={submit}>
          <span className="round-icon">
            <ShieldCheck />
          </span>
          <h2>Administrator Login</h2>
          <p>Sign in to manage your services and bookings.</p>
          <label>
            Email Address
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              required
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <Notice error>{error}</Notice>
          <button className="button" disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
            <ArrowRight size={16} />
          </button>
          <small>Access is restricted to authorised administrators.</small>
        </form>
      </section>
    </>
  );
}
export function NotFound() {
  return (
    <section className="container not-found">
      <Gem size={50} />
      <h1>Page not found</h1>
      <p>Let's get you back to something precious.</p>
      <ButtonLink to="/">Back to Home</ButtonLink>
    </section>
  );
}
