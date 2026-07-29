/**
 * Runs Prisma schema/seed commands across every service that owns a database.
 *
 * Each service is a separate Prisma project with its own schema, config and
 * DATABASE_URL, so there is no single `prisma` invocation that covers them all.
 */
import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'dotenv';

const SERVICES = [
  'auth-service',
  'user-service',
  'route-maps-service',
  'bus-seat-service',
  'booking-service',
  'payment-service',
  'modification-service',
  'notification-service',
] as const;

const COMMANDS = {
  push: ['prisma', 'db', 'push'],
  seed: ['prisma', 'db', 'seed'],
  // Drops every table before recreating it, so seeds start from a clean slate.
  reset: ['prisma', 'db', 'push', '--force-reset'],
} satisfies Record<string, string[]>;

type Step = keyof typeof COMMANDS;

const steps = process.argv.slice(2) as Step[];
if (steps.length === 0 || steps.some((step) => !(step in COMMANDS))) {
  console.error(`Usage: tsx tools/seed/run.ts <${Object.keys(COMMANDS).join('|')}> [...]`);
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, '../..');

/**
 * dotenv never overwrites an existing variable, so an ambient DATABASE_URL in
 * the shell would silently point a service at another service's database.
 * Reading each .env here and forcing it into the child env prevents that.
 */
function envFor(serviceDir: string): NodeJS.ProcessEnv {
  const envFile = resolve(serviceDir, '.env');
  if (!existsSync(envFile)) {
    return process.env;
  }
  return { ...process.env, ...parse(readFileSync(envFile)) };
}

for (const step of steps) {
  for (const service of SERVICES) {
    const cwd = resolve(repoRoot, 'apps', service);
    const env = envFor(cwd);
    console.log(`\n▶ ${service}: ${step}`);

    const result = spawnSync('npx', COMMANDS[step], {
      cwd,
      env,
      stdio: 'inherit',
      shell: true,
    });

    if (result.status !== 0) {
      console.error(`\n✖ ${service}: ${step} failed`);
      process.exit(result.status ?? 1);
    }
  }
}

console.log(`\n✔ Completed: ${steps.join(', ')}`);
