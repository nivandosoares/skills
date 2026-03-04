import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile, symlink, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installSkillForAgent } from '../src/installer.ts';

describe('installer symlink safety', () => {
  it('skips symlink entries in skill source to prevent local file exfiltration', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skills-symlink-safety-'));
    const projectDir = join(root, 'project');
    const sourceSkillDir = join(root, 'source-skill');
    const secretFile = join(root, 'victim-secret.txt');

    await mkdir(projectDir, { recursive: true });
    await mkdir(sourceSkillDir, { recursive: true });
    await writeFile(secretFile, 'super-secret-token', 'utf-8');
    await writeFile(
      join(sourceSkillDir, 'SKILL.md'),
      '---\nname: symlink-safety\ndescription: test\n---\n',
      'utf-8'
    );

    // Attacker-controlled symlink pointing outside the repository root.
    await symlink(secretFile, join(sourceSkillDir, 'stolen.txt'));

    try {
      const result = await installSkillForAgent(
        {
          name: 'symlink-safety',
          description: 'test',
          path: sourceSkillDir,
        },
        'amp',
        { cwd: projectDir, mode: 'symlink', global: false }
      );

      expect(result.success).toBe(true);

      const installedSkillDir = join(projectDir, '.agents', 'skills', 'symlink-safety');
      const installedSkillMd = await readFile(join(installedSkillDir, 'SKILL.md'), 'utf-8');
      expect(installedSkillMd).toContain('name: symlink-safety');

      // Symlink payload should not be installed.
      await expect(access(join(installedSkillDir, 'stolen.txt'))).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
