import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Truck,
  Star,
  Clock,
  House,
  IndianRupee,
  UserRound,
  HeartHandshake,
  Award,
} from "lucide-react";
import { api } from "../services/api";
// Full-resolution local assets, optimized for the size of each placement.
const photos = {
  hero: { file: "hero", alt: "Goldsmith carefully restoring an engraved gold ring at a workbench" },
  banner: { file: "banner", alt: "Traditional gold necklace, earrings and bangles on dark silk" },
  about: { file: "about", alt: "Master goldsmith inspecting a necklace in a warmly lit workshop" },
  service: { file: "about", alt: "Skilled jeweller at work in a traditional jewellery workshop" },
  van: { file: "van", alt: "Premium pickup van outside a jewellery workshop" },
  ring: { file: "ring", alt: "Engraved yellow-gold ring with a clear gemstone" },
  necklace: { file: "necklace", alt: "Traditional yellow-gold necklace with delicate links" },
  earrings: { file: "earrings", alt: "Matching gold jhumka earrings with intricate filigree" },
  bangle: { file: "bangle", alt: "Overlapping engraved gold bangles" },
  pendant: { file: "pendant", alt: "Gold pendant with a ruby accent and fine chain" },
  silver: { file: "silver", alt: "Polished silver bowl and an engraved silver anklet" },
};
const productKeys = ["ring", "necklace", "earrings", "bangle", "pendant", "silver"];
export function Photo({ kind = "hero", index, className = "", style = {}, children }) {
  const product = index !== undefined;
  const photo = photos[product ? productKeys[index] || "ring" : kind] || photos.hero;
  const priority = !product && ["hero", "banner", "about"].includes(kind);
  return (
    <div className={`photo photo-${photo.file} ${product ? "photo-product" : ""} ${className}`} style={style}>
      <img
        src={`/images/${photo.file}.webp`}
        srcSet={`/images/${photo.file}-small.webp 640w, /images/${photo.file}.webp ${product ? 1024 : 1536}w`}
        sizes={product ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px" : kind === "van" || kind === "service" ? "(max-width: 640px) 100vw, 420px" : "100vw"}
        alt={photo.alt}
        width={product ? 1024 : 1536}
        height={1024}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      {children}
    </div>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Sunar Karighar home">
      <span className="brand-icon">
        <Gem size={34} strokeWidth={1.3} />
      </span>
      <span>
        <strong>Sunar Karighar</strong>
        <small>Gold Repair & Home Services</small>
      </span>
    </Link>
  );
}
export function ButtonLink({ children, to, className = "" }) {
  return (
    <Link className={`button ${className}`} to={to}>
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
export function Banner({ title, children, kind = "banner", gold = false }) {
  return (
    <section className={`page-banner ${gold ? "gold-title" : ""}`}>
      <Photo kind={kind} />
      <div className="banner-shade" />
      <div className="container relative">
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
    </section>
  );
}
export function Notice({ children, error = false }) {
  return children ? (
    <div
      className={`notice ${error ? "error" : "success"}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function useResource(path, fallback) {
  const [data, setData] = useState(fallback),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return { data, setData, loading, error };
}
export const benefits = [
  { icon: ShieldCheck, title: "100% Trusted", text: "& Secure" },
  { icon: Wrench, title: "Skilled Artisans", text: "& Modern Tools" },
  { icon: Truck, title: "Free Pickup &", text: "Delivery (Selected Areas)" },
  { icon: Star, title: "Transparent", text: "Pricing" },
];
export const reasons = [
  { icon: UserRound, title: "Skilled & Experienced", text: "Goldsmiths" },
  {
    icon: IndianRupee,
    title: "Transparent Pricing",
    text: "No hidden charges",
  },
  {
    icon: Clock,
    title: "Quick Turnaround",
    text: "Get your jewellery back on time",
  },
  {
    icon: House,
    title: "Doorstep Service",
    text: "Convenient and hassle-free",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
    text: "Your jewellery is always in safe hands",
  },
];
export function ReasonList() {
  return (
    <aside className="panel why-us">
      <h2>Why Choose Us?</h2>
      {reasons.map(({ icon: Icon, title, text }) => (
        <div className="reason" key={title}>
          <span className="round-icon">
            <Icon size={23} />
          </span>
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </aside>
  );
}
export function ServiceCard({ service, compact = false }) {
  return (
    <article className={`service-card ${compact ? "compact" : ""}`}>
      <Link
        to={`/book-service?service=${encodeURIComponent(service.name)}`}
        aria-label={`Book ${service.name}`}
      >
        <Photo index={service.imageIndex} />
      </Link>
      <div className="service-card-content">
        <h3>{service.name}</h3>
        {!compact && (
          <ul>
            {service.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        <p>
          Starting from <strong>₹{service.price}</strong>
        </p>
        {!compact && (
          <ButtonLink
            to={`/book-service?service=${encodeURIComponent(service.name)}`}
            className="small"
          >
            Book Now
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
export function Empty({ children = "No records yet." }) {
  return (
    <div className="empty">
      <Gem size={30} />
      <p>{children}</p>
    </div>
  );
}
export const values = [
  { icon: Gem, title: "Quality", text: "We never compromise on quality." },
  {
    icon: ShieldCheck,
    title: "Trust",
    text: "Your trust is our biggest asset.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    text: "Your care above. Your satisfaction.",
  },
  {
    icon: Award,
    title: "Expert Craftsmanship",
    text: "Skilled artisans with years of experience.",
  },
];
