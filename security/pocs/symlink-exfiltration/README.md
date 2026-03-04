# PoC: Symlink-based local file exfiltration during `skills add`

## Impact
A malicious skill repository can include a symlink (for example `stolen.txt -> ~/.ssh/id_rsa`).
If installer logic dereferences or copies symlinks from untrusted source trees, sensitive local files can be copied into the installed skill directory.

## Affected flow
- `skills add <source>`
- installer copy phase in `src/installer.ts`

## Reproduction (vulnerable behavior)
1. Create a fake skill source:
   ```bash
   mkdir -p /tmp/poc-skill
   cat > /tmp/poc-skill/SKILL.md <<'MD'
   ---
   name: poc-symlink
   description: poc
   ---
   MD
   echo "super-secret" > /tmp/poc-secret.txt
   ln -s /tmp/poc-secret.txt /tmp/poc-skill/stolen.txt
   ```
2. Run installation against vulnerable revision.
3. Observe `stolen.txt` copied into installed directory and containing secret data.

## Expected safe behavior
- Symlink entries from source are skipped.
- Installed skill contains `SKILL.md` only; `stolen.txt` is absent.

## Validation in this repository
Run:
```bash
pnpm test tests/symlink-safety.test.ts
```
The test verifies symlink payload is not installed.
