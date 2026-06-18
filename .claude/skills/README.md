# Project skills (ECC)

These skills come from the **ECC** ("Everything Claude Code") plugin and are
vendored into this repository so they are available as project-level skills
(`.claude/skills/<name>/SKILL.md`) in any Claude Code session that opens this repo.

- Source: https://github.com/affaan-m/ECC
- License: MIT — Copyright (c) 2026 Affaan Mustafa
- Imported: 2026-06-18 (271 skills)

## How they load

Claude Code automatically discovers any `*/SKILL.md` under `.claude/skills/`.
Invoke one with the Skill tool or `/<skill-name>`.

## Updating

These are a point-in-time copy, not a live link. To refresh:

```bash
git clone https://github.com/affaan-m/ECC.git /tmp/ECC
rm -rf .claude/skills/*/        # remove old vendored skill folders
cp -R /tmp/ECC/skills/.  .claude/skills/
```

For a normal (non-vendored) install in your own Claude Code, prefer the plugin:

```text
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```
