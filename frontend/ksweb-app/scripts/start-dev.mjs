import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const inlineImages = spawn(process.execPath, [path.join(__dirname, 'static-inlineimages.mjs')], {
  stdio: 'inherit',
});

const angular = spawn(npmCommand, ['run', 'start:app'], {
  stdio: 'inherit',
});

function stopAll(exitCode = 0) {
  inlineImages.kill();
  angular.kill();
  process.exit(exitCode);
}

inlineImages.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    angular.kill();
    process.exit(code);
  }
});

angular.on('exit', (code) => {
  inlineImages.kill();
  process.exit(code ?? 0);
});

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
