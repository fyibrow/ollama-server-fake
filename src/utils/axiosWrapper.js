/**
 * Axios wrapper to fix pkg bundling issues
 */
let axios;

try {
  // Try to load axios from the standard path
  axios = require('axios');
} catch (e) {
  try {
    // Try the absolute path (for pkg environment)
    const path = require('path');
    const fs = require('fs');
    
    // Get the executable directory
    const exeDir = process.pkg ? path.dirname(process.execPath) : process.cwd();
    
    // Try different potential locations
    const potentialPaths = [
      path.join(exeDir, 'node_modules', 'axios', 'index.js'),
      path.join(exeDir, 'node_modules', 'axios', 'dist', 'axios.js'),
      path.join(exeDir, 'node_modules', 'axios', 'lib', 'axios.js')
    ];
    
    let axiosPath = null;
    for (const p of potentialPaths) {
      if (fs.existsSync(p)) {
        axiosPath = p;
        break;
      }
    }
    
    if (axiosPath) {
      axios = require(axiosPath);
    } else {
      // Fallback to require with absolute path to node_modules
      axios = require(path.join(exeDir, 'node_modules', 'axios'));
    }
  } catch (error) {
    console.error('Failed to load axios:', error);
    throw new Error('Could not load axios module. Please make sure it is installed.');
  }
}

module.exports = axios; 