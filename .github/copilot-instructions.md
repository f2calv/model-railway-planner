# Copilot Instructions

## Shared Instructions

Shared Copilot instructions, skills and prompts are maintained centrally in the
[account-level .github repository](https://github.com/f2calv/.github), under
`.github/instructions/`, `.github/skills/` and `.github/prompts/`. They are deliberately not
copied here.

Follow that repository's README for VS Code workspace or user-profile setup. This pointer does
not itself load shared customizations. If the shared instruction files are unavailable, stop and
tell the user rather than guessing the conventions.

Everything below is specific to this repository.

## Application Context

Before changing the application, consult:

- [README](../README.md) for purpose, current features, local development and user-facing limits.
- [Client-side planner decision record](../docs/adr-0001-client-side-planner.md) for design rationale,
  architectural boundaries and the significant decisions behind the application.
- [Architecture and code map](../docs/architecture.md) to locate the responsibilities involved.

Read the relevant topic guide for the task:
[catalogs](../docs/catalog.md), [baseboards](../docs/baseboards.md),
[rooms and furniture](../docs/rooms.md), or [track power](../docs/power.md).

Keep reusable technology guidance in the central repository and application-specific rationale in
these documents. Use source, issues and releases to establish current behavior and delivery status;
do not turn a conversation transcript into permanent instructions.
