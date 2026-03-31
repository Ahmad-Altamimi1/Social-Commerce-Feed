import { spawn } from "node:child_process";
import net from "node:net";

const DB_CONTAINER = "socialshop-postgres";
const DB_PORT = "55432";
const DB_URL = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/socialshop`;
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function runPnpm(args, options = {}) {
  const command =
    process.platform === "win32"
      ? `pnpm.cmd ${args.join(" ")}`
      : `pnpm ${args.join(" ")}`;
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: "inherit",
      shell: true,
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed with code ${code}`));
    });
  });
}

function runCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...options,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function ensureDockerReady() {
  await run("docker", ["info"]);
}

async function ensureDatabaseContainer() {
  const names = await runCapture("docker", [
    "ps",
    "-a",
    "--filter",
    `name=^/${DB_CONTAINER}$`,
    "--format",
    "{{.Names}}",
  ]);

  if (!names.includes(DB_CONTAINER)) {
    await run("docker", [
      "run",
      "-d",
      "--name",
      DB_CONTAINER,
      "-e",
      "POSTGRES_USER=postgres",
      "-e",
      "POSTGRES_PASSWORD=postgres",
      "-e",
      "POSTGRES_DB=socialshop",
      "-p",
      `${DB_PORT}:5432`,
      "postgres:16-alpine",
    ]);
  } else {
    await run("docker", ["start", DB_CONTAINER]);
  }
}

async function waitForDatabaseReady() {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      await run("docker", [
        "exec",
        DB_CONTAINER,
        "pg_isready",
        "-U",
        "postgres",
        "-d",
        "socialshop",
      ]);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Database did not become ready in time.");
}

function startService(name, command, env) {
  const child = spawn(command, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findFreePort(startPort, maxAttempts = 50) {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found starting at ${startPort}`);
}

async function main() {
  try {
    console.log("Checking Docker...");
    await ensureDockerReady();

    console.log("Ensuring local Postgres container...");
    await ensureDatabaseContainer();

    console.log("Waiting for database to be ready...");
    await waitForDatabaseReady();

    console.log("Applying database schema...");
    await runPnpm(
      ["--filter", "@workspace/db", "run", "push"],
      { env: { ...process.env, DATABASE_URL: DB_URL } },
    );

    const webPort = await findFreePort(23910);
    console.log(`Starting Next.js web app on ${webPort}...`);

    const web = startService(
      "web",
      "pnpm --filter @workspace/insta-store run dev",
      {
        PORT: String(webPort),
        DATABASE_URL: DB_URL,
      },
    );

    const stop = () => {
      web.kill();
      process.exit(0);
    };

    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
