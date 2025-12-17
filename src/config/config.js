const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
dotenv.config();

// Get executable directory
const getExeDir = () => {
  return process.pkg ? path.dirname(process.execPath) : process.cwd();
};

// Configuration constants
const PORT = process.env.NODE_PORT || 11434;
const VIKEY_API_URL = process.env.VIKEY_API_URL || 'https://api.vikey.ai/v1';
const VIKEY_API_KEY = process.env.VIKEY_API_KEY || 'your_default_api_key_here';
const GAIA_API_URL = process.env.EMBEDDING_API_URL || 'https://qwen7b.gaia.domains/v1';
const GAIA_API_KEY = process.env.EMBEDDING_API_KEY || 'your_default_api_key_here';
const LLAMAEDGE_ENABLED = process.env.LLAMAEDGE_ENABLED === 'true';
const GAIA_CONFIG_PATH = process.env.GAIA_CONFIG_PATH || './config';

// Default models
const DEFAULT_MODELS = [
  'deepseek-r1:1.5b',
  'deepseek-r1:7b',
  'deepseek-r1:8b',
  'deepseek-r1:14b',
  'qwen2.5:7b-instruct-fp16',
  'llama3.1:8b-instruct-q4_K_M',
  'llama3.3:70b-instruct-fp16',
  'llama3.3:70b-instruct-q8_0',
  'hellord/mxbai-embed-large-v1:f16',
  'all-minilm' // Add all-minilm explicitly to supported models
];

// Load models from external JSON if exists
function loadSupportedModels() {
  const exePath = getExeDir();
  const modelsPath = path.join(exePath, 'models.json');
  
  try {
    if (fs.existsSync(modelsPath)) {
      const customModels = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
      return [...new Set([...DEFAULT_MODELS, ...customModels])];
    }
  } catch (error) {
    console.warn('Error loading custom models:', error);
  }
  
  return DEFAULT_MODELS;
}

// Check and setup config directory
function setupConfigDirectory() {
  if (!LLAMAEDGE_ENABLED) return;

  const exePath = getExeDir();
  const configDir = path.resolve(exePath, GAIA_CONFIG_PATH);
  const sourceConfigDir = path.join(__dirname, '..', 'gaia');

  try {
    // Make sure config directory exists
    if (!fs.existsSync(configDir)) {
      console.log(`Creating config directory at: ${configDir}`);
      fs.mkdirSync(configDir, { recursive: true });
      
      // Copy default config files if source exists
      if (fs.existsSync(sourceConfigDir)) {
        console.log(`Copying default config files from ${sourceConfigDir} to ${configDir}`);
        
        // Copy files from source to destination
        const files = fs.readdirSync(sourceConfigDir);
        for (const file of files) {
          const srcPath = path.join(sourceConfigDir, file);
          const destPath = path.join(configDir, file);
          
          // Skip if it's a directory and just copy the file
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error setting up config directory:', error);
  }
}

// Map Ollama model names to Intelligence.io model names for embeddings
const EMBEDDING_MODEL_MAP = {
  'hellord/mxbai-embed-large-v1:f16': 'mixedbread-ai/mxbai-embed-large-v1',
  'all-minilm': 'nomic-embed', // Default fallback for Ollama's minilm
  'all-mini': 'nomic-embed', // Handle truncated name
  'default': 'text-embedding-3-small' // Default fallback
};

// Load models and setup
const SUPPORTED_MODELS = loadSupportedModels();
setupConfigDirectory();

module.exports = {
  PORT,
  VIKEY_API_URL,
  VIKEY_API_KEY,
  GAIA_API_URL,
  GAIA_API_KEY,
  SUPPORTED_MODELS,
  EMBEDDING_MODEL_MAP,
  LLAMAEDGE_ENABLED,
  GAIA_CONFIG_PATH
}; 