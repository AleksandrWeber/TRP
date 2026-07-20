import { spawn } from 'node:child_process';

export interface CommandResult {
  readonly command: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
}

export async function runCommand(
  command: string,
  args: readonly string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
  },
): Promise<CommandResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      env: { ...process.env, ...options.env, CI: process.env.CI ?? 'true' },
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer =
      options.timeoutMs !== undefined
        ? setTimeout(() => {
            if (!settled) {
              child.kill('SIGTERM');
              settled = true;
              resolve({
                command: `${command} ${args.join(' ')}`,
                exitCode: 124,
                stdout,
                stderr: `${stderr}\n[timeout after ${options.timeoutMs}ms]`,
                durationMs: Date.now() - started,
              });
            }
          }, options.timeoutMs)
        : undefined;

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({
        command: `${command} ${args.join(' ')}`,
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`,
        durationMs: Date.now() - started,
      });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({
        command: `${command} ${args.join(' ')}`,
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - started,
      });
    });
  });
}

export async function runPnpm(
  args: readonly string[],
  cwd: string,
  timeoutMs = 600_000,
  env?: NodeJS.ProcessEnv,
): Promise<CommandResult> {
  return runCommand('pnpm', args, { cwd, timeoutMs, env });
}
