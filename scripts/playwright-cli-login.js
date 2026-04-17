const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const baseUrl = process.env.RECIPE_KEEPER_BASE_URL || 'http://localhost:4200';
const email = process.env.RECIPE_KEEPER_LOGIN_EMAIL || 'marxlukas@gmail.com';
const password = process.env.RECIPE_KEEPER_LOGIN_PASSWORD || '12345678';
const stateFile = process.env.RECIPE_KEEPER_STATE_FILE || path.join(repoRoot, '.playwright-cli', 'auth-state.json');
const loginUrl = new URL('/login', baseUrl).toString();

function quoteShellArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function runPlaywrightCli(command) {
  const result = spawnSync(command, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
    env: { ...process.env },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const verifyLoginCode = [
  'async page => {',
  "  await page.waitForURL('**/recipes', { timeout: 15000 });",
  "  await page.waitForFunction(() => Boolean(window.localStorage.getItem('access_token')), { timeout: 15000 });",
  '}',
].join(' ');

try { runPlaywrightCli('playwright-cli close'); } catch {}
fs.mkdirSync(path.dirname(stateFile), { recursive: true });

runPlaywrightCli(`playwright-cli open ${quoteShellArg(loginUrl)}`);
runPlaywrightCli(`playwright-cli fill ${quoteShellArg("input[formcontrolname='email']")} ${quoteShellArg(email)}`);
runPlaywrightCli(`playwright-cli fill ${quoteShellArg("input[formcontrolname='password']")} ${quoteShellArg(password)}`);
runPlaywrightCli(`playwright-cli click ${quoteShellArg("getByRole('button', { name: 'Sign in', exact: true })")}`);
runPlaywrightCli(`playwright-cli run-code ${quoteShellArg(verifyLoginCode)}`);
runPlaywrightCli(`playwright-cli state-save ${quoteShellArg(stateFile)}`);

process.stdout.write(`Login completed for ${email}\n`);
process.stdout.write(`Auth state saved to ${stateFile}\n`);
