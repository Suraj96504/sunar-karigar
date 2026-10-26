import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./app.js";
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET.startsWith("replace-")
)
  throw new Error(
    "Set JWT_SECRET to a random secret of at least 32 characters in server/.env.",
  );
if (!process.env.MONGODB_URI)
  throw new Error(
    "Set MONGODB_URI in server/.env. See README.md for local MongoDB setup.",
  );
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  const server = app.listen(process.env.PORT || 5000, process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"), () =>
    console.log(
      "Sunar Karighar API: http://127.0.0.1:" + (process.env.PORT || 5000),
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }),
    );
} catch (error) {
  console.error("MongoDB connection failed:", error.message);
  process.exit(1);
}
