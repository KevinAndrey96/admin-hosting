#!/usr/bin/env node

// Passenger-compatible startup script for Next.js standalone
const path = require('path');
const fs = require('fs');

const scriptDir = __dirname;
const envFiles = [
  path.join(scriptDir, '.env.production.local'),
  path.join(scriptDir, '.env.local'),
  path.join(scriptDir, '.env.production'),
  path.join(scriptDir, '.env'),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    console.log(`Loading environment variables from: ${envFile}`);
    require('dotenv').config({ path: envFile });
    break;
  }
}

// Debug mode - set DEBUG=true in environment variables to enable
// Always enable debug in production to help diagnose issues
const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development' || true;

if (DEBUG) {
  console.log('=== Next.js Startup Debug ===');
  console.log('Current directory:', __dirname);
  console.log('Working directory:', process.cwd());
  console.log('Node version:', process.version);
  console.log('NODE_ENV:', process.env.NODE_ENV);
}

// Change to the script directory
process.chdir(scriptDir);

if (DEBUG) {
  console.log('Changed to directory:', process.cwd());
}

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Always use port 3001 so the .htaccess proxy (127.0.0.1:3001) works.
// If you need a different port, set PORT in cPanel environment variables.
process.env.PORT = process.env.PORT || '3001';

if (DEBUG) {
  console.log('PORT:', process.env.PORT);
  console.log('');
}

// Verify required files exist
const serverPath = path.join(scriptDir, '.next', 'standalone', 'server.js');
const staticPath = path.join(scriptDir, '.next', 'standalone', '.next', 'static');
const publicPath = path.join(scriptDir, '.next', 'standalone', 'public');

if (DEBUG) {
  console.log('Checking files...');
  console.log('  server.js:', fs.existsSync(serverPath) ? '✓' : '✗');
  console.log('  .next/static:', fs.existsSync(staticPath) ? '✓' : '✗');
  console.log('  public:', fs.existsSync(publicPath) ? '✓' : '✗');
  console.log('');
}

if (!fs.existsSync(serverPath)) {
  console.error('Error: .next/standalone/server.js not found');
  console.error('Path checked:', serverPath);
  console.error('Make sure you ran "npm run build" before deploying');
  if (DEBUG) {
    console.error('');
    console.error('Directory structure:');
    try {
      const nextDir = path.join(scriptDir, '.next');
      if (fs.existsSync(nextDir)) {
        console.error('  .next/ exists');
        const standaloneDir = path.join(nextDir, 'standalone');
        if (fs.existsSync(standaloneDir)) {
          console.error('  .next/standalone/ exists');
          const files = fs.readdirSync(standaloneDir);
          console.error('  Files in standalone:', files.join(', '));
        } else {
          console.error('  .next/standalone/ NOT FOUND');
        }
      } else {
        console.error('  .next/ NOT FOUND');
      }
    } catch (e) {
      console.error('  Error reading directory:', e.message);
    }
  }
  process.exit(1);
}

if (!fs.existsSync(staticPath)) {
  console.error('Error: .next/static not found');
  console.error('Path checked:', staticPath);
  console.error('Make sure you ran "npm run build" before deploying');
  process.exit(1);
}

if (!fs.existsSync(publicPath)) {
  console.error('Warning: public/ directory not found');
}

// Set Next.js specific environment variables
process.env.NEXT_RUNTIME = 'nodejs';

if (DEBUG) {
  console.log('Loading server from:', serverPath);
  console.log('');
}

// Load and run the Next.js standalone server directly
try {
  if (DEBUG) {
    console.log('Requiring server.js...');
    console.log('Server path:', serverPath);
    console.log('Current working directory:', process.cwd());
    console.log('Node version:', process.version);
    console.log('Environment variables:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  PORT:', process.env.PORT);
    console.log('  NEXT_RUNTIME:', process.env.NEXT_RUNTIME);
    console.log('');
  }
  
  // Verify server.js exists and is readable
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Server file not found: ${serverPath}`);
  }
  
  const stats = fs.statSync(serverPath);
  if (DEBUG) {
    console.log('Server file stats:', {
      size: stats.size,
      mode: stats.mode.toString(8),
      isFile: stats.isFile()
    });
    console.log('');
  }
  
  require(serverPath);
  
  if (DEBUG) {
    console.log('Server loaded successfully!');
    console.log('Server should be listening on port:', process.env.PORT || 'default');
  }
} catch (error) {
  console.error('Error starting Next.js server:');
  console.error('  Message:', error.message);
  console.error('  Code:', error.code);
  console.error('  Stack:', error.stack);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('');
    console.error('Module not found. This usually means:');
    console.error('  1. Dependencies are missing');
    console.error('  2. node_modules is not in .next/standalone/');
    console.error('  3. Build was incomplete');
    console.error('');
    console.error('Try running "npm run build" locally and re-uploading.');
    
    // Try to list what's in standalone
    try {
      const standaloneDir = path.join(scriptDir, '.next', 'standalone');
      if (fs.existsSync(standaloneDir)) {
        const files = fs.readdirSync(standaloneDir);
        console.error('Files in .next/standalone:', files.join(', '));
        
        const nodeModulesPath = path.join(standaloneDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          console.error('node_modules exists in standalone');
        } else {
          console.error('node_modules NOT FOUND in standalone');
        }
      }
    } catch (e) {
      console.error('Error listing standalone directory:', e.message);
    }
  }
  
  // Don't exit immediately - let Passenger see the error
  setTimeout(() => process.exit(1), 1000);
}
