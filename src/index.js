// Preload axios first thing
try {
  // This will ensure that axios is preloaded properly
  global.axios = require('./utils/axiosWrapper');
} catch (e) {
  console.error('Failed to preload axios:', e);
}

// Check for --version argument
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('Vikey Inference v1.0.0');
  process.exit(0);
}

const { 
  PORT, 
  LLAMAEDGE_ENABLED, 
  GAIA_CONFIG_PATH,
  VIKEY_API_KEY,
  VIKEY_API_URL
} = require('./config/config');
/**
 * Penjelasan kenapa ini tidak works di executable linux jika menggunakan pkg:
 * 
 * Saat menggunakan pkg untuk membuat executable, environment variable dan cara file diakses bisa berbeda.
 * - process.env.FAKE_GPU_ENABLED tetap bisa diakses, tapi file system (fs) dan __dirname bisa berubah.
 * - Jika Anda ingin mendeteksi environment di dalam binary pkg, pastikan variabel environment sudah di-set sebelum menjalankan binary.
 * - Juga, VIKEY_API_URL harus sudah di-bundle atau di-set dengan benar di config.
 * 
 * Seringkali, masalahnya adalah environment variable tidak diteruskan ke binary, atau path config tidak ditemukan.
 * 
 * Untuk memastikan ALLOWED_NVIDIA bisa digunakan di semua environment (termasuk pkg), gunakan function agar bisa dites dan di-extend.
 */

function isNvidiaAllowed() {
  // Cek URL API
  if (VIKEY_API_URL === 'https://api.hyperbolic.xyz/v1') {
    return true;
  }
  // Cek environment variable
  if (process.env.FAKE_GPU_ENABLED) {
    return true;
  }
  return false;
}

let ALLOWED_NVIDIA = isNvidiaAllowed();

if (process.argv.length > 2 && process.argv[2] === 'nvidia-smi') {
  if (!ALLOWED_NVIDIA) {
    return process.exit(0);
  }

  require('./nvidia-smi');
  process.exit(0);
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const os = require('os');
const { exec, spawn } = require('child_process');

// Path to nvidia-smi script on Linux
const NVIDIA_SMI_PATH = '/usr/local/bin/nvidia-smi';

// Function to check and generate nvidia-smi script on Linux
function checkAndSetupNvidiaSmi() {
  return new Promise((resolve) => {
    // Only check on Linux systems
    if (os.platform() !== 'linux') {
      // console.log('Not running on Linux, skipping nvidia-smi script setup');
      return resolve(false);
    }
    
    if (!ALLOWED_NVIDIA) {
      return resolve(false);
    }

    // console.log('Checking for nvidia-smi script...');
    
    // Check if nvidia-smi already exists
    fs.access(NVIDIA_SMI_PATH, fs.constants.F_OK, (err) => {
      if (err) {
        // Script doesn't exist, generate it
        // console.log('nvidia-smi not found, generating script...');
        
        // Get the path of the current binary
        const binaryPath = process.pkg ? process.execPath : path.resolve(__dirname, '../package.json');
        const binDir = path.dirname(binaryPath);
        const binName = path.basename(binaryPath);
        
        // Create the script content
        const scriptContent = `#!/bin/bash
# Generated nvidia-smi script by Vikey Inference
${binDir}/${binName} nvidia-smi "$@"
`;

        try {
          // Write the script file
          fs.writeFileSync(NVIDIA_SMI_PATH, scriptContent, { mode: 0o755 });
          // console.log(`nvidia-smi script generated at ${NVIDIA_SMI_PATH}`);
          resolve(true);
        } catch (error) {
          // console.error('Failed to create nvidia-smi script:', error);
          resolve(false);
        }
      } else {
        // console.log('nvidia-smi script already exists');
        resolve(false);
      }
    });
  });
}

// Function to clean up nvidia-smi script on exit
function cleanupNvidiaSmi() {
  if (os.platform() === 'linux') {
    try {
      // Check if the file exists and was created by us
      if (fs.existsSync(NVIDIA_SMI_PATH)) {
        const content = fs.readFileSync(NVIDIA_SMI_PATH, 'utf8');
        if (content.includes('Generated nvidia-smi script by Vikey Inference')) {
          fs.unlinkSync(NVIDIA_SMI_PATH);
          // console.log('Removed generated nvidia-smi script');
        }
      }
    } catch (error) {
      // console.error('Failed to remove nvidia-smi script:', error);
    }
  }
}

// Set up cleanup handlers
process.on('exit', cleanupNvidiaSmi);
process.on('SIGINT', () => {
  console.log('Received SIGINT, cleaning up...');
  cleanupNvidiaSmi();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, cleaning up...');
  cleanupNvidiaSmi();
  process.exit(0);
});

// Check if API key is provided
function checkApiKey() {
  // Skip check if not in binary mode
  if (!process.pkg) return Promise.resolve(true);
  
  if (VIKEY_API_KEY && VIKEY_API_KEY !== 'your_default_api_key_here') {
    return Promise.resolve(true);
  }

  console.log('\n========================================');
  console.log('VIKEY_API_KEY is not set in your .env file');
  console.log('You need to provide a valid API key to continue');
  console.log('Visit https://vikey.ai to sign up and get your API key');
  console.log('========================================\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Please enter your VIKEY_API_KEY: ', (answer) => {
      rl.close();
      
      if (answer && answer.trim()) {
        // Save to .env file
        try {
          const envPath = path.join(process.pkg ? path.dirname(process.execPath) : process.cwd(), '.env');
          let envContent = '';
          
          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            
            // Replace existing API key or add new one
            if (envContent.includes('VIKEY_API_KEY=')) {
              envContent = envContent.replace(
                /VIKEY_API_KEY=.*/,
                `VIKEY_API_KEY=${answer.trim()}`
              );
            } else {
              envContent += `\nVIKEY_API_KEY=${answer.trim()}`;
            }
          } else {
            envContent = `VIKEY_API_KEY=${answer.trim()}`;
          }
          
          fs.writeFileSync(envPath, envContent);
          console.log('\nAPI key saved to .env file');
          
          // Set environment variable for current session
          process.env.VIKEY_API_KEY = answer.trim();
          
          resolve(true);
        } catch (error) {
          console.error('Error saving API key:', error);
          console.log('Continuing with provided key for this session only');
          process.env.VIKEY_API_KEY = answer.trim();
          resolve(true);
        }
      } else {
        console.log('\nInvalid API key. Exiting...');
        process.exit(1);
      }
    });
  });
}

// Import controllers
const ollamaController = require('./controllers/ollamaController');
const openaiController = require('./controllers/openaiController');

// Create Express app
const app = express();

// CORS middleware
app.use(cors());

// Raw body middleware for requests with no content-type
app.use((req, res, next) => {
  if (!req.headers['content-type']) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      // console.log('Raw data with no content-type:', data);
      try {
        req.body = JSON.parse(data);
        // console.log('Successfully parsed as JSON:', req.body);
      } catch (e) {
        req.body = data;
        // console.log('Could not parse as JSON, treating as plain text');
      }
      next();
    });
  } else {
    next();
  }
});

// Parse various content types
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.text({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
      console.log('────────────────────────────────────');
      console.log(`${req.method} ${req.url}`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
      // Don't log large bodies like embeddings
      if (req.url.includes('embed')) {
        console.log('Body: [embedding request - body not logged]');
      } else {
        // Try to stringify the body
        try {
          console.log('Body:', JSON.stringify(req.body, null, 2));
        } catch (e) {
          console.log('Body: [unable to stringify]');
          console.log('Body type:', typeof req.body);
        }
      }

      next();
  });
}

// Get config directory path
const getConfigDir = () => {
  if (process.pkg) {
    return path.resolve(path.dirname(process.execPath), GAIA_CONFIG_PATH);
  }
  return path.resolve(__dirname, 'gaia');
};

if (LLAMAEDGE_ENABLED) {
  app.get('/config_pub.json', (req, res) => {
    const configDir = getConfigDir();
    const configPath = path.join(configDir, 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.address = req.headers.host.split('.')[0];
        return res.json(config);
      } catch (error) {
        console.error('Error reading config.json:', error);
      }
    }
    
    res.status(404).json({ error: 'Config not found' });
  });
  
  app.get('/v1/info', (req, res) => {
    const configDir = getConfigDir();
    const infoPath = path.join(configDir, 'info.json');
    
    if (fs.existsSync(infoPath)) {
      try {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        return res.json(info);
      } catch (error) {
        console.error('Error reading info.json:', error);
      }
    }
    
    res.status(404).json({ error: 'Info not found' });
  });
}

// Ollama API routes
app.get('/api/tags', ollamaController.getModels);
app.post('/api/chat', ollamaController.chat);
app.post('/api/generate', ollamaController.generate);
app.post('/api/embeddings', ollamaController.embeddings);
app.post('/api/embed', ollamaController.embed);
app.get("/", (req, res) => {
  res.status(200).send('Ollama is running');
});

// OpenAI compatibility routes
app.post('/v1/chat/completions', openaiController.chatCompletions);
app.post('/v1/completions', openaiController.completions);
app.get('/v1/models', openaiController.listModels);
app.get('/v1/models/:model', openaiController.getModel);
app.post('/v1/embeddings', openaiController.embeddings);
app.post('/v1/embed', openaiController.embed);

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: '0.1.0' });
});

// Fallback for unhandled routes
app.use((req, res) => {
  console.log('Endpoint not supported', req.url);
  res.status(404).json({ error: 'Endpoint not supported' });
});



// Check API key, set up nvidia-smi (on Linux), and start server
Promise.all([
  checkApiKey(),
  checkAndSetupNvidiaSmi()
]).then(() => {
  if (!ALLOWED_NVIDIA) {
    return process.exit(0);
  }

  app.listen(PORT, () => {
    console.log(`Ollama proxy server running on http://localhost:${PORT}`);
    if (LLAMAEDGE_ENABLED) {
      console.log(`LlamaEdge mode enabled, using config from: ${getConfigDir()}`);
    }
  });
});