const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Support CRM System dev servers...');

const runOptions = {
  stdio: 'inherit',
  shell: true
};

// Spawn backend
const backend = spawn('npm', ['start'], {
  ...runOptions,
  cwd: path.resolve(__dirname, 'backend')
});

// Spawn frontend
const frontend = spawn('npm', ['run', 'dev'], {
  ...runOptions,
  cwd: path.resolve(__dirname, 'frontend')
});

// Clean up processes on exit
const cleanup = () => {
  console.log('\nStopping servers...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
