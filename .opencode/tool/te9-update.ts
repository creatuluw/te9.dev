import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const LOG_DIR = 'te9.dev/logs';
const CHECK_FILE = `${LOG_DIR}/.te9-last-update-check`;
const LOCAL_COMMIT_FILE = `${LOG_DIR}/.te9-local-commit`;

function getLastCheck(): Date | null {
  if (!existsSync(CHECK_FILE)) return null;
  try {
    const data = readFileSync(CHECK_FILE, 'utf8').trim();
    return new Date(data);
  } catch {
    return null;
  }
}

function setLastCheck(date: Date = new Date()) {
  writeFileSync(CHECK_FILE, date.toISOString());
}

function shouldCheck(): boolean {
  const last = getLastCheck();
  if (!last) return true;
  const now = new Date();
  const diff = now.getTime() - last.getTime();
  return diff > 24 * 60 * 60 * 1000;
}

async function getLatestCommit(): Promise<string> {
  const response = await fetch('https://api.github.com/repos/creatuluw/te9.dev/commits/main');
  if (!response.ok) throw new Error('Failed to fetch latest commit');
  const data = await response.json();
  return data.sha;
}

function getLocalCommit(): string | null {
  if (!existsSync(LOCAL_COMMIT_FILE)) return null;
  return readFileSync(LOCAL_COMMIT_FILE, 'utf8').trim();
}

function setLocalCommit(commit: string) {
  writeFileSync(LOCAL_COMMIT_FILE, commit);
}

async function checkForUpdates(): Promise<boolean> {
  const latest = await getLatestCommit();
  const local = getLocalCommit();
  if (!local || local !== latest) {
    setLocalCommit(latest);
    return true;
  }
  return false;
}

function performUpdate() {
  execSync('curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update', { stdio: 'inherit' });
}

export { shouldCheck, checkForUpdates, performUpdate, setLastCheck };
