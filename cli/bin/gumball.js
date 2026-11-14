#!/usr/bin/env node
// gumball: ring your Gumball from the terminal.
// Talks to the Gumball server's MCP endpoint with a personal access token.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_SERVER = 'https://app.getgumball.com';
const CONFIG = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'getgumball', 'config.json');

const HELP = `gumball: ring your Gumball from the terminal

  gumball login <token> [--server <address>]   save your token (make one on your account page)
  gumball list                                 your Gumballs, online or not
  gumball ring [gumball] [--sound N]           spin and play sound N (default 1, 0 = silent)
  gumball random <from> <to> [gumball]         spin and play a random sound in that range
  gumball volume <0-21> [gumball]              set the volume
  gumball mute [gumball]                       ignore notifications until unmuted
  gumball unmute [gumball]
  gumball logout                               forget the saved token

[gumball] is a name or id; leave it out if you have only one.
Add --json for machine-readable output. GUMBALL_TOKEN and GUMBALL_SERVER
override the saved settings, e.g. in CI:

  GUMBALL_TOKEN=gb_... npx getgumball ring --sound 3
`;

function parse(argv) {
  const args = []; const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json' || a === '-h' || a === '--help') flags[a.replace(/^-+/, '')] = true;
    else if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); flags[k] = v ?? argv[++i]; }
    else args.push(a);
  }
  return { args, flags };
}

const readConfig = () => { try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return {}; } };
function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG), { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600 });
}

function fail(message) { console.error(`gumball: ${message}`); process.exit(1); }

let nextId = 1;
async function callTool(server, token, name, args) {
  let res;
  try {
    res = await fetch(`${server.replace(/\/+$/, '')}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${token}`, 'mcp-protocol-version': '2025-06-18' },
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name, arguments: args } }),
    });
  } catch (e) { fail(`cannot reach ${server} (${e.cause?.code || e.message})`); }
  if (res.status === 401) fail('the token was not accepted. Make a new one on your account page, then: gumball login <token>');
  if (res.status === 429) fail('too many requests, wait a minute');
  let body;
  try { body = await res.json(); } catch { fail(`unexpected answer from ${server} (HTTP ${res.status})`); }
  if (body.error) fail(body.error.message);
  return body.result;
}

const int = (s, what) => { const n = Number(s); if (!Number.isInteger(n)) fail(`${what} must be a whole number`); return n; };

async function main() {
  const { args, flags } = parse(process.argv.slice(2));
  const [command, ...rest] = args;
  if (!command || flags.help || flags.h || command === 'help') { process.stdout.write(HELP); return; }

  const saved = readConfig();
  const server = flags.server || process.env.GUMBALL_SERVER || saved.server || DEFAULT_SERVER;

  if (command === 'login') {
    const token = rest[0];
    if (!token || !token.startsWith('gb_')) fail('usage: gumball login <token>   (tokens start with gb_)');
    const result = await callTool(server, token, 'list_gumballs', {});
    writeConfig({ server, token });
    const n = result.structuredContent?.gumballs?.length ?? 0;
    console.log(`Signed in to ${server}. ${n} Gumball${n === 1 ? '' : 's'} reachable. Try: gumball ring`);
    return;
  }
  if (command === 'logout') { fs.rmSync(CONFIG, { force: true }); console.log('Token forgotten.'); return; }

  const token = process.env.GUMBALL_TOKEN || saved.token;
  if (!token) fail('not signed in. Make a token on your account page (AI agents & command line), then: gumball login <token>');

  let name; let toolArgs = {};
  switch (command) {
    case 'list': case 'ls': name = 'list_gumballs'; break;
    case 'ring': name = 'ring_gumball'; toolArgs = { ...(rest[0] ? { gumball: rest[0] } : {}), ...(flags.sound !== undefined ? { sound: int(flags.sound, 'sound') } : {}) }; break;
    case 'random': if (rest.length < 2) fail('usage: gumball random <from> <to> [gumball]'); name = 'play_random_sound'; toolArgs = { from: int(rest[0], 'from'), to: int(rest[1], 'to'), ...(rest[2] ? { gumball: rest[2] } : {}) }; break;
    case 'volume': if (!rest.length) fail('usage: gumball volume <0-21> [gumball]'); name = 'set_volume'; toolArgs = { volume: int(rest[0], 'volume'), ...(rest[1] ? { gumball: rest[1] } : {}) }; break;
    case 'mute': name = 'mute_gumball'; toolArgs = rest[0] ? { gumball: rest[0] } : {}; break;
    case 'unmute': name = 'unmute_gumball'; toolArgs = rest[0] ? { gumball: rest[0] } : {}; break;
    default: fail(`unknown command "${command}". Run gumball --help`);
  }
  const result = await callTool(server, token, name, toolArgs);
  if (flags.json) console.log(JSON.stringify(result.structuredContent ?? { text: result.content?.[0]?.text, error: Boolean(result.isError) }, null, 2));
  else (result.isError ? console.error : console.log)(result.content?.map((c) => c.text).join('\n') ?? '');
  if (result.isError) process.exitCode = 1;
}

main();
