# Gumball MCP server

Ring a real siren light from your AI agent.

[Gumball](https://getgumball.com) is a WiFi revolving light with a speaker that
celebrates when something happens: a sale, a new user, a deploy. This is its
**MCP server** (Model Context Protocol), so Claude, Claude Code, Cursor
and other MCP clients can make it spin, play a sound, change its volume or
mute it, just by asking:

> "Ring the Gumball when the deploy is done."
> "Play sound 5 when the tests pass."
> "Mute the office Gumball until tomorrow."

It's a hosted server: nothing to install.

| | |
|---|---|
| **Address** | `https://app.getgumball.com/mcp` |
| **Transport** | Streamable HTTP (JSON answers, no session) |
| **Auth** | `Authorization: Bearer gb_...`, or the token in the address: `/mcp/gb_...` |
| **Rate limit** | 30 actions a minute per token |

## Tools

| Tool | What it does |
|---|---|
| `list_gumballs` | Your Gumballs, with their name, id and whether they're online. Read-only. |
| `ring_gumball` | Spin the light and play a sound from the SD card (`sound`, default 1; 0 = light only). |
| `play_random_sound` | Spin and play a random sound between `from` and `to`. |
| `set_volume` | `volume` from 0 (silent) to 21 (loudest). |
| `mute_gumball` | Sleep mode: ignore notifications until unmuted. |
| `unmute_gumball` | Back to normal. |

Every tool takes an optional `gumball` (name or id), only needed when the
account has several. Agents can't change WiFi, firmware or passwords.

## 1. Make a token

Sign in to your [Gumball account](https://app.getgumball.com), find **AI agents
& command line**, give the token a name ("Claude") and click **Make a token**.
Make one token per app, so you can cut one off without touching the others.
Treat it like a password: anyone who has it can ring your Gumballs. Every
action shows in your Gumball's activity list with the token's name.

## 2. Connect your assistant

**Claude** (claude.ai and the desktop app): Settings → Connectors → *Add custom
connector*. Name it Gumball, address `https://app.getgumball.com/mcp`, and add
a request header `Authorization` with the value `Bearer gb_your_token`.

Use the header whenever the app allows it. For apps that only take an address,
put the token in it: `https://app.getgumball.com/mcp/gb_your_token`. That
address **is** your token: keep it out of screenshots, listings, issues and
shared configs. If it leaks, delete the token and make a new one.

**ChatGPT** (not fully tested yet): Settings → Apps & Connectors → turn on
developer mode (beta, web only), then *Create* a connector with the address
form above. Ringing is a write action, which OpenAI doesn't allow on every
plan yet: if ChatGPT can list your Gumballs but not ring them, that's the plan.

**Claude Code**:

```
claude mcp add --transport http gumball https://app.getgumball.com/mcp --header "Authorization: Bearer gb_your_token"
```

**Cursor, VS Code and other MCP apps** (`mcp.json`):

```json
{
  "mcpServers": {
    "gumball": {
      "url": "https://app.getgumball.com/mcp",
      "headers": { "Authorization": "Bearer gb_your_token" }
    }
  }
}
```

## Command line

The [`getgumball`](https://www.npmjs.com/package/getgumball) CLI talks to the
same endpoint, for scripts, CI and the terminal. Source in [`cli/`](cli).

```
npx getgumball login gb_your_token
npx getgumball ring --sound 3
```

Also `list`, `random 1 15`, `volume 12`, `mute`, `unmute`, and `--json`. In
CI, skip the login and set `GUMBALL_TOKEN`:

```
GUMBALL_TOKEN=gb_your_token npx getgumball ring --sound 5
```

## Self-hosted

Running your own Gumball server? Use its address instead of
`app.getgumball.com` (and `--server https://your.server` with the CLI).

## Links

- Guide: <https://getgumball.com/ai-agents/>
- Gumball: <https://getgumball.com>
- CLI on npm: <https://www.npmjs.com/package/getgumball>
- Issues: <https://github.com/thinkmojo/gumball-mcp/issues>

Made in Montreal by [Thinkmojo](https://thinkmojo.com). MIT licensed.
