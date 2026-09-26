import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE_URL = "http://127.0.0.1:4200";
const AUTH_KEY = "dentalab-auth";
const AUTH_VALUE = "evidence-run";

const ROUTE_STATES = [
  "/login",
  "/dashboard",
  "/orders",
  "/patients",
  "/doctors",
  "/billing",
  "/change-requests",
  "/workflow-board",
  "/settings",
  "/cases",
  "/clinics",
  "/scan-center",
  "/documents",
  "/reports",
  "/notifications",
  "/grid",
  "/forms",
  "/forms#restoration-form",
  "/forms#doctor-form",
  "/forms#billing-config",
  "/forms#change-request",
  "/forms#scan-info",
  "/forms#validation-states",
  "/orders/create",
];

const OVERFLOW_ROUTES = [
  "/dashboard",
  "/orders",
  "/forms",
  "/patients",
  "/workflow-board",
];

const VIEWPORTS = [
  { key: "desktop-1440", width: 1440, height: 900 },
  { key: "tablet-768", width: 768, height: 1024 },
  { key: "mobile-375", width: 375, height: 812 },
];

const EVIDENCE = {
  accessibilityDir: path.join(ROOT, "evidence", "accessibility"),
  responsiveDir: path.join(ROOT, "evidence", "responsive"),
  statesDir: path.join(ROOT, "evidence", "states"),
};

function nowIso() {
  return new Date().toISOString();
}

async function ensureDirs() {
  await mkdir(EVIDENCE.accessibilityDir, { recursive: true });
  await mkdir(EVIDENCE.responsiveDir, { recursive: true });
  await mkdir(EVIDENCE.statesDir, { recursive: true });
  for (const viewport of VIEWPORTS) {
    await mkdir(path.join(EVIDENCE.responsiveDir, viewport.key), {
      recursive: true,
    });
  }
}

async function waitForServerReady(timeoutMs = 120_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Retry until timeout.
    }
    await delay(1_000);
  }
  throw new Error("Timed out waiting for ng serve on port 4200");
}

function startDevServer() {
  const ngCli = path.join(ROOT, "node_modules", "@angular", "cli", "bin", "ng.js");
  const child = spawn(
    process.execPath,
    [ngCli, "serve", "--host", "127.0.0.1", "--port", "4200", "--no-open"],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    },
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(String(chunk));
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });

  return child;
}

function stopDevServer(child) {
  return new Promise((resolve) => {
    if (child.killed) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!child.killed) child.kill("SIGKILL");
    }, 5_000);
  });
}

async function collectAxeReport(browser) {
  const authContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await authContext.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [AUTH_KEY, AUTH_VALUE],
  );
  const guestContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const authPage = await authContext.newPage();
  const guestPage = await guestContext.newPage();
  const axeSource = await readFile(
    path.join(ROOT, "node_modules", "axe-core", "axe.min.js"),
    "utf8",
  );

  const routes = [];
  for (const route of ROUTE_STATES) {
    const page = route === "/login" ? guestPage : authPage;
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axeSource });
    const report = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
      });
      const wcagViolationCount = result.violations.filter((violation) =>
        violation.tags.some((tag) => tag.startsWith("wcag2a")),
      ).length;
      return {
        violations: result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact ?? null,
          help: violation.help,
          helpUrl: violation.helpUrl,
          description: violation.description,
          tags: violation.tags,
          nodes: violation.nodes.length,
        })),
        violationCount: result.violations.length,
        wcagViolationCount,
      };
    });
    routes.push({
      route,
      ok: report.violationCount === 0,
      violations: report.violations,
      violationCount: report.violationCount,
      wcagViolationCount: report.wcagViolationCount,
    });
  }
  await authContext.close();
  await guestContext.close();

  const payload = {
    generatedAt: nowIso(),
    scope: "axe-core tags: wcag2a, wcag2aa, best-practice",
    routes,
  };
  await writeFile(
    path.join(EVIDENCE.accessibilityDir, "axe-report.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  const summaryLines = [
    "# Accessibility evidence (axe-core + keyboard walkthrough)",
    "",
    `- Generated: ${payload.generatedAt}`,
    `- Scope: ${payload.scope}`,
    `- Static build: ${BASE_URL} (auth bypass via localStorage ${AUTH_KEY})`,
    "",
  ];
  let totalViolations = 0;
  let totalWcag = 0;
  for (const route of routes) {
    totalViolations += route.violationCount;
    totalWcag += route.wcagViolationCount;
    summaryLines.push(`## ${route.route}`);
    summaryLines.push("");
    summaryLines.push(`- Total violations (incl. best-practice): ${route.violationCount}`);
    summaryLines.push(`- WCAG 2.0/2.1 A+AA violations: ${route.wcagViolationCount}`);
    summaryLines.push("");
  }
  summaryLines.push(
    `**Totals:** ${totalWcag} WCAG A/AA violations, ${totalViolations} incl. best-practice across ${routes.length} routes.`,
  );
  summaryLines.push("");

  await writeFile(
    path.join(EVIDENCE.accessibilityDir, "axe-summary.md"),
    summaryLines.join("\n"),
    "utf8",
  );

  return payload;
}

async function captureOrdersStates(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [AUTH_KEY, AUTH_VALUE],
  );
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle" });

  const states = ["normal", "loading", "empty", "error"];
  for (const state of states) {
    await page.getByRole("button", { name: state, exact: true }).click();
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(EVIDENCE.statesDir, `orders-${state}.png`),
      fullPage: true,
    });
  }

  await writeFile(
    path.join(EVIDENCE.statesDir, "README.md"),
    [
      "# Order state screenshots",
      "",
      `Generated: ${nowIso()}`,
      "",
      "- `orders-normal.png`",
      "- `orders-loading.png`",
      "- `orders-empty.png`",
      "- `orders-error.png`",
      "",
    ].join("\n"),
    "utf8",
  );

  await context.close();
}

async function evaluateOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth > window.innerWidth;
    const offenders = [];
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 1) {
        const tag = el.tagName.toLowerCase();
        const cls =
          typeof el.className === "string" && el.className.trim().length > 0
            ? `.${el.className.trim().replace(/\s+/g, ".")}`
            : "";
        offenders.push(`${tag}${cls} (right=${Math.round(rect.right)})`);
        if (offenders.length === 6) break;
      }
    }
    return {
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      horizontalOverflow: overflow,
      offenders,
    };
  });
}

async function captureResponsivePack(browser) {
  const notes = [];
  const overflow = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    await context.addInitScript(
      ([key, value]) => {
        localStorage.setItem(key, value);
      },
      [AUTH_KEY, AUTH_VALUE],
    );
    const page = await context.newPage();
    const viewportDir = path.join(EVIDENCE.responsiveDir, viewport.key);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(viewportDir, "layout-shell.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(viewportDir, "cards.png"),
      fullPage: true,
    });

    const toggle = page.getByRole("button", { name: "Toggle sidebar" });
    const toggleCount = await toggle.count();
    if (toggleCount > 0 && (viewport.key === "mobile-375" || viewport.key === "tablet-768")) {
      await toggle.first().click();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(viewportDir, "sidebar-open.png"),
        fullPage: true,
      });
      if (viewport.key === "mobile-375") {
        await page.mouse.click(viewport.width - 8, Math.floor(viewport.height / 2));
        await page.waitForTimeout(250);
      }
    }

    await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(viewportDir, "orders-table.png"),
      fullPage: true,
    });

    await page.goto(`${BASE_URL}/forms`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(viewportDir, "forms.png"),
      fullPage: true,
    });

    await page.goto(`${BASE_URL}/patients`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(viewportDir, "toolbars.png"),
      fullPage: true,
    });
    const addPatient = page.getByRole("button", { name: /add patient/i });
    if (await addPatient.count()) {
      await addPatient.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(viewportDir, "dialog.png"),
        fullPage: true,
      });
      const close = page.getByRole("button", { name: /cancel|close/i });
      if (await close.count()) await close.first().click();
    }

    await page.goto(`${BASE_URL}/workflow-board`, {
      waitUntil: "networkidle",
    });
    await page.screenshot({
      path: path.join(viewportDir, "workflow-board.png"),
      fullPage: true,
    });

    for (const route of OVERFLOW_ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      const metrics = await evaluateOverflow(page);
      overflow.push({
        viewport: viewport.key,
        page: route,
        ...metrics,
      });
      notes.push(
        `${viewport.key}${route}: overflow=${metrics.horizontalOverflow}`,
      );
    }

    await context.close();
  }

  const overflowPayload = {
    generatedAt: nowIso(),
    notes,
    overflow,
  };
  await writeFile(
    path.join(EVIDENCE.responsiveDir, "overflow-results.json"),
    `${JSON.stringify(overflowPayload, null, 2)}\n`,
    "utf8",
  );
}

async function captureSidebarResults(browser) {
  const results = [];
  for (const viewport of VIEWPORTS.filter((v) => v.key !== "desktop-1440")) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    await context.addInitScript(
      ([key, value]) => {
        localStorage.setItem(key, value);
      },
      [AUTH_KEY, AUTH_VALUE],
    );
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

    const sidebarX = async () =>
      page.evaluate(() => {
        const aside = document.querySelector("aside");
        if (!aside) return null;
        return Math.round(aside.getBoundingClientRect().x);
      });

    const initialX = await sidebarX();
    const toggle = page.getByRole("button", { name: "Toggle sidebar" });
    if (await toggle.count()) {
      await toggle.first().click();
      await page.waitForTimeout(250);
    }
    const openedX = await sidebarX();
    if (viewport.key === "mobile-375") {
      await page.mouse.click(viewport.width - 8, Math.floor(viewport.height / 2));
      await page.waitForTimeout(250);
    }
    const closedX = await sidebarX();
    results.push({
      viewport: viewport.key,
      initialX,
      openedX,
      closedX,
      drawerOpens:
        initialX != null && openedX != null ? openedX > initialX : false,
      backdropCloses:
        openedX != null && closedX != null ? closedX < openedX : false,
    });

    await context.close();
  }

  const payload = {
    generatedAt: nowIso(),
    method:
      "Playwright: Toggle sidebar button then backdrop click (mobile only; tablet sidebar is persistent at >=640px)",
    results,
  };
  await writeFile(
    path.join(EVIDENCE.responsiveDir, "sidebar-toggle-results.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

async function printManifest() {
  const files = [
    path.join(EVIDENCE.accessibilityDir, "axe-report.json"),
    path.join(EVIDENCE.accessibilityDir, "axe-summary.md"),
    path.join(EVIDENCE.responsiveDir, "overflow-results.json"),
    path.join(EVIDENCE.responsiveDir, "sidebar-toggle-results.json"),
    path.join(EVIDENCE.statesDir, "orders-normal.png"),
    path.join(EVIDENCE.statesDir, "orders-loading.png"),
    path.join(EVIDENCE.statesDir, "orders-empty.png"),
    path.join(EVIDENCE.statesDir, "orders-error.png"),
  ];
  for (const viewport of VIEWPORTS) {
    for (const name of [
      "layout-shell.png",
      "cards.png",
      "orders-table.png",
      "forms.png",
      "toolbars.png",
      "dialog.png",
      "workflow-board.png",
    ]) {
      files.push(path.join(EVIDENCE.responsiveDir, viewport.key, name));
    }
    if (viewport.key !== "desktop-1440") {
      files.push(path.join(EVIDENCE.responsiveDir, viewport.key, "sidebar-open.png"));
    }
  }

  console.log("Evidence file manifest:");
  for (const file of files) {
    const rel = path.relative(ROOT, file).replaceAll("\\", "/");
    const size = (await stat(file)).size;
    console.log(`- ${rel}: ${size} bytes`);
  }
}

async function main() {
  await ensureDirs();
  const server = startDevServer();
  let browser;
  try {
    await waitForServerReady();
    browser = await chromium.launch({ headless: true });
    await collectAxeReport(browser);
    await captureResponsivePack(browser);
    await captureSidebarResults(browser);
    await captureOrdersStates(browser);
    await printManifest();
  } finally {
    if (browser) await browser.close();
    await stopDevServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
