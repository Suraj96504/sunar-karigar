import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  User,
  Service,
  Charge,
  Booking,
  Message,
  Settings,
} from "./models/index.js";
import { business } from "./data.js";
import { requireAdmin, validate } from "./middleware/auth.js";
export const app = express();
app.disable("x-powered-by");
// Render terminates HTTPS at its reverse proxy.
if (process.env.RENDER === "true") app.set("trust proxy", 1);
const clientOrigin = () => process.env.CLIENT_ORIGIN || process.env.RENDER_EXTERNAL_URL || "http://127.0.0.1:5173";
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "font-src": ["'self'", "data:"],
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || origin === clientOrigin()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "24kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    req.headers.origin !==
      clientOrigin()
  )
    return res.status(403).json({ message: "Untrusted request origin." });
  next();
});
app.get("/api/health", (req, res) =>
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  }),
);
app.use("/api", (req, res, next) =>
  mongoose.connection.readyState === 1
    ? next()
    : res
        .status(503)
        .json({ message: "Database is unavailable. Please try again later." }),
);
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const text = z.string().trim().min(2).max(160);
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const serviceSchema = z.object({
  name: text,
  description: z.string().trim().max(500).default(""),
  features: z.array(text).max(8).default([]),
  price: z.number().min(0).max(1000000),
  imageIndex: z.number().int().min(0).max(5).default(0),
  active: z.boolean().default(true),
});
const chargeSchema = z
  .object({ name: text, min: z.number().min(0), max: z.number().min(0) })
  .refine((x) => x.max >= x.min, {
    message: "Maximum must be at least the minimum.",
  });
const settingsSchema = z.object({
  name: text,
  phone: text,
  email: z.string().email(),
  address: text,
  hours: text,
});
const writeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again in 15 minutes." },
});
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again in 15 minutes." },
});
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 8 * 60 * 60 * 1000,
});
app.post(
  "/api/auth/login",
  loginLimit,
  validate(
    z.object({
      email: z
        .string()
        .trim()
        .email()
        .transform((x) => x.toLowerCase()),
      password: z.string().min(1).max(128),
    }),
  ),
  wrap(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+passwordHash",
    );
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    res.cookie(
      "session",
      jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, {
        expiresIn: "8h",
        algorithm: "HS256",
      }),
      cookieOptions(),
    );
    res.json({ name: user.name, email: user.email, role: user.role });
  }),
);
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("session", { ...cookieOptions(), maxAge: undefined });
  res.json({ message: "Signed out." });
});
app.get("/api/auth/me", requireAdmin, (req, res) =>
  res.json({ name: req.user.name, email: req.user.email, role: req.user.role }),
);
app.get(
  "/api/services",
  wrap(async (req, res) =>
    res.json(await Service.find({ active: true }).sort({ createdAt: 1 })),
  ),
);
app.get(
  "/api/repair-charges",
  wrap(async (req, res) =>
    res.json(await Charge.find().sort({ createdAt: 1 })),
  ),
);
app.get(
  "/api/settings",
  wrap(async (req, res) =>
    res.json((await Settings.findOne({ key: "business" }).lean()) || business),
  ),
);
app.post(
  "/api/bookings",
  writeLimit,
  validate(
    z.object({
      name: text,
      phone: z
        .string()
        .trim()
        .regex(
          /^(?:\+91[ -]?)?[6-9]\d{9}$/,
          "Enter a valid Indian mobile number",
        ),
      address: z.string().trim().min(8).max(500),
      city: text,
      service: id,
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((v) => {
          const d = new Date(v + "T00:00:00Z");
          return (
            !isNaN(d) &&
            d.toISOString().slice(0, 10) === v &&
            v >=
              new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Kolkata",
              }).format(new Date())
          );
        }, "Choose today or a future date"),
      time: z.enum([
        "9:00 AM – 12:00 PM",
        "12:00 PM – 3:00 PM",
        "3:00 PM – 7:00 PM",
      ]),
    }),
  ),
  wrap(async (req, res) => {
    const service = await Service.findOne({
      _id: req.body.service,
      active: true,
    });
    if (!service)
      return res.status(400).json({ message: "Choose an available service." });
    const booking = await Booking.create({
      ...req.body,
      serviceName: service.name,
    });
    res
      .status(201)
      .json({
        id: booking._id,
        message:
          "Your service request is booked. Our team will call to confirm your visit.",
      });
  }),
);
app.post(
  "/api/messages",
  writeLimit,
  validate(
    z.object({
      name: text,
      email: z.string().trim().email().max(254),
      message: z.string().trim().min(10).max(3000),
    }),
  ),
  wrap(async (req, res) => {
    const message = await Message.create(req.body);
    res
      .status(201)
      .json({
        id: message._id,
        message: "Thank you! Your message has been sent.",
      });
  }),
);
app.use("/api/admin", requireAdmin);
app.param("id", (req, res, next, value) =>
  id.safeParse(value).success
    ? next()
    : res.status(400).json({ message: "Invalid identifier." }),
);
app.get(
  "/api/admin/dashboard",
  wrap(async (req, res) => {
    const [total, pending, completed, recent, months] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "Pending" }),
      Booking.countDocuments({ status: "Completed" }),
      Booking.find().sort({ createdAt: -1 }).limit(6),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
          },
        },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      total,
      pending,
      completed,
      recent,
      months: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2025, i).toLocaleString("en", { month: "short" }),
        bookings: months.find((x) => x._id === i + 1)?.count || 0,
      })),
    });
  }),
);
app.get(
  "/api/admin/customers",
  wrap(async (req, res) =>
    res.json(
      await Booking.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$phone",
            name: { $first: "$name" },
            phone: { $first: "$phone" },
            city: { $first: "$city" },
            address: { $first: "$address" },
            bookings: { $sum: 1 },
            lastVisit: { $first: "$date" },
          },
        },
      ]),
    ),
  ),
);
for (const [route, Model, schema] of [
  ["services", Service, serviceSchema],
  ["repair-charges", Charge, chargeSchema],
]) {
  app.get(
    "/api/admin/" + route,
    wrap(async (req, res) =>
      res.json(await Model.find().sort({ createdAt: 1 })),
    ),
  );
  app.post(
    "/api/admin/" + route,
    validate(schema),
    wrap(async (req, res) =>
      res.status(201).json(await Model.create(req.body)),
    ),
  );
  app.put(
    "/api/admin/" + route + "/:id",
    validate(schema),
    wrap(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(item ? 200 : 404).json(item || { message: "Item not found." });
    }),
  );
  app.delete(
    "/api/admin/" + route + "/:id",
    wrap(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      res
        .status(item ? 200 : 404)
        .json({ message: item ? "Item deleted." : "Item not found." });
    }),
  );
}
for (const [route, Model, statuses] of [
  ["bookings", Booking, ["Pending", "Confirmed", "Completed", "Cancelled"]],
  ["messages", Message, ["Unread", "Read", "Resolved"]],
]) {
  app.get(
    "/api/admin/" + route,
    wrap(async (req, res) =>
      res.json(await Model.find().sort({ createdAt: -1 })),
    ),
  );
  app.patch(
    "/api/admin/" + route + "/:id",
    validate(z.object({ status: z.enum(statuses) })),
    wrap(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(item ? 200 : 404).json(item || { message: "Item not found." });
    }),
  );
}
app.put(
  "/api/admin/settings",
  validate(settingsSchema),
  wrap(async (req, res) =>
    res.json(
      await Settings.findOneAndUpdate({ key: "business" }, req.body, {
        new: true,
        upsert: true,
        runValidators: true,
      }),
    ),
  ),
);
app.use("/api", (req, res) =>
  res.status(404).json({ message: "Endpoint not found." }),
);
const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../client/dist",
);
app.use(express.static(dist));
app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ message: "Invalid JSON request." });
  console.error(error.message);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});
