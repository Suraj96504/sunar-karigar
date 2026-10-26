import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Service, Charge, Settings } from "./models/index.js";
import { services, charges, business } from "./data.js";
if (
  !process.env.ADMIN_EMAIL ||
  !process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD.length < 12 ||
  process.env.ADMIN_PASSWORD.startsWith("replace-")
)
  throw new Error(
    "Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters.",
  );
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  if (!(await User.exists({ email: process.env.ADMIN_EMAIL.toLowerCase() })))
    await User.create({
      name: process.env.ADMIN_NAME || "Administrator",
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    });
  if (!(await Service.exists({}))) await Service.insertMany(services);
  if (!(await Charge.exists({}))) await Charge.insertMany(charges);
  await Settings.updateOne(
    { key: "business" },
    { $setOnInsert: business },
    { upsert: true },
  );
  console.log("Seed complete. Existing records and credentials preserved.");
} finally {
  await mongoose.disconnect();
}
