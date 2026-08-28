import { Request, RequestHandler, Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';

const execFileP = promisify(execFile);

const bytesToGB = (b: number) => +(b / 1024 / 1024 / 1024).toFixed(2);

async function getDiskUsage() {
  try {
    const { stdout } = await execFileP('df', ['-B1', '-P', '/']);
    const line = stdout.trim().split('\n')[1] || '';
    const parts = line.split(/\s+/);
    const total = Number(parts[1]) || 0;
    const used = Number(parts[2]) || 0;
    const free = Number(parts[3]) || 0;
    return {
      totalGB: bytesToGB(total),
      usedGB: bytesToGB(used),
      freeGB: bytesToGB(free),
      usedPercent: total ? +((used / total) * 100).toFixed(1) : 0,
    };
  } catch {
    return { totalGB: 0, usedGB: 0, freeGB: 0, usedPercent: 0 };
  }
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalGB: bytesToGB(total),
    usedGB: bytesToGB(used),
    freeGB: bytesToGB(free),
    usedPercent: +((used / total) * 100).toFixed(1),
  };
}

async function getSwapUsage() {
  try {
    const { stdout } = await execFileP('free', ['-b']);
    const swapLine = stdout.split('\n').find(l => l.toLowerCase().startsWith('swap:')) || '';
    const parts = swapLine.split(/\s+/);
    const total = Number(parts[1]) || 0;
    const used = Number(parts[2]) || 0;
    return {
      totalGB: bytesToGB(total),
      usedGB: bytesToGB(used),
      usedPercent: total ? +((used / total) * 100).toFixed(1) : 0,
    };
  } catch {
    return { totalGB: 0, usedGB: 0, usedPercent: 0 };
  }
}

function getCpuInfo() {
  const cpus = os.cpus();
  const load = os.loadavg();
  return {
    cores: cpus.length,
    model: cpus[0]?.model || 'unknown',
    load1: +load[0].toFixed(2),
    load5: +load[1].toFixed(2),
    load15: +load[2].toFixed(2),
    loadPercent: cpus.length ? +((load[0] / cpus.length) * 100).toFixed(1) : 0,
  };
}

const TRUNCATE_TARGETS: string[] = [
  '/root/.pm2/pm2.log',
  '/root/.pm2/logs/api-out-1.log',
  '/root/.pm2/logs/api-error-1.log',
  '/root/.pm2/logs/server-out.log',
  '/root/.pm2/logs/server-error.log',
  '/var/log/btmp',
];

const DELETE_LOG_BASENAMES = new Set([
  'api-out.log',
  'api-error.log',
  'api-out-0.log',
  'api-error-0.log',
  'btmp.1',
  'wtmp.1',
]);

function collectAppLogs(): string[] {
  const out: string[] = [];
  const root = process.cwd();
  const logsDir = path.join(root, 'logs');
  const walk = (dir: string, depth = 0) => {
    if (depth > 5) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (e.isFile() && /\.log$/i.test(e.name)) out.push(full);
    }
  };
  walk(logsDir);
  return out;
}

function collectDeletableLogs(): string[] {
  const candidates: string[] = [];
  const dirs = [
    process.cwd() + '/logs',
    '/var/log',
    '/root/.pm2/logs',
  ];
  // Patterns for rotated / orphan log files we can safely delete.
  const patterns: RegExp[] = [
    /\.log\.\d+(\.gz)?$/,                              // foo.log.1 / foo.log.1.gz
    /__\d{4}-\d{2}-\d{2}[_T]\d{2}[-:]\d{2}[-:]\d{2}\.log(\.gz)?$/, // PM2 logrotate: foo__2026-06-25_18-10-31.log[.gz]
    /\.log-\d{8,}(\.gz)?$/,                            // foo.log-20260625 / .gz
  ];
  for (const dir of dirs) {
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (!e.isFile()) continue;
      const name = e.name;
      if (
        DELETE_LOG_BASENAMES.has(name) ||
        patterns.some(re => re.test(name))
      ) {
        candidates.push(path.join(dir, name));
      }
    }
  }
  return candidates;
}

// Older files in app tmp/upload-staging dirs (>1 day) — safe to delete.
function collectStaleAppTmp(): string[] {
  const out: string[] = [];
  const root = process.cwd();
  const dirs = [
    path.join(root, 'tmp'),
    path.join(root, 'temp'),
    path.join(root, 'uploads', 'tmp'),
  ];
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
  const walk = (dir: string, depth = 0) => {
    if (depth > 4) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full, depth + 1); continue; }
      if (!e.isFile()) continue;
      try {
        const st = fs.statSync(full);
        if (st.mtimeMs < cutoffMs) out.push(full);
      } catch { /* skip */ }
    }
  };
  for (const d of dirs) walk(d);
  return out;
}

async function cleanNpmCache(): Promise<{ freedBytes: number }> {
  try {
    const before = await execFileP('du', ['-sb', '/root/.npm']);
    const beforeBytes = Number((before.stdout || '').split(/\s+/)[0]) || 0;
    await execFileP('npm', ['cache', 'clean', '--force']);
    const after = await execFileP('du', ['-sb', '/root/.npm']);
    const afterBytes = Number((after.stdout || '').split(/\s+/)[0]) || 0;
    return { freedBytes: Math.max(0, beforeBytes - afterBytes) };
  } catch {
    return { freedBytes: 0 };
  }
}

async function clearTmpFiles(): Promise<{ freedBytes: number; count: number }> {
  try {
    const { stdout: sizeOut } = await execFileP('find', [
      '/tmp', '-type', 'f', '-mtime', '+1', '-printf', '%s\n',
    ]);
    const freedBytes = sizeOut.split('\n').filter(Boolean).reduce((s, l) => s + Number(l || 0), 0);
    const count = sizeOut.split('\n').filter(Boolean).length;
    await execFileP('find', ['/tmp', '-type', 'f', '-mtime', '+1', '-delete']);
    return { freedBytes, count };
  } catch {
    return { freedBytes: 0, count: 0 };
  }
}

async function aptClean(): Promise<{ freedBytes: number }> {
  try {
    const before = await execFileP('du', ['-sb', '/var/cache/apt/archives']);
    const beforeBytes = Number((before.stdout || '').split(/\s+/)[0]) || 0;
    await execFileP('apt-get', ['clean']);
    const after = await execFileP('du', ['-sb', '/var/cache/apt/archives']);
    const afterBytes = Number((after.stdout || '').split(/\s+/)[0]) || 0;
    return { freedBytes: Math.max(0, beforeBytes - afterBytes) };
  } catch {
    return { freedBytes: 0 };
  }
}

async function getTopProcesses(): Promise<Array<{ pid: number; cpu: number; mem: number; rssMB: number; command: string }>> {
  try {
    const { stdout } = await execFileP('ps', [
      '-eo', 'pid,pcpu,pmem,rss,comm', '--sort=-pcpu', '--no-headers',
    ]);
    return stdout
      .split('\n')
      .filter(Boolean)
      .slice(0, 6)
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: Number(parts[0]),
          cpu: Number(parts[1]),
          mem: Number(parts[2]),
          rssMB: Math.round(Number(parts[3]) / 1024),
          command: parts.slice(4).join(' '),
        };
      });
  } catch {
    return [];
  }
}

function safeSize(p: string): number {
  try { return fs.statSync(p).size; } catch { return 0; }
}

function safeTruncate(p: string): { path: string; freedBytes: number; ok: boolean; error?: string } {
  const before = safeSize(p);
  try {
    fs.truncateSync(p, 0);
    return { path: p, freedBytes: before, ok: true };
  } catch (err) {
    return { path: p, freedBytes: 0, ok: false, error: (err as Error)?.message };
  }
}

const getHealth: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const [disk, swap, topProcesses] = await Promise.all([
    getDiskUsage(),
    getSwapUsage(),
    getTopProcesses(),
  ]);
  const memory = getMemoryUsage();
  const cpu = getCpuInfo();

  const truncTargets = [...TRUNCATE_TARGETS, ...collectAppLogs()];
  const delTargets = collectDeletableLogs();
  const tmpTargets = collectStaleAppTmp();
  const reclaimable =
    truncTargets.reduce((s, p) => s + safeSize(p), 0) +
    delTargets.reduce((s, p) => s + safeSize(p), 0) +
    tmpTargets.reduce((s, p) => s + safeSize(p), 0);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'System health',
    data: {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      uptimeSec: Math.round(os.uptime()),
      processUptimeSec: Math.round(process.uptime()),
      cpu,
      memory,
      swap,
      disk,
      reclaimableGB: bytesToGB(reclaimable),
      reclaimableFiles: truncTargets.length + delTargets.length + tmpTargets.length,
      topProcesses,
      timestamp: new Date().toISOString(),
    },
  });
});

const cleanup: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const truncTargets = [...TRUNCATE_TARGETS, ...collectAppLogs()];
  const truncResults = truncTargets
    .filter(p => safeSize(p) > 0)
    .map(safeTruncate);
  const truncFreed = truncResults.reduce((s, r) => s + r.freedBytes, 0);

  // Delete orphan + rotated logs (PM2 logrotate output, .log.1, .log.gz, etc.)
  const delTargets = collectDeletableLogs();
  let delFreed = 0;
  let delCount = 0;
  for (const p of delTargets) {
    const size = safeSize(p);
    try {
      fs.unlinkSync(p);
      delFreed += size;
      delCount += 1;
    } catch { /* skip */ }
  }

  // Delete stale files in app tmp/ dirs (>1d old)
  const tmpTargets = collectStaleAppTmp();
  let appTmpFreed = 0;
  let appTmpCount = 0;
  for (const p of tmpTargets) {
    const size = safeSize(p);
    try {
      fs.unlinkSync(p);
      appTmpFreed += size;
      appTmpCount += 1;
    } catch { /* skip */ }
  }

  const tmpResult = await clearTmpFiles();
  const aptResult = await aptClean();
  const npmResult = await cleanNpmCache();

  execFile('pm2', ['flush'], () => { /* ignore */ });

  const totalFreed =
    truncFreed +
    delFreed +
    appTmpFreed +
    tmpResult.freedBytes +
    aptResult.freedBytes +
    npmResult.freedBytes;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cleanup complete',
    data: {
      freedGB: bytesToGB(totalFreed),
      breakdown: {
        truncatedLogs: {
          files: truncResults.filter(r => r.ok).length,
          freedGB: bytesToGB(truncFreed),
        },
        deletedOrphans: {
          files: delCount,
          freedGB: bytesToGB(delFreed),
        },
        staleAppTmp: {
          files: appTmpCount,
          freedGB: bytesToGB(appTmpFreed),
        },
        tmpFiles: {
          files: tmpResult.count,
          freedGB: bytesToGB(tmpResult.freedBytes),
        },
        aptCache: {
          freedGB: bytesToGB(aptResult.freedBytes),
        },
        npmCache: {
          freedGB: bytesToGB(npmResult.freedBytes),
        },
      },
    },
  });
});

export const SystemController = { getHealth, cleanup };
