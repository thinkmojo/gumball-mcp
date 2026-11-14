# getgumball

Ring your [Gumball](https://getgumball.com) from the terminal, a script or CI.

```
npx getgumball login gb_your_token
npx getgumball ring --sound 3
```

Make the token on your Gumball account page, under **AI agents & command
line**. Installed globally (`npm i -g getgumball`) the command is simply
`gumball`.

| Command | What it does |
|---|---|
| `gumball list` | your Gumballs, online or not |
| `gumball ring [gumball] [--sound N]` | spin and play sound N (default 1, 0 = silent) |
| `gumball random <from> <to> [gumball]` | a random sound in that range |
| `gumball volume <0-21> [gumball]` | set the volume |
| `gumball mute [gumball]` / `unmute` | ignore notifications, or not |

`[gumball]` is a name or id, only needed when you have several. `--json`
prints machine-readable output.

In CI or scripts, skip `login` and set `GUMBALL_TOKEN` (and
`GUMBALL_SERVER` for a self-hosted server):

```
GUMBALL_TOKEN=gb_... npx getgumball ring --sound 5
```

Self-hosted: `gumball login gb_... --server https://your.server`.

No dependencies; Node 18 or later. It talks to the server's MCP endpoint
(`/mcp`), the same one Claude, ChatGPT and Cursor use.
