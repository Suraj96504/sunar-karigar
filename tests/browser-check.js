import { chromium } from "@playwright/test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import path from "node:path";
import { createServer } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";
import { app } from "../server/src/app.js";
import { User, Service, Charge, Settings } from "../server/src/models/index.js";
import { services, charges, business } from "../server/src/data.js";
import assert from "node:assert/strict";
process.env.JWT_SECRET =
  "browser-test-only-secret-at-least-thirty-two-characters";
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
await User.create({
  name: "Admin",
  email: "admin@example.com",
  passwordHash: await bcrypt.hash("TestPassword!123", 12),
});
await Service.insertMany(services);
await Charge.insertMany(charges);
await Settings.create({ key: "business", ...business });
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const apiURL = `http://127.0.0.1:${server.address().port}`;
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, "127.0.0.1", resolve));
const browserPort = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const base = `http://127.0.0.1:${browserPort}`;
process.env.CLIENT_ORIGIN = base;
const vite = spawn(
  process.execPath,
  [path.resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(browserPort), "--strictPort"],
  { cwd: process.cwd() + "/client", stdio: "pipe", env: { ...process.env, API_PROXY_TARGET: apiURL } },
);
let browser;
const errors = [];
const results = [];
try {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  await mkdir("artifacts", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => errors.push(e.message));

  async function checkImages(page) {
    if (new URL(page.url()).pathname.startsWith("/admin")) return;
    const images = await page.locator('.photo img').evaluateAll(async elements => {
      await Promise.all(elements.map(async img => { img.loading = 'eager'; try { await img.decode(); } catch {} }));
      return elements.map(img => ({ src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0, alt: img.alt }));
    });
    assert.ok(images.length > 0, 'Page contains replacement photography');
    for (const image of images) {
      assert.ok(image.loaded, `High-resolution image loads: ${image.src}`);
      assert.ok(image.alt.length > 10, 'Image has descriptive alternative text');
      assert.ok(image.src.includes('/images/') && image.src.endsWith('.webp'), 'Image uses optimized local photography');
    }
  }

  for (const [path, name] of [
    ["/", "home"],
    ["/services", "services"],
    ["/repair-charges", "repair-charges"],
    ["/book-service", "book-service"],
    ["/about", "about"],
    ["/contact", "contact"],
    ["/login", "login"],
  ]) {
    await page.goto(base + path);
    await page.waitForLoadState("networkidle");
    await checkImages(page);
    await page.screenshot({
      path: `artifacts/desktop-${name}.png`,
      fullPage: true,
    });
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${path} desktop overflow`,
    );
    results.push(`Desktop ${path}: rendered without overflow`);
  }
  await page.goto(base + "/admin/bookings");
  await page.waitForURL("**/login");
  results.push("Protected route redirects to login");
  await page.goto(base + "/book-service?service=Ring%20Repair");
  await page.waitForLoadState("networkidle");
  await page
    .getByLabel(/Select Service/)
    .selectOption({ label: "Ring Repair" });
  await page
    .getByLabel(/Preferred Date/)
    .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  await page
    .getByLabel(/Preferred Time/)
    .selectOption({ label: "9:00 AM – 12:00 PM" });
  await page.getByLabel(/Full Name/).fill("Asha Sharma");
  await page.getByLabel(/Mobile Number/).fill("123");
  assert.equal(await page.getByLabel(/Mobile Number/).evaluate(input=>input.checkValidity()),false,'Invalid phone rejected by browser');
  await page.getByLabel(/Mobile Number/).fill("9876543210");
  await page.getByLabel(/^Address/).fill("House 12, Sector 62");
  await page.getByLabel(/^City/).fill("Noida");
  await page.getByRole("button", { name: "Book Now", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Reference:" }).waitFor();
  results.push("Booking form saves to MongoDB and displays reference");
  await page.goto(base + "/contact");
  await page.getByLabel(/Full Name/).fill("Asha Sharma");
  await page.getByLabel(/Email Address/).fill("asha@example.com");
  await page
    .getByLabel(/^Message/)
    .fill("Please let me know about repairing my gold ring.");
  await page.getByRole("button", { name: "Send Message", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Your message has been sent" })
    .waitFor();
  results.push("Contact form saves enquiry");
  await page.goto(base + "/login");
  await page
    .getByLabel("Email Address", { exact: true })
    .fill("admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("TestPassword!123");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "artifacts/desktop-admin.png",
    fullPage: true,
  });
  results.push("Admin login succeeds and dashboard renders real booking");
  for (const route of [
    "bookings",
    "services",
    "repair-charges",
    "customers",
    "messages",
    "settings",
  ]) {
    await page.goto(base + "/admin/" + route);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("h1").count(), 1);
    await checkImages(page);
    await page.screenshot({
      path: `artifacts/desktop-admin-${route}.png`,
      fullPage: true,
    });
    results.push(`Admin /admin/${route}: direct visit works`);
  }
  await page.goto(base + "/admin/bookings");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Status for Asha Sharma").selectOption("Completed");
  await page.reload();
  await page.waitForLoadState("networkidle");
  assert.equal(
    await page.getByLabel("Status for Asha Sharma").inputValue(),
    "Completed",
  );
  results.push("Booking status persists after refresh");
  await page.goto(base + "/admin/services");
  await page.getByRole("button", { name: "Add Service", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Custom Gold Repair");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A custom repair service.");
  await page.getByLabel("Starting Price (₹)", { exact: true }).fill("650");
  await page
    .getByLabel("Features (one per line)", { exact: true })
    .fill("Soldering\nPolishing");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await page
    .getByRole("cell", { name: "Custom Gold Repair A custom repair service." })
    .waitFor();
  results.push("Service creation works in admin UI");
  await page.goto(base + "/admin/messages");
  await page
    .getByLabel("Message status for Asha Sharma")
    .selectOption("Resolved");
  await page.reload();
  await page.waitForLoadState("networkidle");
  assert.equal(
    await page.getByLabel("Message status for Asha Sharma").inputValue(),
    "Resolved",
  );
  results.push("Enquiry status persists after refresh");
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  for (const [path, name] of [
    ["/", "home"],
    ["/services", "services"],
    ["/repair-charges", "repair-charges"],
    ["/book-service", "book-service"],
    ["/about", "about"],
    ["/contact", "contact"],
    ["/login", "login"],
  ]) {
    await mobile.goto(base + path);
    await mobile.waitForLoadState("networkidle");
    assert.equal(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${path} mobile overflow`,
    );
    await checkImages(mobile);
    await mobile.screenshot({
      path: `artifacts/mobile-${name}.png`,
      fullPage: true,
    });
    results.push(`Mobile ${path}: rendered without overflow`);
  }
  await mobile.goto(base + "/");
  await mobile.getByRole("button", { name: "Toggle navigation" }).click();
  await mobile
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await mobile.waitForURL("**/services");
  results.push("Mobile navigation opens and routes correctly");
  await mobile.goto(base + "/login");
  await mobile
    .getByLabel("Email Address", { exact: true })
    .fill("admin@example.com");
  await mobile.getByLabel("Password", { exact: true }).fill("TestPassword!123");
  await mobile.getByRole("button", { name: "Sign In", exact: true }).click();
  await mobile.waitForURL("**/admin");
  await mobile.waitForLoadState("networkidle");
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Admin mobile overflow",
  );
  await mobile.screenshot({
    path: "artifacts/mobile-admin.png",
    fullPage: true,
  });
  await mobile.getByRole("button", { name: "Toggle admin navigation" }).click();
  await mobile
    .getByRole("navigation", { name: "Admin navigation" })
    .getByRole("link", { name: "Bookings", exact: true })
    .click();
  await mobile.waitForURL("**/admin/bookings");
  results.push(
    "Mobile admin dashboard and sidebar navigation work without page overflow",
  );
  assert.deepEqual(errors, []);
  results.push("No uncaught browser errors");
  await writeFile(
    "artifacts/browser-results.json",
    JSON.stringify({ passed: true, results, errors }, null, 2),
  );
  console.log(results.join("\n"));
} finally {
  if (browser) await browser.close();
  vite.kill();
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
}
