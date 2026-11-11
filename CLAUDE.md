# CLAUDE.md

All project context, rules, architecture and history live in `AGENTS.md`. It is imported below so Claude Code loads it automatically; other tools should open `AGENTS.md` directly.

@AGENTS.md

## Mandatory logging rule

Every change made in this repository (code, content, assets, dependencies, config, git or deployment, and any decision taken with the user) must be logged in detail in the Changelog section of `AGENTS.md` (section 17), newest entry first, using the template in 17.1, before the session ends. Also update any section of `AGENTS.md` that the change makes out of date. No agent session may leave the repository in a state that `AGENTS.md` does not describe.
