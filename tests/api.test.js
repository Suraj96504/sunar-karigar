import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../server/src/app.js";
import {
  User,
  Service,
  Charge,
  Booking,
  Message,
} from "../server/src/models/index.js";
import { services, charges } from "../server/src/data.js";
let mongo, admin, serviceId, bookingId, messageId;
process.env.JWT_SECRET =
  "test-only-secret-with-more-than-thirty-two-characters";
before(
  async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await User.create({
      name: "Test Admin",
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("TestPassword!123", 12),
    });
    const rows = await Service.insertMany(services);
    serviceId = String(rows[0]._id);
    await Charge.insertMany(charges);
    admin = request.agent(app);
  },
  { timeout: 600000 },
);
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
test("public catalogue and pricing are available", async () => {
  assert.equal((await request(app).get("/api/services")).body.length, 6);
  assert.equal((await request(app).get("/api/repair-charges")).body.length, 8);
});
test("production hosting serves React Router paths directly", async () => {
  for (const path of ["/services", "/book-service", "/admin/bookings"]) {
    const res = await request(app).get(path);
    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /text\/html/);
    assert.match(res.text, /id="root"/);
  }
});
test("admin endpoints and writes require authentication", async () => {
  for (const path of [
    "dashboard",
    "bookings",
    "services",
    "repair-charges",
    "customers",
    "messages",
  ])
    assert.equal((await request(app).get("/api/admin/" + path)).status, 401);
  assert.equal(
    (await request(app).post("/api/admin/services").send(services[0])).status,
    401,
  );
});
test("login rejects invalid credentials and creates an HTTP-only session", async () => {
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "wrong" })
    ).status,
    401,
  );
  const res = await admin
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "TestPassword!123" });
  assert.equal(res.status, 200);
  assert.match(res.headers["set-cookie"][0], /HttpOnly/);
  assert.match(res.headers["set-cookie"][0], /SameSite=Strict/);
  assert.equal(res.body.passwordHash, undefined);
  assert.equal((await admin.get("/api/auth/me")).body.name, "Test Admin");
});
test("booking validation rejects bad dates and untrusted origins", async () => {
  assert.equal((await request(app).post("/api/bookings").send({})).status, 400);
  assert.equal(
    (
      await request(app)
        .post("/api/bookings")
        .set("Origin", "https://untrusted.example")
        .send({})
    ).status,
    403,
  );
  assert.equal(
    (
      await request(app)
        .post("/api/bookings")
        .send({
          name: "Test Person",
          phone: "9876543210",
          address: "House 12, Sector 62",
          city: "Noida",
          service: serviceId,
          date: "2020-01-01",
          time: "9:00 AM – 12:00 PM",
        })
    ).status,
    400,
  );
});
test("booking persists and admin can update it, with accurate dashboard/customer data", async () => {
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const res = await request(app)
    .post("/api/bookings")
    .send({
      name: "Asha Sharma",
      phone: "9876543210",
      address: "House 12, Sector 62",
      city: "Noida",
      service: serviceId,
      date,
      time: "9:00 AM – 12:00 PM",
      status: "Completed",
    });
  assert.equal(res.status, 201);
  bookingId = res.body.id;
  const saved = await Booking.findById(bookingId);
  assert.equal(saved.status, "Pending");
  assert.equal(saved.serviceName, "Ring Repair");
  assert.equal(
    (
      await admin
        .patch("/api/admin/bookings/" + bookingId)
        .send({ status: "Completed" })
    ).body.status,
    "Completed",
  );
  const dash = (await admin.get("/api/admin/dashboard")).body;
  assert.equal(dash.total, 1);
  assert.equal(dash.completed, 1);
  assert.equal(dash.pending, 0);
  assert.equal(dash.months.length, 12);
  assert.equal((await admin.get("/api/admin/customers")).body[0].bookings, 1);
});
test("enquiries persist, validate, and support admin resolution", async () => {
  assert.equal(
    (
      await request(app)
        .post("/api/messages")
        .send({ name: "Asha", email: "bad", message: "Hello" })
    ).status,
    400,
  );
  const res = await request(app)
    .post("/api/messages")
    .send({
      name: "Asha Sharma",
      email: "asha@example.com",
      message: "Could you repair a family heirloom ring?",
    });
  assert.equal(res.status, 201);
  messageId = res.body.id;
  assert.ok(await Message.findById(messageId));
  assert.equal(
    (
      await admin
        .patch("/api/admin/messages/" + messageId)
        .send({ status: "Resolved" })
    ).body.status,
    "Resolved",
  );
});
test("admin service and charge CRUD validates and persists", async () => {
  let res = await admin
    .post("/api/admin/services")
    .send({ ...services[0], name: "Test Repair" });
  assert.equal(res.status, 201);
  const id = res.body._id;
  res = await admin
    .put("/api/admin/services/" + id)
    .send({ ...services[0], name: "Updated Repair", active: false });
  assert.equal(res.body.active, false);
  assert.equal(
    (await request(app).get("/api/services")).body.some((x) => x._id === id),
    false,
  );
  assert.equal((await admin.delete("/api/admin/services/" + id)).status, 200);
  assert.equal(
    (
      await admin
        .post("/api/admin/repair-charges")
        .send({ name: "Bad Price", min: 1000, max: 100 })
    ).status,
    400,
  );
  res = await admin
    .post("/api/admin/repair-charges")
    .send({ name: "Test Price", min: 100, max: 200 });
  assert.equal(res.status, 201);
  assert.equal(
    (await admin.delete("/api/admin/repair-charges/" + res.body._id)).status,
    200,
  );
  assert.equal(
    (
      await admin
        .patch("/api/admin/bookings/not-an-id")
        .send({ status: "Pending" })
    ).status,
    400,
  );
  assert.equal(
    (
      await admin
        .patch("/api/admin/bookings/" + bookingId)
        .send({ status: "MadeUp" })
    ).status,
    400,
  );
});
test("settings are shared publicly and logout revokes browser access", async () => {
  const body = {
    name: "Sunar Karighar",
    phone: "+91 98765 43210",
    email: "hello@example.com",
    address: "Sector 62, Noida",
    hours: "Monday to Saturday",
  };
  assert.equal((await admin.put("/api/admin/settings").send(body)).status, 200);
  assert.equal(
    (await request(app).get("/api/settings")).body.email,
    body.email,
  );
  assert.equal((await admin.post("/api/auth/logout")).status, 200);
  assert.equal((await admin.get("/api/admin/bookings")).status, 401);
});


test("Render origin fallback and production session cookies", async () => {
  const previous = Object.fromEntries(["CLIENT_ORIGIN", "RENDER_EXTERNAL_URL", "NODE_ENV"].map(key => [key, process.env[key]]));
  try {
    delete process.env.CLIENT_ORIGIN;
    process.env.RENDER_EXTERNAL_URL = "https://sunar-test.onrender.com";
    process.env.NODE_ENV = "production";
    const health = await request(app).get("/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.database, "connected");
    const login = await request(app).post("/api/auth/login")
      .set("Origin", process.env.RENDER_EXTERNAL_URL)
      .send({ email: "admin@example.com", password: "TestPassword!123" });
    assert.equal(login.status, 200);
    assert.equal(login.headers["access-control-allow-origin"], process.env.RENDER_EXTERNAL_URL);
    assert.match(login.headers["set-cookie"][0], /Secure/);
    assert.match(login.headers["set-cookie"][0], /HttpOnly/);
    assert.match(login.headers["set-cookie"][0], /SameSite=Strict/);
    const rejected = await request(app).post("/api/auth/logout").set("Origin", "https://other.example");
    assert.equal(rejected.status, 403);
    process.env.CLIENT_ORIGIN = "https://custom.example";
    assert.equal((await request(app).post("/api/auth/logout").set("Origin", "https://custom.example")).status, 200);
    assert.equal((await request(app).post("/api/auth/logout").set("Origin", process.env.RENDER_EXTERNAL_URL)).status, 403);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
