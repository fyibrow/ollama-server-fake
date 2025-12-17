

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { table } = require('table');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (err) {
  // Silent fail for packaged apps
}

// Setup version
const VERSION = '570.124.04';
const DRIVER_VERSION = '570.124.04';
const CUDA_VERSION = '12.8';

// List of supported GPUs
const SUPPORTED_GPUS = [
  { model: 'GeForce RTX 5090', vram: '32GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5080 Ti', vram: '24GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5080', vram: '20GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5070 Ti', vram: '16GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5070', vram: '12GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5060 Ti', vram: '8GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5060', vram: '8GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5050 Ti', vram: '6GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 5050', vram: '4GB GDDR7', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 4090', vram: '24GB GDDR6X', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 4080', vram: '16GB GDDR6X', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 4000', vram: '16GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 3090 Ti', vram: '24GB GDDR6X', manufacturer: 'NVIDIA' },
  { model: 'GeForce RTX 3090', vram: '24GB GDDR6X', manufacturer: 'NVIDIA' },
  { model: 'RTX 4090', vram: '24GB GDDR6X', manufacturer: 'NVIDIA' },
  { model: 'A10', vram: '24GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'A100-SXM4-40GB', vram: '40GB HBM2e', manufacturer: 'NVIDIA' },
  { model: 'A100 80GB PCIe', vram: '80GB HBM2e', manufacturer: 'NVIDIA' },
  { model: 'H100-SXM5-80GB', vram: '80GB PCIe', manufacturer: 'NVIDIA' },
  { model: 'H100 80GB HBM3', vram: '80GB HBM3', manufacturer: 'NVIDIA' },
  { model: 'A30', vram: '24GB HBM2', manufacturer: 'NVIDIA' },
  { model: 'A40', vram: '48GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'A4000', vram: '16GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'A5000', vram: '24GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'A6000', vram: '48GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'M60', vram: '16GB GDDR5', manufacturer: 'NVIDIA' },
  { model: 'P100', vram: '16GB HBM2', manufacturer: 'NVIDIA' },
  { model: 'P40', vram: '24GB GDDR5X', manufacturer: 'NVIDIA' },
  { model: 'Quadro GP100', vram: '16GB HBM2', manufacturer: 'NVIDIA' },
  { model: 'Quadro GV100', vram: '32GB HBM2', manufacturer: 'NVIDIA' },
  { model: 'Quadro M6000 24GB', vram: '24GB GDDR5', manufacturer: 'NVIDIA' },
  { model: 'Quadro P5000', vram: '16GB GDDR5X', manufacturer: 'NVIDIA' },
  { model: 'Quadro P6000', vram: '24GB GDDR5X', manufacturer: 'NVIDIA' },
  { model: 'Quadro RTX 5000', vram: '24GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'Quadro RTX 6000', vram: '48GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'Quadro RTX 8000', vram: '48GB GDDR6', manufacturer: 'NVIDIA' },
  { model: 'Tesla T4', vram: '16GB GDDR6', manufacturer: 'NVIDIA' },
];

// Default GPU properties
const DEFAULT_GPU = {
  index: 0,
  name: process.env.DEFAULT_GPU_NAME || 'NVIDIA GeForce RTX 4090',
  uuid: 'GPU-1234567890abcdef-1234-abcd-ef12-123456abcdef',
  temperature: 65,
  powerUsage: 394,
  powerLimit: 450,
  memoryTotal: process.env.DEFAULT_GPU_MEMORY ? parseInt(process.env.DEFAULT_GPU_MEMORY) : 24564,
  memoryUsed: 23122,
  memoryFree: 1442,
  utilizationGpu: 97,
  utilizationMemory: 88,
  fanSpeed: 77,
  pcieBusId: '00000000:01:00.0',
  pcieGeneration: 4,
  pcieWidth: 16,
  clocks: {
    graphics: 2800,
    sm: 2800,
    memory: 10752,
    video: 2700
  },
  performance: 'P0',
  computeMode: 'Default',
  driverModel: {
    current: 'WDDM',
    pending: 'WDDM'
  },
  persistenceMode: 'On'
};

// Setup function to create/update .env file with GPU settings
function setupEnvironment(selectedGpuInput) {
  try {
    const os = require('os');
    
    // Handle multiple GPUs (comma-separated) or single GPU
    const selectedGpuModels = selectedGpuInput.split(',').map(model => model.trim());
    const selectedGpus = [];
    
    // Validate all GPU models
    for (const model of selectedGpuModels) {
      const selectedGpuData = SUPPORTED_GPUS.find(gpu => gpu.model === model);
      
      if (!selectedGpuData) {
        console.error(`GPU model "${model}" not found in supported GPUs list.`);
        console.log('Available GPU models:');
        SUPPORTED_GPUS.forEach(gpu => console.log(`- ${gpu.model}`));
        return false;
      }
      
      selectedGpus.push(selectedGpuData);
    }
    
    // Create .env content
    let envContent = `# Fake NVIDIA-SMI Configuration\n`;
    
    // Add driver and CUDA versions
    envContent += `DRIVER_VERSION=${DRIVER_VERSION}\n`;
    envContent += `CUDA_VERSION=${CUDA_VERSION}\n\n`;
    
    // Add GPU count
    envContent += `GPU_COUNT=${selectedGpus.length}\n\n`;
    
    // Add configuration for each GPU
    selectedGpus.forEach((gpu, index) => {
      // Determine memory amount from VRAM string
      const memoryMatch = gpu.vram.match(/(\d+)GB/);
      const memoryGB = memoryMatch ? parseInt(memoryMatch[1]) : 24;
      const memoryMiB = memoryGB * 1024;
      
      // Generate a random UUID instead of a stable one
      const uuid = `GPU-${generateHex(8)}-${generateHex(4)}-${generateHex(4)}-${generateHex(4)}-${generateHex(12)}`;
      
      envContent += `# GPU ${index} Configuration\n`;
      envContent += `GPU${index}_NAME=${gpu.manufacturer} ${gpu.model}\n`;
      envContent += `GPU${index}_MEMORY=${memoryMiB}\n`;
      envContent += `GPU${index}_UUID=${uuid}\n\n`;
    });
    
    // Add default GPU name (for backward compatibility)
    envContent += `# Default GPU (first in the list)\n`;
    envContent += `DEFAULT_GPU_NAME=${selectedGpus[0].manufacturer} ${selectedGpus[0].model}\n`;
    envContent += `DEFAULT_GPU_MEMORY=${(() => {
      const memoryMatch = selectedGpus[0].vram.match(/(\d+)GB/);
      return (memoryMatch ? parseInt(memoryMatch[1]) : 24) * 1024;
    })()}\n`;
    
    // Write to .env file in current directory
    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log(`Setup completed successfully!`);
    console.log(`Configuration saved to: ${envPath}`);
    console.log(`\nConfigured ${selectedGpus.length} GPU${selectedGpus.length > 1 ? 's' : ''}:`);
    
    selectedGpus.forEach((gpu, index) => {
      // Read back the UUID we just generated
      const lines = envContent.split('\n');
      const uuidLine = lines.find(line => line.startsWith(`GPU${index}_UUID=`));
      const uuid = uuidLine ? uuidLine.split('=')[1] : 'Unknown';
      
      console.log(`- GPU ${index}: ${gpu.manufacturer} ${gpu.model} (${gpu.vram}) UUID: ${uuid}`);
    });
    
    return true;
  } catch (err) {
    console.error('Error during setup:', err);
    return false;
  }
}

// Function to display supported GPUs in a table
function showSupportedGpus() {
  const tableData = [
    ['GPU Model', 'VRAM', 'Manufacturer']
  ];
  
  SUPPORTED_GPUS.forEach(gpu => {
    tableData.push([gpu.model, gpu.vram, gpu.manufacturer]);
  });
  
  console.log('Supported GPUs:');
  console.log(table(tableData));
}

// Function to show stable UUIDs for all supported GPUs
function showStableUuids() {
  const tableData = [
    ['GPU Model', 'UUID']
  ];
  
  SUPPORTED_GPUS.forEach((gpu, index) => {
    const fullName = `${gpu.manufacturer} ${gpu.model}`;
    const uuid = generateStableUuid(0, fullName);
    tableData.push([fullName, uuid]);
  });
  
  console.log('Stable UUIDs for supported GPUs:');
  console.log(table(tableData));
}

// Setup logging
function logCommand(options) {
  // Skip logging if disabled
  if (options.noLog) {
    return;
  }

  try {
    // Use OS-specific temp or home directory instead of relative path
    const os = require('os');
    // Use custom log directory if specified
    const logDir = options.logDir ? 
                  options.logDir : 
                  path.join(os.homedir(), '.fake-nvidia-smi-logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (err) {
        // Silent fail - might be read-only filesystem in packaged app
        return;
      }
    }
    
    const logFile = path.join(logDir, 'command-history.log');
    const timestamp = new Date().toISOString();
    const args = process.argv.slice(2).join(' ');
    const logEntry = `[${timestamp}] nvidia-smi ${args}\n`;
    
    try {
      fs.appendFileSync(logFile, logEntry);
    } catch (err) {
      // Silent fail - packaged applications can't write to internal files
      // console.error('Error writing to log file:', err);
    }
  } catch (err) {
    // Completely silent error handling for packaged apps
  }
}

// Generate multiple GPUs
function generateGpus(count = 1) {
  // Try to read GPUs from environment first
  const envGpuCount = process.env.GPU_COUNT ? parseInt(process.env.GPU_COUNT) : null;
  
  // If we have GPUs defined in the environment, use those configurations
  if (envGpuCount) {
    return Array.from({ length: envGpuCount }).map((_, index) => {
      const gpuName = process.env[`GPU${index}_NAME`] || process.env.DEFAULT_GPU_NAME || 'NVIDIA GeForce RTX 4090';
      const gpuMemory = process.env[`GPU${index}_MEMORY`] ? parseInt(process.env[`GPU${index}_MEMORY`]) : DEFAULT_GPU.memoryTotal;
      const gpuUuid = process.env[`GPU${index}_UUID`] || generateStableUuid(index, gpuName);
      
      return {
        ...DEFAULT_GPU,
        index,
        name: gpuName,
        uuid: gpuUuid,
        memoryTotal: gpuMemory,
        temperature: Math.floor(Math.random() * 30) + 45, // 45-75°C
        powerUsage: Math.floor(Math.random() * 100) + 350, // 350-450W
        memoryUsed: Math.floor(Math.random() * (gpuMemory * 0.8)) + Math.floor(gpuMemory * 0.1), // 10-90% usage
        memoryFree: function() { return this.memoryTotal - this.memoryUsed; },
        utilizationGpu: Math.floor(Math.random() * 30) + 70, // 70-100%
        utilizationMemory: Math.floor(Math.random() * 40) + 60, // 60-100%
        fanSpeed: Math.floor(Math.random() * 30) + 60, // 60-90%
      };
    });
  }
  
  // Fallback to generating GPUs based on count (legacy behavior)
  return Array.from({ length: count }).map((_, index) => {
    const gpuName = process.env.DEFAULT_GPU_NAME || 'NVIDIA GeForce RTX 4090';
    const uuid = generateStableUuid(index, gpuName);
    
    return {
      ...DEFAULT_GPU,
      index,
      uuid,
      temperature: Math.floor(Math.random() * 30) + 45, // 45-75°C
      powerUsage: Math.floor(Math.random() * 100) + 350, // 350-450W
      memoryUsed: Math.floor(Math.random() * 10000) + 14000, // 14000-24000 MiB
      memoryFree: function() { return this.memoryTotal - this.memoryUsed; },
      utilizationGpu: Math.floor(Math.random() * 30) + 70, // 70-100%
      utilizationMemory: Math.floor(Math.random() * 40) + 60, // 60-100%
      fanSpeed: Math.floor(Math.random() * 30) + 60, // 60-90%
    };
  });
}

// Helper to generate hex strings
function generateHex(length) {
  return Array.from(
    { length }, 
    () => Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Generate a stable UUID based on GPU index and name
function generateStableUuid(index, name) {
  // Create a deterministic seed from the GPU name and index
  const seed = `${name}-${index}`;
  
  // Create a simple hash function
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  // Generate deterministic hex segments based on the hash
  const generateDeterministicHex = (str, len) => {
    const hash = hashString(str);
    let result = '';
    for (let i = 0; i < len; i++) {
      // Use different parts of the hash for each character
      const charCode = ((hash >> (i * 4)) & 0xF);
      result += charCode.toString(16);
    }
    return result;
  };
  
  // Generate parts of the UUID using the seed
  const part1 = generateDeterministicHex(`${seed}-1`, 8);
  const part2 = generateDeterministicHex(`${seed}-2`, 4);
  const part3 = generateDeterministicHex(`${seed}-3`, 4);
  const part4 = generateDeterministicHex(`${seed}-4`, 4);
  const part5 = generateDeterministicHex(`${seed}-5`, 12);
  
  return `GPU-${part1}-${part2}-${part3}-${part4}-${part5}`;
}

// Create header for output
function createHeader() {
  const now = new Date();
  const formattedDate = now.toDateString() + ' ' + now.toTimeString().split(' ')[0];
  
  return `==============NVSMI LOG==============

Timestamp                                 : ${formattedDate}
Driver Version                            : ${DRIVER_VERSION}
CUDA Version                              : ${CUDA_VERSION}

Attached GPUs                             : ${program.opts().gpuCount}
GPU 00000000:01:00.0
    Product Name                          : ${DEFAULT_GPU.name}
    Product Brand                         : GeForce
    Display Mode                          : Enabled
    Display Active                        : Disabled
    Persistence Mode                      : ${DEFAULT_GPU.persistenceMode}
    Accounting Mode                       : Disabled
    Accounting Mode Buffer Size           : 4000
    Driver Model
        Current                           : WDDM
        Pending                           : WDDM
    Serial Number                         : 0123456789ABCDEF
    GPU UUID                              : ${DEFAULT_GPU.uuid}
    Minor Number                          : 0
    VBIOS Version                         : 95.02.71.00.0D
    MultiGPU Board                        : No
    Board ID                              : 0x100
    Board Part Number                     : 132-12345-67890
    GPU Part Number                       : 1234-567-8910
    Module ID                             : 1
    Inforom Version
        Image Version                     : G001.0000.02.04
        OEM Object                        : 2.0.0
        ECC Object                        : N/A
        Power Management Object           : N/A
    GPU Operation Mode
        Current                           : N/A
        Pending                           : N/A
    GSP Firmware Version                  : N/A
    GPU Virtualization Mode
        Virtualization Mode               : None
        Host VGPU Mode                    : N/A
    IBMNPU
        Relaxed Ordering Mode             : N/A
    PCI
        Bus                               : 0x01
        Device                            : 0x00
        Domain                            : 0x0000
        Device Id                         : 0x2204
        Bus Id                            : 00000000:01:00.0
        Sub System Id                     : 0x12345678
        GPU Link Info
            PCIe Generation               : 4
            Link Width                    : 16x
            Link Speed                    : 16 GT/s
            SLS Link                      : Enabled
            SLS Link Speed                : Enabled
            SLS Link Speed Mask           : Enabled
            SLS Link Speed Shift          : Enabled
        Bridge Chip
            Type                          : N/A
            Firmware                      : N/A
        Replays Since Reset               : 0
        Replay Number Rollovers           : 0
        Tx Throughput                     : 0 KB/s
        Rx Throughput                     : 0 KB/s
        Atomic 2 Preferred                : N/A
    Fan Speed                             : ${DEFAULT_GPU.fanSpeed} %
    Performance State                     : ${DEFAULT_GPU.performance}
    Clocks Throttle Reasons
        Idle                              : Not Active
        Applications Clocks Setting       : Not Active
        SW Power Cap                      : Not Active
        HW Slowdown                       : Not Active
            HW Thermal Slowdown           : Not Active
            HW Power Brake Slowdown       : Not Active
        Sync Boost                        : Not Active
        SW Thermal Slowdown               : Not Active
        Display Clock Setting             : Not Active
    FB Memory Usage
        Total                             : ${DEFAULT_GPU.memoryTotal} MiB
        Used                              : ${DEFAULT_GPU.memoryUsed} MiB
        Free                              : ${typeof DEFAULT_GPU.memoryFree === 'function' ? DEFAULT_GPU.memoryFree() : DEFAULT_GPU.memoryFree} MiB
    BAR1 Memory Usage
        Total                             : 256 MiB
        Used                              : 5 MiB
        Free                              : 251 MiB
    Compute Mode                          : ${DEFAULT_GPU.computeMode}
    Utilization
        Gpu                               : ${DEFAULT_GPU.utilizationGpu} %
        Memory                            : ${DEFAULT_GPU.utilizationMemory} %
        Encoder                           : 0 %
        Decoder                           : 0 %
    Encoder Stats
        Active Sessions                   : 0
        Average FPS                       : 0
        Average Latency                   : 0
    FBC Stats
        Active Sessions                   : 0
        Average FPS                       : 0
        Average Latency                   : 0
    Ecc Mode
        Current                           : N/A
        Pending                           : N/A
    ECC Errors
        Volatile
            SRAM Correctable              : N/A
            SRAM Uncorrectable            : N/A
            DRAM Correctable              : N/A
            DRAM Uncorrectable            : N/A
        Aggregate
            SRAM Correctable              : N/A
            SRAM Uncorrectable            : N/A
            DRAM Correctable              : N/A
            DRAM Uncorrectable            : N/A
    Retired Pages
        Single Bit ECC                    : N/A
        Double Bit ECC                    : N/A
        Pending                           : N/A
    Temperature
        GPU Current Temp                  : ${DEFAULT_GPU.temperature} C
        GPU Shutdown Temp                 : 102 C
        GPU Slowdown Temp                 : 99 C
        GPU Max Operating Temp            : 92 C
        Memory Current Temp               : 85 C
        Memory Max Operating Temp         : 95 C
    Power Readings
        Power Management                  : Supported
        Power Draw                        : ${DEFAULT_GPU.powerUsage} W
        Power Limit                       : ${DEFAULT_GPU.powerLimit} W
        Default Power Limit               : ${DEFAULT_GPU.powerLimit} W
        Enforced Power Limit              : ${DEFAULT_GPU.powerLimit} W
        Min Power Limit                   : 100 W
        Max Power Limit                   : 450 W
    Clocks
        Graphics                          : ${DEFAULT_GPU.clocks.graphics} MHz
        SM                                : ${DEFAULT_GPU.clocks.sm} MHz
        Memory                            : ${DEFAULT_GPU.clocks.memory} MHz
        Video                             : ${DEFAULT_GPU.clocks.video} MHz
    Applications Clocks
        Graphics                          : 2800 MHz
        Memory                            : 10752 MHz
    Default Applications Clocks
        Graphics                          : 2800 MHz
        Memory                            : 10752 MHz
    Max Clocks
        Graphics                          : 2900 MHz
        SM                                : 2900 MHz
        Memory                            : 10752 MHz
        Video                             : 2800 MHz
    Max Customer Boost Clocks
        Graphics                          : 2800 MHz
    Clock Policy
        Auto Boost                        : N/A
        Auto Boost Default                : N/A
    Processes
        Process ID                        : 12345
        Type                              : C+G
        Name                              : Developer Application
        Used GPU Memory                   : 1231 MiB
`;
}

// Create standard output with GPU info and processes
function createStandardOutput(gpus) {
  const now = new Date();
  const formattedDate = now.toDateString() + ' ' + now.toTimeString().split(' ')[0];
  
  let output = `${formattedDate}       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI ${VERSION}             Driver Version: ${DRIVER_VERSION}     CUDA Version: ${CUDA_VERSION}     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
`;

  gpus.forEach(gpu => {
    const memoryFree = typeof gpu.memoryFree === 'function' ? gpu.memoryFree() : gpu.memoryFree;
    output += `|   ${gpu.index}  ${gpu.name.padEnd(20)}    ${gpu.persistenceMode}  |   ${gpu.pcieBusId} Off |                  Off |\n`;
    output += `| ${gpu.fanSpeed}%   ${gpu.temperature}C    ${gpu.performance}            ${gpu.powerUsage}W /  ${gpu.powerLimit}W |   ${gpu.memoryUsed}MiB /  ${gpu.memoryTotal}MiB |     ${gpu.utilizationGpu}%      Default |\n`;
    output += `|                                         |                        |                  N/A |\n`;
    output += `+-----------------------------------------+------------------------+----------------------+\n`;
  });

  output += `                                                                                         
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
+-----------------------------------------------------------------------------------------+`;

  return output;
}

// Create process info output
function createProcessOutput(gpus) {
  const data = [
    ['GPU', 'GI', 'CI', 'PID', 'Type', 'Process name', 'GPU Memory Usage'],
  ];

  gpus.forEach(gpu => {
    data.push([
      gpu.index,
      'N/A',
      'N/A',
      '12345',
      'G',
      'Developer Application',
      `${gpu.memoryUsed} MiB`
    ]);
  });

  return table(data);
}

// Show query output
function showQueryOutput(query, gpus, xmlFormat) {
  if (xmlFormat) {
    console.log(`\t<query_result query="${query}">`);
  }
  
  switch (query) {
    case 'count':
      if (xmlFormat) {
        console.log(`\t\t<count>${gpus.length}</count>`);
      } else {
        console.log(gpus.length);
      }
      break;
    case 'driver_version':
      if (xmlFormat) {
        console.log(`\t\t<driver_version>${DRIVER_VERSION}</driver_version>`);
      } else {
        console.log(DRIVER_VERSION);
      }
      break;
    case 'cuda_version':
      if (xmlFormat) {
        console.log(`\t\t<cuda_version>${CUDA_VERSION}</cuda_version>`);
      } else {
        console.log(CUDA_VERSION);
      }
      break;
    case 'name':
      if (xmlFormat) {
        console.log(`\t\t<gpu_names>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.name}</gpu_${index}>`));
        console.log(`\t\t</gpu_names>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.name));
      }
      break;
    case 'gpu_uuid':
      if (xmlFormat) {
        console.log(`\t\t<gpu_uuids>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.uuid}</gpu_${index}>`));
        console.log(`\t\t</gpu_uuids>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.uuid));
      }
      break;
    case 'temperature.gpu':
      if (xmlFormat) {
        console.log(`\t\t<gpu_temperatures>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.temperature}</gpu_${index}>`));
        console.log(`\t\t</gpu_temperatures>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.temperature));
      }
      break;
    case 'utilization.gpu':
      if (xmlFormat) {
        console.log(`\t\t<gpu_utilizations>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.utilizationGpu}</gpu_${index}>`));
        console.log(`\t\t</gpu_utilizations>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.utilizationGpu));
      }
      break;
    case 'utilization.memory':
      if (xmlFormat) {
        console.log(`\t\t<memory_utilizations>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.utilizationMemory}</gpu_${index}>`));
        console.log(`\t\t</memory_utilizations>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.utilizationMemory));
      }
      break;
    case 'memory.total':
      if (xmlFormat) {
        console.log(`\t\t<memory_totals>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.memoryTotal}</gpu_${index}>`));
        console.log(`\t\t</memory_totals>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.memoryTotal));
      }
      break;
    case 'memory.used':
      if (xmlFormat) {
        console.log(`\t\t<memory_used>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.memoryUsed}</gpu_${index}>`));
        console.log(`\t\t</memory_used>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.memoryUsed));
      }
      break;
    case 'memory.free':
      if (xmlFormat) {
        console.log(`\t\t<memory_free>`);
        gpus.forEach((gpu, index) => {
          const memFree = typeof gpu.memoryFree === 'function' ? gpu.memoryFree() : gpu.memoryFree;
          console.log(`\t\t\t<gpu_${index}>${memFree}</gpu_${index}>`);
        });
        console.log(`\t\t</memory_free>`);
      } else {
        gpus.forEach(gpu => {
          const memFree = typeof gpu.memoryFree === 'function' ? gpu.memoryFree() : gpu.memoryFree;
          console.log(memFree);
        });
      }
      break;
    case 'power.draw':
      if (xmlFormat) {
        console.log(`\t\t<power_draw>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.powerUsage}</gpu_${index}>`));
        console.log(`\t\t</power_draw>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.powerUsage));
      }
      break;
    case 'power.limit':
      if (xmlFormat) {
        console.log(`\t\t<power_limit>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.powerLimit}</gpu_${index}>`));
        console.log(`\t\t</power_limit>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.powerLimit));
      }
      break;
    case 'clocks.current.graphics':
      if (xmlFormat) {
        console.log(`\t\t<graphics_clocks>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.clocks.graphics}</gpu_${index}>`));
        console.log(`\t\t</graphics_clocks>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.clocks.graphics));
      }
      break;
    case 'clocks.current.memory':
      if (xmlFormat) {
        console.log(`\t\t<memory_clocks>`);
        gpus.forEach((gpu, index) => console.log(`\t\t\t<gpu_${index}>${gpu.clocks.memory}</gpu_${index}>`));
        console.log(`\t\t</memory_clocks>`);
      } else {
        gpus.forEach(gpu => console.log(gpu.clocks.memory));
      }
      break;
    default:
      if (xmlFormat) {
        console.log(`\t\t<error>Query "${query}" not supported or recognized</error>`);
      } else {
        console.log(`Query "${query}" not supported or recognized`);
      }
  }
  
  if (xmlFormat) {
    console.log(`\t</query_result>`);
  }
}

// Utility: map query field to GPU property
const FIELD_MAP = {
  'driver_version': () => DRIVER_VERSION,
  'cuda_version': () => CUDA_VERSION,
  'name': gpu => gpu.name,
  'uuid': gpu => gpu.uuid,
  'pci.bus_id': gpu => gpu.pcieBusId,
  'pci.sub_device_id': gpu => gpu.pcieSubDeviceId || 'N/A',
  'fan.speed': gpu => gpu.fanSpeed,
  'memory.total': gpu => gpu.memoryTotal,
  'memory.used': gpu => gpu.memoryUsed,
  'memory.free': gpu => typeof gpu.memoryFree === 'function' ? gpu.memoryFree() : gpu.memoryFree,
  'utilization.gpu': gpu => gpu.utilizationGpu,
  'utilization.memory': gpu => gpu.utilizationMemory,
  'temperature.gpu': gpu => gpu.temperature,
  'temperature.memory': gpu => gpu.temperatureMemory || 'N/A',
  'power.draw': gpu => gpu.powerUsage,
  'power.limit': gpu => gpu.powerLimit,
  'clocks.gr': gpu => gpu.clocks.graphics,
  'clocks.mem': gpu => gpu.clocks.memory,
};

// Utility: parse format options (csv,noheader,nounits)
function parseFormatOptions(formatStr) {
  const [format, ...opts] = formatStr.split(',');
  return {
    format: format.trim(),
    noheader: opts.includes('noheader'),
    nounits: opts.includes('nounits'),
  };
}

// Main handler for multi-field query
function handleMultiFieldQuery(query, gpus, formatStr) {
  const fields = query.split(',').map(f => f.trim());
  const formatOpts = parseFormatOptions(formatStr || 'csv');
  const rows = gpus.map(gpu => fields.map(field => {
    const fn = FIELD_MAP[field];
    if (!fn) return 'N/A';
    const val = typeof fn === 'function' ? fn(gpu) : fn;
    if (formatOpts.nounits && typeof val === 'string') {
      // Remove units if present
      return val.replace(/\s*(MiB|MB|GB|%|C|W)$/g, '');
    }
    return val;
  }));

  // Output
  if (formatOpts.format === 'csv') {
    let out = '';
    if (!formatOpts.noheader) {
      out += fields.join(',') + '\n';
    }
    out += rows.map(row => row.join(',')).join('\n');
    console.log(out);
  } else if (formatOpts.format === 'json') {
    const out = rows.map(row => Object.fromEntries(fields.map((f, i) => [f, row[i]])));
    console.log(JSON.stringify(out, null, 2));
  } else if (formatOpts.format === 'xml') {
    let out = '<?xml version="1.0" ?>\n<gpus>\n';
    rows.forEach((row, idx) => {
      out += `  <gpu index=\"${idx}\">\n`;
      fields.forEach((f, i) => {
        out += `    <${f.replace(/\./g, '_')}>${row[i]}</${f.replace(/\./g, '_')}>\n`;
      });
      out += '  </gpu>\n';
    });
    out += '</gpus>';
    console.log(out);
  } else {
    // fallback: print as table
    const tableData = [fields, ...rows];
    console.log(table(tableData));
  }
}

// Main program setup
program
  .version(VERSION)
  .option('-L, --list-gpus', 'Display a list of available GPUs')
  .option('-B, --list-excluded-gpus', 'Display a list of excluded GPUs in the system')
  .option('-q, --query', 'Display GPU or Unit info')
  .option('-x, --xml-format', 'Produce XML output')
  .option('-i, --id=<id>', 'Target a specific GPU by index')
  .option('-f, --filename=<file>', 'Log to a specified file, rather than to stdout')
  .option('-d, --display=<display>', 'Display only selected information')
  .option('-l, --loop=<seconds>', 'Probe until Ctrl+C at specified second interval')
  .option('-lms, --loop-ms=<milliseconds>', 'Probe until Ctrl+C at specified millisecond interval')
  .option('--format <format>', 'Set the output format (csv, xml, json)', 'default')
  .option('--query-gpu <query>', 'Query specific GPU information')
  .option('--query-compute-apps', 'List of currently active compute processes')
  .option('--gpu-count <count>', 'Number of fake GPUs to simulate', '1')
  .option('-a, --all', 'Display information from all available devices')
  .option('-h, --help', 'Display help message')
  .option('--uuid', 'Use GPUs UUIDs instead of indices')
  .option('-c, --compute-mode=<mode>', 'Set compute mode for the GPU')
  .option('-pm, --persistence-mode=<mode>', 'Set persistence mode for the GPU')
  .option('-p, --reset-ecc-errors=<reset>', 'Reset ECC error counts')
  .option('-t, --toggle-led=<toggle>', 'Toggle LED indicators on or off')
  .option('-r, --gpu-reset', 'Trigger reset of the GPU')
  .option('--list-processes', 'Display running compute processes')
  .option('-s, --show-topology', 'Display the topology of the system')
  .option('-u, --unit', 'Show unit, rather than GPU, attributes')
  .option('--show-logs', 'Display command history logs')
  .option('--log-dir <directory>', 'Directory to store command logs (default: ~/.fake-nvidia-smi-logs)')
  .option('--log-path', 'Display the path to the log file')
  .option('--no-log', 'Disable command logging')
  .option('--list-supported-gpus', 'Display a list of supported GPU models')
  .option('--show-stable-uuids', 'Display stable UUIDs for all supported GPU models')
  .option('--setup-gpu <model>', 'Setup fake-nvidia-smi with a specific GPU model');

program.parse(process.argv);

const options = program.opts();

// Log the command execution
logCommand(options);

// Check if listing supported GPUs
if (options.listSupportedGpus) {
  showSupportedGpus();
  return;
}

// Check if showing stable UUIDs
if (options.showStableUuids) {
  showStableUuids();
  return;
}

// Check if setting up specific GPU
if (options.setupGpu) {
  setupEnvironment(options.setupGpu);
  return;
}

// Check if showing log path
if (options.logPath) {
  try {
    const os = require('os');
    const logDir = options.logDir ? 
                 options.logDir : 
                 path.join(os.homedir(), '.fake-nvidia-smi-logs');
    const logFile = path.join(logDir, 'command-history.log');
    console.log('Log file path:', logFile);
  } catch (err) {
    console.error('Error determining log file path:', err);
  }
  return;
}

// Default action if no specific options are provided
if (process.argv.length <= 2) {
  console.log(createStandardOutput(generateGpus(parseInt(options.gpuCount))));
  return;
}

// Check if showing logs
if (options.showLogs) {
  try {
    const os = require('os');
    const logDir = options.logDir ? 
                 options.logDir : 
                 path.join(os.homedir(), '.fake-nvidia-smi-logs');
    const logFile = path.join(logDir, 'command-history.log');
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      console.log('Command History:');
      console.log('----------------');
      console.log(logs);
    } else {
      console.log('No command history logs found.');
    }
  } catch (err) {
    console.error('Error reading log file:', err);
  }
  return;
}

// Check for XML format flag
options.xmlFormat = process.argv.includes('-x') || process.argv.includes('--xml-format');

// Handle --query-gpu=value format
for (const arg of process.argv) {
  if (arg.startsWith('--query-gpu=')) {
    options.queryGpu = arg.split('=')[1];
  }
}

const gpuCount = parseInt(options.gpuCount);
const gpus = generateGpus(gpuCount);

// Handle specific command arguments
if (options.help) {
  program.outputHelp();
} else if (options.listGpus) {
  console.log(`GPU 0: ${DEFAULT_GPU.name} (UUID: ${DEFAULT_GPU.uuid})`);
} else if (options.queryGpu) {
  // Multi-field query support
  if (options.format && options.format !== 'default') {
    handleMultiFieldQuery(options.queryGpu, gpus, options.format);
  } else {
    // fallback: single field or legacy
    showQueryOutput(options.queryGpu, gpus);
  }
  return;
} else if (options.driverVersion) {
  console.log(`Driver Version: ${DRIVER_VERSION}`);
} else if (options.listProcesses) {
  console.log(createProcessOutput(gpus));
} else if (options.showTopology) {
  console.log('GPU0 <-> CPU <-> SYS');
} else if (options.query) {
  if (options.xmlFormat) {
    // Instead of simplified XML output, use the same full XML output as standalone -x
    // Handle standalone -x option
    console.log('<?xml version="1.0" ?>');
    console.log('<!DOCTYPE nvidia_smi_log SYSTEM "nvsmi_device_v12.dtd">');
    console.log('<nvidia_smi_log>');
    const now = new Date();
    const formattedDate = now.toDateString() + ' ' + now.toTimeString().split(' ')[0];
    console.log(`\t<timestamp>${formattedDate}</timestamp>`);
    console.log(`\t<driver_version>${DRIVER_VERSION}</driver_version>`);
    console.log(`\t<cuda_version>${CUDA_VERSION}</cuda_version>`);
    console.log(`\t<attached_gpus>${gpus.length}</attached_gpus>`);
    
    // Generate detailed GPU information - same as standalone -x option
    gpus.forEach(gpu => {
      const memFree = typeof gpu.memoryFree === 'function' ? gpu.memoryFree() : gpu.memoryFree;
      console.log(`\t<gpu id="${gpu.pcieBusId}">`);
      console.log(`\t\t<product_name>${gpu.name}</product_name>`);
      console.log(`\t\t<product_brand>GeForce</product_brand>`);
      console.log(`\t\t<product_architecture>Ada Lovelace</product_architecture>`);
      console.log(`\t\t<display_mode>Disabled</display_mode>`);
      console.log(`\t\t<display_active>Disabled</display_active>`);
      console.log(`\t\t<persistence_mode>Enabled</persistence_mode>`);
      console.log(`\t\t<addressing_mode>None</addressing_mode>`);
      console.log(`\t\t<mig_mode>`);
      console.log(`\t\t\t<current_mig>N/A</current_mig>`);
      console.log(`\t\t\t<pending_mig>N/A</pending_mig>`);
      console.log(`\t\t</mig_mode>`);
      console.log(`\t\t<mig_devices>\n\t\t\tNone\n\t\t</mig_devices>`);
      console.log(`\t\t<accounting_mode>Disabled</accounting_mode>`);
      console.log(`\t\t<accounting_mode_buffer_size>4000</accounting_mode_buffer_size>`);
      console.log(`\t\t<driver_model>`);
      console.log(`\t\t\t<current_dm>N/A</current_dm>`);
      console.log(`\t\t\t<pending_dm>N/A</pending_dm>`);
      console.log(`\t\t</driver_model>`);
      console.log(`\t\t<serial>N/A</serial>`);
      console.log(`\t\t<uuid>${gpu.uuid}</uuid>`);
      console.log(`\t\t<minor_number>${gpu.index}</minor_number>`);
      console.log(`\t\t<vbios_version>95.02.3C.80.B0</vbios_version>`);
      console.log(`\t\t<multigpu_board>No</multigpu_board>`);
      console.log(`\t\t<board_id>0x100</board_id>`);
      console.log(`\t\t<board_part_number>N/A</board_part_number>`);
      console.log(`\t\t<gpu_part_number>2684-301-A1</gpu_part_number>`);
      console.log(`\t\t<gpu_fru_part_number>N/A</gpu_fru_part_number>`);
      console.log(`\t\t<platformInfo>`);
      console.log(`\t\t\t<chassis_serial_number>N/A</chassis_serial_number>`);
      console.log(`\t\t\t<slot_number>N/A</slot_number>`);
      console.log(`\t\t\t<tray_index>N/A</tray_index>`);
      console.log(`\t\t\t<host_id>N/A</host_id>`);
      console.log(`\t\t\t<peer_type>N/A</peer_type>`);
      console.log(`\t\t\t<module_id>1</module_id>`);
      console.log(`\t\t\t<gpu_fabric_guid>N/A</gpu_fabric_guid>`);
      console.log(`\t\t</platformInfo>`);
      console.log(`\t\t<inforom_version>`);
      console.log(`\t\t\t<img_version>G002.0000.00.03</img_version>`);
      console.log(`\t\t\t<oem_object>2.0</oem_object>`);
      console.log(`\t\t\t<ecc_object>6.16</ecc_object>`);
      console.log(`\t\t\t<pwr_object>N/A</pwr_object>`);
      console.log(`\t\t</inforom_version>`);
      console.log(`\t\t<inforom_bbx_flush>`);
      console.log(`\t\t\t<latest_timestamp>N/A</latest_timestamp>`);
      console.log(`\t\t\t<latest_duration>N/A</latest_duration>`);
      console.log(`\t\t</inforom_bbx_flush>`);
      console.log(`\t\t<gpu_operation_mode>`);
      console.log(`\t\t\t<current_gom>N/A</current_gom>`);
      console.log(`\t\t\t<pending_gom>N/A</pending_gom>`);
      console.log(`\t\t</gpu_operation_mode>`);
      console.log(`\t\t<c2c_mode>N/A</c2c_mode>`);
      console.log(`\t\t<gpu_virtualization_mode>`);
      console.log(`\t\t\t<virtualization_mode>None</virtualization_mode>`);
      console.log(`\t\t\t<host_vgpu_mode>N/A</host_vgpu_mode>`);
      console.log(`\t\t\t<vgpu_heterogeneous_mode>N/A</vgpu_heterogeneous_mode>`);
      console.log(`\t\t</gpu_virtualization_mode>`);
      console.log(`\t\t<gpu_reset_status>`);
      console.log(`\t\t\t<reset_required>Requested functionality has been deprecated</reset_required>`);
      console.log(`\t\t\t<drain_and_reset_recommended>Requested functionality has been deprecated</drain_and_reset_recommended>`);
      console.log(`\t\t</gpu_reset_status>`);
      console.log(`\t\t<gpu_recovery_action>None</gpu_recovery_action>`);
      console.log(`\t\t<gsp_firmware_version>${DRIVER_VERSION}</gsp_firmware_version>`);
      console.log(`\t\t<ibmnpu>`);
      console.log(`\t\t\t<relaxed_ordering_mode>N/A</relaxed_ordering_mode>`);
      console.log(`\t\t</ibmnpu>`);
      console.log(`\t\t<pci>`);
      console.log(`\t\t\t<pci_bus>01</pci_bus>`);
      console.log(`\t\t\t<pci_device>00</pci_device>`);
      console.log(`\t\t\t<pci_domain>0000</pci_domain>`);
      console.log(`\t\t\t<pci_base_class>3</pci_base_class>`);
      console.log(`\t\t\t<pci_sub_class>0</pci_sub_class>`);
      console.log(`\t\t\t<pci_device_id>268410DE</pci_device_id>`);
      console.log(`\t\t\t<pci_bus_id>${gpu.pcieBusId}</pci_bus_id>`);
      console.log(`\t\t\t<pci_sub_system_id>40E51458</pci_sub_system_id>`);
      console.log(`\t\t\t<pci_gpu_link_info>`);
      console.log(`\t\t\t\t<pcie_gen>`);
      console.log(`\t\t\t\t\t<max_link_gen>${gpu.pcieGeneration}</max_link_gen>`);
      console.log(`\t\t\t\t\t<current_link_gen>${gpu.pcieGeneration}</current_link_gen>`);
      console.log(`\t\t\t\t\t<device_current_link_gen>${gpu.pcieGeneration}</device_current_link_gen>`);
      console.log(`\t\t\t\t\t<max_device_link_gen>${gpu.pcieGeneration}</max_device_link_gen>`);
      console.log(`\t\t\t\t\t<max_host_link_gen>${gpu.pcieGeneration}</max_host_link_gen>`);
      console.log(`\t\t\t\t</pcie_gen>`);
      console.log(`\t\t\t\t<link_widths>`);
      console.log(`\t\t\t\t\t<max_link_width>${gpu.pcieWidth}x</max_link_width>`);
      console.log(`\t\t\t\t\t<current_link_width>${gpu.pcieWidth}x</current_link_width>`);
      console.log(`\t\t\t\t</link_widths>`);
      console.log(`\t\t\t</pci_gpu_link_info>`);
      console.log(`\t\t\t<pci_bridge_chip>`);
      console.log(`\t\t\t\t<bridge_chip_type>N/A</bridge_chip_type>`);
      console.log(`\t\t\t\t<bridge_chip_fw>N/A</bridge_chip_fw>`);
      console.log(`\t\t\t</pci_bridge_chip>`);
      console.log(`\t\t\t<replay_counter>0</replay_counter>`);
      console.log(`\t\t\t<replay_rollover_counter>0</replay_rollover_counter>`);
      console.log(`\t\t\t<tx_util>${Math.floor(Math.random() * 10000) + 2000} KB/s</tx_util>`);
      console.log(`\t\t\t<rx_util>${Math.floor(Math.random() * 20000) + 10000} KB/s</rx_util>`);
      console.log(`\t\t\t<atomic_caps_outbound>N/A</atomic_caps_outbound>`);
      console.log(`\t\t\t<atomic_caps_inbound>N/A</atomic_caps_inbound>`);
      console.log(`\t\t</pci>`);
      console.log(`\t\t<fan_speed>${gpu.fanSpeed} %</fan_speed>`);
      console.log(`\t\t<performance_state>${gpu.performance}</performance_state>`);
      console.log(`\t\t<clocks_event_reasons>`);
      console.log(`\t\t\t<clocks_event_reason_gpu_idle>Not Active</clocks_event_reason_gpu_idle>`);
      console.log(`\t\t\t<clocks_event_reason_applications_clocks_setting>Not Active</clocks_event_reason_applications_clocks_setting>`);
      console.log(`\t\t\t<clocks_event_reason_sw_power_cap>Not Active</clocks_event_reason_sw_power_cap>`);
      console.log(`\t\t\t<clocks_event_reason_hw_slowdown>Not Active</clocks_event_reason_hw_slowdown>`);
      console.log(`\t\t\t<clocks_event_reason_hw_thermal_slowdown>Not Active</clocks_event_reason_hw_thermal_slowdown>`);
      console.log(`\t\t\t<clocks_event_reason_hw_power_brake_slowdown>Not Active</clocks_event_reason_hw_power_brake_slowdown>`);
      console.log(`\t\t\t<clocks_event_reason_sync_boost>Not Active</clocks_event_reason_sync_boost>`);
      console.log(`\t\t\t<clocks_event_reason_sw_thermal_slowdown>Not Active</clocks_event_reason_sw_thermal_slowdown>`);
      console.log(`\t\t\t<clocks_event_reason_display_clocks_setting>Not Active</clocks_event_reason_display_clocks_setting>`);
      console.log(`\t\t</clocks_event_reasons>`);
      console.log(`\t\t<sparse_operation_mode>N/A</sparse_operation_mode>`);
      console.log(`\t\t<fb_memory_usage>`);
      console.log(`\t\t\t<total>${gpu.memoryTotal} MiB</total>`);
      console.log(`\t\t\t<reserved>473 MiB</reserved>`);
      console.log(`\t\t\t<used>${gpu.memoryUsed} MiB</used>`);
      console.log(`\t\t\t<free>${memFree} MiB</free>`);
      console.log(`\t\t</fb_memory_usage>`);
      console.log(`\t\t<bar1_memory_usage>`);
      console.log(`\t\t\t<total>256 MiB</total>`);
      console.log(`\t\t\t<used>5 MiB</used>`);
      console.log(`\t\t\t<free>251 MiB</free>`);
      console.log(`\t\t</bar1_memory_usage>`);
      console.log(`\t\t<cc_protected_memory_usage>`);
      console.log(`\t\t\t<total>0 MiB</total>`);
      console.log(`\t\t\t<used>0 MiB</used>`);
      console.log(`\t\t\t<free>0 MiB</free>`);
      console.log(`\t\t</cc_protected_memory_usage>`);
      console.log(`\t\t<compute_mode>${gpu.computeMode}</compute_mode>`);
      console.log(`\t\t<utilization>`);
      console.log(`\t\t\t<gpu_util>${gpu.utilizationGpu} %</gpu_util>`);
      console.log(`\t\t\t<memory_util>${gpu.utilizationMemory} %</memory_util>`);
      console.log(`\t\t\t<encoder_util>0 %</encoder_util>`);
      console.log(`\t\t\t<decoder_util>0 %</decoder_util>`);
      console.log(`\t\t\t<jpeg_util>0 %</jpeg_util>`);
      console.log(`\t\t\t<ofa_util>0 %</ofa_util>`);
      console.log(`\t\t</utilization>`);
      console.log(`\t\t<encoder_stats>`);
      console.log(`\t\t\t<session_count>0</session_count>`);
      console.log(`\t\t\t<average_fps>0</average_fps>`);
      console.log(`\t\t\t<average_latency>0</average_latency>`);
      console.log(`\t\t</encoder_stats>`);
      console.log(`\t\t<fbc_stats>`);
      console.log(`\t\t\t<session_count>0</session_count>`);
      console.log(`\t\t\t<average_fps>0</average_fps>`);
      console.log(`\t\t\t<average_latency>0</average_latency>`);
      console.log(`\t\t</fbc_stats>`);
      console.log(`\t\t<dram_encryption_mode>`);
      console.log(`\t\t\t<current_dram_encryption>N/A</current_dram_encryption>`);
      console.log(`\t\t\t<pending_dram_encryption>N/A</pending_dram_encryption>`);
      console.log(`\t\t</dram_encryption_mode>`);
      console.log(`\t\t<ecc_mode>`);
      console.log(`\t\t\t<current_ecc>Disabled</current_ecc>`);
      console.log(`\t\t\t<pending_ecc>Disabled</pending_ecc>`);
      console.log(`\t\t</ecc_mode>`);
      console.log(`\t\t<ecc_errors>`);
      console.log(`\t\t\t<volatile>`);
      console.log(`\t\t\t\t<sram_correctable>N/A</sram_correctable>`);
      console.log(`\t\t\t\t<sram_uncorrectable_parity>N/A</sram_uncorrectable_parity>`);
      console.log(`\t\t\t\t<sram_uncorrectable_secded>N/A</sram_uncorrectable_secded>`);
      console.log(`\t\t\t\t<dram_correctable>N/A</dram_correctable>`);
      console.log(`\t\t\t\t<dram_uncorrectable>N/A</dram_uncorrectable>`);
      console.log(`\t\t\t</volatile>`);
      console.log(`\t\t\t<aggregate>`);
      console.log(`\t\t\t\t<sram_correctable>N/A</sram_correctable>`);
      console.log(`\t\t\t\t<sram_uncorrectable_parity>N/A</sram_uncorrectable_parity>`);
      console.log(`\t\t\t\t<sram_uncorrectable_secded>N/A</sram_uncorrectable_secded>`);
      console.log(`\t\t\t\t<dram_correctable>N/A</dram_correctable>`);
      console.log(`\t\t\t\t<dram_uncorrectable>N/A</dram_uncorrectable>`);
      console.log(`\t\t\t\t<sram_threshold_exceeded>N/A</sram_threshold_exceeded>`);
      console.log(`\t\t\t</aggregate>`);
      console.log(`\t\t\t<aggregate_uncorrectable_sram_sources>`);
      console.log(`\t\t\t\t<sram_l2>N/A</sram_l2>`);
      console.log(`\t\t\t\t<sram_sm>N/A</sram_sm>`);
      console.log(`\t\t\t\t<sram_microcontroller>N/A</sram_microcontroller>`);
      console.log(`\t\t\t\t<sram_pcie>N/A</sram_pcie>`);
      console.log(`\t\t\t\t<sram_other>N/A</sram_other>`);
      console.log(`\t\t\t</aggregate_uncorrectable_sram_sources>`);
      console.log(`\t\t</ecc_errors>`);
      console.log(`\t\t<retired_pages>`);
      console.log(`\t\t\t<multiple_single_bit_retirement>`);
      console.log(`\t\t\t\t<retired_count>N/A</retired_count>`);
      console.log(`\t\t\t\t<retired_pagelist>N/A</retired_pagelist>`);
      console.log(`\t\t\t</multiple_single_bit_retirement>`);
      console.log(`\t\t\t<double_bit_retirement>`);
      console.log(`\t\t\t\t<retired_count>N/A</retired_count>`);
      console.log(`\t\t\t\t<retired_pagelist>N/A</retired_pagelist>`);
      console.log(`\t\t\t</double_bit_retirement>`);
      console.log(`\t\t\t<pending_blacklist>N/A</pending_blacklist>`);
      console.log(`\t\t\t<pending_retirement>N/A</pending_retirement>`);
      console.log(`\t\t</retired_pages>`);
      console.log(`\t\t<remapped_rows>`);
      console.log(`\t\t\t<remapped_row_corr>0</remapped_row_corr>`);
      console.log(`\t\t\t<remapped_row_unc>0</remapped_row_unc>`);
      console.log(`\t\t\t<remapped_row_pending>No</remapped_row_pending>`);
      console.log(`\t\t\t<remapped_row_failure>No</remapped_row_failure>`);
      console.log(`\t\t\t<row_remapper_histogram>`);
      console.log(`\t\t\t\t<row_remapper_histogram_max>192 bank(s)</row_remapper_histogram_max>`);
      console.log(`\t\t\t\t<row_remapper_histogram_high>0 bank(s)</row_remapper_histogram_high>`);
      console.log(`\t\t\t\t<row_remapper_histogram_partial>0 bank(s)</row_remapper_histogram_partial>`);
      console.log(`\t\t\t\t<row_remapper_histogram_low>0 bank(s)</row_remapper_histogram_low>`);
      console.log(`\t\t\t\t<row_remapper_histogram_none>0 bank(s)</row_remapper_histogram_none>`);
      console.log(`\t\t\t</row_remapper_histogram>`);
      console.log(`\t\t</remapped_rows>`);
      console.log(`\t\t<temperature>`);
      console.log(`\t\t\t<gpu_temp>${gpu.temperature} C</gpu_temp>`);
      console.log(`\t\t\t<gpu_temp_tlimit>20 C</gpu_temp_tlimit>`);
      console.log(`\t\t\t<gpu_temp_max_tlimit_threshold>-7 C</gpu_temp_max_tlimit_threshold>`);
      console.log(`\t\t\t<gpu_temp_slow_tlimit_threshold>-2 C</gpu_temp_slow_tlimit_threshold>`);
      console.log(`\t\t\t<gpu_temp_max_gpu_tlimit_threshold>0 C</gpu_temp_max_gpu_tlimit_threshold>`);
      console.log(`\t\t\t<gpu_target_temperature>84 C</gpu_target_temperature>`);
      console.log(`\t\t\t<memory_temp>N/A</memory_temp>`);
      console.log(`\t\t\t<gpu_temp_max_mem_tlimit_threshold>N/A</gpu_temp_max_mem_tlimit_threshold>`);
      console.log(`\t\t</temperature>`);
      console.log(`\t\t<supported_gpu_target_temp>`);
      console.log(`\t\t\t<gpu_target_temp_min>65 C</gpu_target_temp_min>`);
      console.log(`\t\t\t<gpu_target_temp_max>88 C</gpu_target_temp_max>`);
      console.log(`\t\t</supported_gpu_target_temp>`);
      console.log(`\t\t<gpu_power_readings>`);
      console.log(`\t\t\t<power_state>${gpu.performance}</power_state>`);
      console.log(`\t\t\t<average_power_draw>${gpu.powerUsage}.${Math.floor(Math.random() * 100)} W</average_power_draw>`);
      console.log(`\t\t\t<instant_power_draw>${gpu.powerUsage + Math.floor(Math.random() * 20) - 10}.${Math.floor(Math.random() * 100)} W</instant_power_draw>`);
      console.log(`\t\t\t<current_power_limit>${gpu.powerLimit}.00 W</current_power_limit>`);
      console.log(`\t\t\t<requested_power_limit>${gpu.powerLimit}.00 W</requested_power_limit>`);
      console.log(`\t\t\t<default_power_limit>${gpu.powerLimit}.00 W</default_power_limit>`);
      console.log(`\t\t\t<min_power_limit>150.00 W</min_power_limit>`);
      console.log(`\t\t\t<max_power_limit>600.00 W</max_power_limit>`);
      console.log(`\t\t</gpu_power_readings>`);
      console.log(`\t\t<gpu_memory_power_readings>`);
      console.log(`\t\t\t<average_power_draw>N/A</average_power_draw>`);
      console.log(`\t\t\t<instant_power_draw>N/A</instant_power_draw>`);
      console.log(`\t\t</gpu_memory_power_readings>`);
      console.log(`\t\t<module_power_readings>`);
      console.log(`\t\t\t<power_state>${gpu.performance}</power_state>`);
      console.log(`\t\t\t<average_power_draw>N/A</average_power_draw>`);
      console.log(`\t\t\t<instant_power_draw>N/A</instant_power_draw>`);
      console.log(`\t\t\t<current_power_limit>N/A</current_power_limit>`);
      console.log(`\t\t\t<requested_power_limit>N/A</requested_power_limit>`);
      console.log(`\t\t\t<default_power_limit>N/A</default_power_limit>`);
      console.log(`\t\t\t<min_power_limit>N/A</min_power_limit>`);
      console.log(`\t\t\t<max_power_limit>N/A</max_power_limit>`);
      console.log(`\t\t</module_power_readings>`);
      console.log(`\t\t<power_smoothing>N/A</power_smoothing>`);
      console.log(`\t\t<power_profiles>`);
      console.log(`\t\t\t<power_profile_requested_profiles>N/A</power_profile_requested_profiles>`);
      console.log(`\t\t\t<power_profile_enforced_profiles>N/A</power_profile_enforced_profiles>`);
      console.log(`\t\t</power_profiles>`);
      console.log(`\t\t<clocks>`);
      console.log(`\t\t\t<graphics_clock>${gpu.clocks.graphics} MHz</graphics_clock>`);
      console.log(`\t\t\t<sm_clock>${gpu.clocks.sm} MHz</sm_clock>`);
      console.log(`\t\t\t<mem_clock>${gpu.clocks.memory} MHz</mem_clock>`);
      console.log(`\t\t\t<video_clock>${gpu.clocks.video} MHz</video_clock>`);
      console.log(`\t\t</clocks>`);
      console.log(`\t\t<applications_clocks>`);
      console.log(`\t\t\t<graphics_clock>N/A</graphics_clock>`);
      console.log(`\t\t\t<mem_clock>N/A</mem_clock>`);
      console.log(`\t\t</applications_clocks>`);
      console.log(`\t\t<default_applications_clocks>`);
      console.log(`\t\t\t<graphics_clock>N/A</graphics_clock>`);
      console.log(`\t\t\t<mem_clock>N/A</mem_clock>`);
      console.log(`\t\t</default_applications_clocks>`);
      console.log(`\t\t<deferred_clocks>`);
      console.log(`\t\t\t<mem_clock>N/A</mem_clock>`);
      console.log(`\t\t</deferred_clocks>`);
      console.log(`\t\t<max_clocks>`);
      console.log(`\t\t\t<graphics_clock>3120 MHz</graphics_clock>`);
      console.log(`\t\t\t<sm_clock>3120 MHz</sm_clock>`);
      console.log(`\t\t\t<mem_clock>10501 MHz</mem_clock>`);
      console.log(`\t\t\t<video_clock>2415 MHz</video_clock>`);
      console.log(`\t\t</max_clocks>`);
      console.log(`\t\t<max_customer_boost_clocks>`);
      console.log(`\t\t\t<graphics_clock>N/A</graphics_clock>`);
      console.log(`\t\t</max_customer_boost_clocks>`);
      console.log(`\t\t<clock_policy>`);
      console.log(`\t\t\t<auto_boost>N/A</auto_boost>`);
      console.log(`\t\t\t<auto_boost_default>N/A</auto_boost_default>`);
      console.log(`\t\t</clock_policy>`);
      console.log(`\t\t<voltage>`);
      console.log(`\t\t\t<graphics_volt>N/A</graphics_volt>`);
      console.log(`\t\t</voltage>`);
      console.log(`\t\t<fabric>`);
      console.log(`\t\t\t<state>N/A</state>`);
      console.log(`\t\t\t<status>N/A</status>`);
      console.log(`\t\t\t<cliqueId>N/A</cliqueId>`);
      console.log(`\t\t\t<clusterUuid>N/A</clusterUuid>`);
      console.log(`\t\t\t<health>`);
      console.log(`\t\t\t\t<bandwidth>N/A</bandwidth>`);
      console.log(`\t\t\t\t<route_recovery_in_progress>N/A</route_recovery_in_progress>`);
      console.log(`\t\t\t\t<route_unhealthy>N/A</route_unhealthy>`);
      console.log(`\t\t\t\t<access_timeout_recovery>N/A</access_timeout_recovery>`);
      console.log(`\t\t\t</health>`);
      console.log(`\t\t</fabric>`);
      
      // Add supported clocks section
      console.log(`\t\t<supported_clocks>`);
      // Add the first two memory clock entries to keep it manageable
      console.log(`\t\t\t<supported_mem_clock>`);
      console.log(`\t\t\t\t<value>10501 MHz</value>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3120 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3105 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3090 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3075 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3060 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t</supported_mem_clock>`);
      console.log(`\t\t\t<supported_mem_clock>`);
      console.log(`\t\t\t\t<value>10251 MHz</value>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3120 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3105 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3090 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3075 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3060 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t</supported_mem_clock>`);
      console.log(`\t\t\t<supported_mem_clock>`);
      console.log(`\t\t\t\t<value>5001 MHz</value>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3120 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3105 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3090 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3075 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t\t<supported_graphics_clock>3060 MHz</supported_graphics_clock>`);
      console.log(`\t\t\t</supported_mem_clock>`);
      console.log(`\t\t</supported_clocks>`);
      
      // Add processes section
      console.log(`\t\t<processes>`);
      // Add a sample process if memory usage is high
      if (gpu.memoryUsed > gpu.memoryTotal * 0.5) {
        console.log(`\t\t\t<process_info>`);
        console.log(`\t\t\t\t<gpu_instance_id>N/A</gpu_instance_id>`);
        console.log(`\t\t\t\t<compute_instance_id>N/A</compute_instance_id>`);
        console.log(`\t\t\t\t<pid>${Math.floor(Math.random() * 1000000) + 3000000}</pid>`);
        console.log(`\t\t\t\t<type>C</type>`);
        console.log(`\t\t\t\t<process_name></process_name>`);
        console.log(`\t\t\t\t<used_memory>${Math.floor(gpu.memoryUsed * 0.95)} MiB</used_memory>`);
        console.log(`\t\t\t</process_info>`);
      }
      console.log(`\t\t</processes>`);
      console.log(`\t\t<accounted_processes>`);
      console.log(`\t\t</accounted_processes>`);
      console.log(`\t\t<capabilities>`);
      console.log(`\t\t\t<egm>disabled</egm>`);
      console.log(`\t\t</capabilities>`);
      console.log(`\t</gpu>`);
    });
    
    console.log(`</nvidia_smi_log>`);
  } else {
    // If query is just boolean true, show all info
    if (options.query === true) {
      console.log(createHeader());
    } else {
      console.log(`Query: ${options.query}`);
      showQueryOutput(options.query, gpus);
    }
  }
} else if (options.display) {
  console.log(`GPU ${DEFAULT_GPU.index}: ${DEFAULT_GPU.name}`);
  console.log('  Display Devices:');
  console.log('    None');
} else if (options.xmlFormat) {
  // Handle standalone -x option
  console.log('<?xml version="1.0" ?>');
  console.log('<!DOCTYPE nvidia_smi_log SYSTEM "nvsmi_device_v12.dtd">');
  console.log('<nvidia_smi_log>');
  const now = new Date();
  const formattedDate = now.toDateString() + ' ' + now.toTimeString().split(' ')[0];
  console.log(`\t<timestamp>${formattedDate}</timestamp>`);
  console.log(`\t<driver_version>${DRIVER_VERSION}</driver_version>`);
  console.log(`\t<cuda_version>${CUDA_VERSION}</cuda_version>`);
  console.log(`\t<attached_gpus>${gpus.length}</attached_gpus>`);
  
  // Generate detailed GPU information
  gpus.forEach(gpu => {
    const memFree = typeof gpu.memoryFree === 'function' ? gpu.memoryFree() : gpu.memoryFree;
    console.log(`\t<gpu id="${gpu.pcieBusId}">`);
    console.log(`\t\t<product_name>${gpu.name}</product_name>`);
    console.log(`\t\t<product_brand>GeForce</product_brand>`);
    console.log(`\t\t<product_architecture>Ada Lovelace</product_architecture>`);
    console.log(`\t\t<display_mode>Disabled</display_mode>`);
    console.log(`\t\t<display_active>Disabled</display_active>`);
    console.log(`\t\t<persistence_mode>Enabled</persistence_mode>`);
    console.log(`\t\t<addressing_mode>None</addressing_mode>`);
    console.log(`\t\t<mig_mode>`);
    console.log(`\t\t\t<current_mig>N/A</current_mig>`);
    console.log(`\t\t\t<pending_mig>N/A</pending_mig>`);
    console.log(`\t\t</mig_mode>`);
    console.log(`\t\t<mig_devices>\n\t\t\tNone\n\t\t</mig_devices>`);
    console.log(`\t\t<accounting_mode>Disabled</accounting_mode>`);
    console.log(`\t\t<accounting_mode_buffer_size>4000</accounting_mode_buffer_size>`);
    console.log(`\t\t<driver_model>`);
    console.log(`\t\t\t<current_dm>N/A</current_dm>`);
    console.log(`\t\t\t<pending_dm>N/A</pending_dm>`);
    console.log(`\t\t</driver_model>`);
    console.log(`\t\t<serial>N/A</serial>`);
    console.log(`\t\t<uuid>${gpu.uuid}</uuid>`);
    console.log(`\t\t<minor_number>${gpu.index}</minor_number>`);
    console.log(`\t\t<vbios_version>95.02.3C.80.B0</vbios_version>`);
    console.log(`\t\t<multigpu_board>No</multigpu_board>`);
    console.log(`\t\t<board_id>0x100</board_id>`);
    console.log(`\t\t<board_part_number>N/A</board_part_number>`);
    console.log(`\t\t<gpu_part_number>2684-301-A1</gpu_part_number>`);
    console.log(`\t\t<gpu_fru_part_number>N/A</gpu_fru_part_number>`);
    console.log(`\t\t<platformInfo>`);
    console.log(`\t\t\t<chassis_serial_number>N/A</chassis_serial_number>`);
    console.log(`\t\t\t<slot_number>N/A</slot_number>`);
    console.log(`\t\t\t<tray_index>N/A</tray_index>`);
    console.log(`\t\t\t<host_id>N/A</host_id>`);
    console.log(`\t\t\t<peer_type>N/A</peer_type>`);
    console.log(`\t\t\t<module_id>1</module_id>`);
    console.log(`\t\t\t<gpu_fabric_guid>N/A</gpu_fabric_guid>`);
    console.log(`\t\t</platformInfo>`);
    console.log(`\t\t<inforom_version>`);
    console.log(`\t\t\t<img_version>G002.0000.00.03</img_version>`);
    console.log(`\t\t\t<oem_object>2.0</oem_object>`);
    console.log(`\t\t\t<ecc_object>6.16</ecc_object>`);
    console.log(`\t\t\t<pwr_object>N/A</pwr_object>`);
    console.log(`\t\t</inforom_version>`);
    console.log(`\t\t<inforom_bbx_flush>`);
    console.log(`\t\t\t<latest_timestamp>N/A</latest_timestamp>`);
    console.log(`\t\t\t<latest_duration>N/A</latest_duration>`);
    console.log(`\t\t</inforom_bbx_flush>`);
    console.log(`\t\t<gpu_operation_mode>`);
    console.log(`\t\t\t<current_gom>N/A</current_gom>`);
    console.log(`\t\t\t<pending_gom>N/A</pending_gom>`);
    console.log(`\t\t</gpu_operation_mode>`);
    console.log(`\t\t<c2c_mode>N/A</c2c_mode>`);
    console.log(`\t\t<gpu_virtualization_mode>`);
    console.log(`\t\t\t<virtualization_mode>None</virtualization_mode>`);
    console.log(`\t\t\t<host_vgpu_mode>N/A</host_vgpu_mode>`);
    console.log(`\t\t\t<vgpu_heterogeneous_mode>N/A</vgpu_heterogeneous_mode>`);
    console.log(`\t\t</gpu_virtualization_mode>`);
    console.log(`\t\t<gpu_reset_status>`);
    console.log(`\t\t\t<reset_required>Requested functionality has been deprecated</reset_required>`);
    console.log(`\t\t\t<drain_and_reset_recommended>Requested functionality has been deprecated</drain_and_reset_recommended>`);
    console.log(`\t\t</gpu_reset_status>`);
    console.log(`\t\t<gpu_recovery_action>None</gpu_recovery_action>`);
    console.log(`\t\t<gsp_firmware_version>${DRIVER_VERSION}</gsp_firmware_version>`);
    console.log(`\t\t<ibmnpu>`);
    console.log(`\t\t\t<relaxed_ordering_mode>N/A</relaxed_ordering_mode>`);
    console.log(`\t\t</ibmnpu>`);
    console.log(`\t\t<pci>`);
    console.log(`\t\t\t<pci_bus>01</pci_bus>`);
    console.log(`\t\t\t<pci_device>00</pci_device>`);
    console.log(`\t\t\t<pci_domain>0000</pci_domain>`);
    console.log(`\t\t\t<pci_base_class>3</pci_base_class>`);
    console.log(`\t\t\t<pci_sub_class>0</pci_sub_class>`);
    console.log(`\t\t\t<pci_device_id>268410DE</pci_device_id>`);
    console.log(`\t\t\t<pci_bus_id>${gpu.pcieBusId}</pci_bus_id>`);
    console.log(`\t\t\t<pci_sub_system_id>40E51458</pci_sub_system_id>`);
    console.log(`\t\t\t<pci_gpu_link_info>`);
    console.log(`\t\t\t\t<pcie_gen>`);
    console.log(`\t\t\t\t\t<max_link_gen>${gpu.pcieGeneration}</max_link_gen>`);
    console.log(`\t\t\t\t\t<current_link_gen>${gpu.pcieGeneration}</current_link_gen>`);
    console.log(`\t\t\t\t\t<device_current_link_gen>${gpu.pcieGeneration}</device_current_link_gen>`);
    console.log(`\t\t\t\t\t<max_device_link_gen>${gpu.pcieGeneration}</max_device_link_gen>`);
    console.log(`\t\t\t\t\t<max_host_link_gen>${gpu.pcieGeneration}</max_host_link_gen>`);
    console.log(`\t\t\t\t</pcie_gen>`);
    console.log(`\t\t\t\t<link_widths>`);
    console.log(`\t\t\t\t\t<max_link_width>${gpu.pcieWidth}x</max_link_width>`);
    console.log(`\t\t\t\t\t<current_link_width>${gpu.pcieWidth}x</current_link_width>`);
    console.log(`\t\t\t\t</link_widths>`);
    console.log(`\t\t\t</pci_gpu_link_info>`);
    console.log(`\t\t\t<pci_bridge_chip>`);
    console.log(`\t\t\t\t<bridge_chip_type>N/A</bridge_chip_type>`);
    console.log(`\t\t\t\t<bridge_chip_fw>N/A</bridge_chip_fw>`);
    console.log(`\t\t\t</pci_bridge_chip>`);
    console.log(`\t\t\t<replay_counter>0</replay_counter>`);
    console.log(`\t\t\t<replay_rollover_counter>0</replay_rollover_counter>`);
    console.log(`\t\t\t<tx_util>${Math.floor(Math.random() * 10000) + 2000} KB/s</tx_util>`);
    console.log(`\t\t\t<rx_util>${Math.floor(Math.random() * 20000) + 10000} KB/s</rx_util>`);
    console.log(`\t\t\t<atomic_caps_outbound>N/A</atomic_caps_outbound>`);
    console.log(`\t\t\t<atomic_caps_inbound>N/A</atomic_caps_inbound>`);
    console.log(`\t\t</pci>`);
    console.log(`\t\t<fan_speed>${gpu.fanSpeed} %</fan_speed>`);
    console.log(`\t\t<performance_state>${gpu.performance}</performance_state>`);
    console.log(`\t\t<clocks_event_reasons>`);
    console.log(`\t\t\t<clocks_event_reason_gpu_idle>Not Active</clocks_event_reason_gpu_idle>`);
    console.log(`\t\t\t<clocks_event_reason_applications_clocks_setting>Not Active</clocks_event_reason_applications_clocks_setting>`);
    console.log(`\t\t\t<clocks_event_reason_sw_power_cap>Not Active</clocks_event_reason_sw_power_cap>`);
    console.log(`\t\t\t<clocks_event_reason_hw_slowdown>Not Active</clocks_event_reason_hw_slowdown>`);
    console.log(`\t\t\t<clocks_event_reason_hw_thermal_slowdown>Not Active</clocks_event_reason_hw_thermal_slowdown>`);
    console.log(`\t\t\t<clocks_event_reason_hw_power_brake_slowdown>Not Active</clocks_event_reason_hw_power_brake_slowdown>`);
    console.log(`\t\t\t<clocks_event_reason_sync_boost>Not Active</clocks_event_reason_sync_boost>`);
    console.log(`\t\t\t<clocks_event_reason_sw_thermal_slowdown>Not Active</clocks_event_reason_sw_thermal_slowdown>`);
    console.log(`\t\t\t<clocks_event_reason_display_clocks_setting>Not Active</clocks_event_reason_display_clocks_setting>`);
    console.log(`\t\t</clocks_event_reasons>`);
    console.log(`\t\t<sparse_operation_mode>N/A</sparse_operation_mode>`);
    console.log(`\t\t<fb_memory_usage>`);
    console.log(`\t\t\t<total>${gpu.memoryTotal} MiB</total>`);
    console.log(`\t\t\t<reserved>473 MiB</reserved>`);
    console.log(`\t\t\t<used>${gpu.memoryUsed} MiB</used>`);
    console.log(`\t\t\t<free>${memFree} MiB</free>`);
    console.log(`\t\t</fb_memory_usage>`);
    console.log(`\t\t<bar1_memory_usage>`);
    console.log(`\t\t\t<total>256 MiB</total>`);
    console.log(`\t\t\t<used>5 MiB</used>`);
    console.log(`\t\t\t<free>251 MiB</free>`);
    console.log(`\t\t</bar1_memory_usage>`);
    console.log(`\t\t<cc_protected_memory_usage>`);
    console.log(`\t\t\t<total>0 MiB</total>`);
    console.log(`\t\t\t<used>0 MiB</used>`);
    console.log(`\t\t\t<free>0 MiB</free>`);
    console.log(`\t\t</cc_protected_memory_usage>`);
    console.log(`\t\t<compute_mode>${gpu.computeMode}</compute_mode>`);
    console.log(`\t\t<utilization>`);
    console.log(`\t\t\t<gpu_util>${gpu.utilizationGpu} %</gpu_util>`);
    console.log(`\t\t\t<memory_util>${gpu.utilizationMemory} %</memory_util>`);
    console.log(`\t\t\t<encoder_util>0 %</encoder_util>`);
    console.log(`\t\t\t<decoder_util>0 %</decoder_util>`);
    console.log(`\t\t\t<jpeg_util>0 %</jpeg_util>`);
    console.log(`\t\t\t<ofa_util>0 %</ofa_util>`);
    console.log(`\t\t</utilization>`);
    console.log(`\t\t<encoder_stats>`);
    console.log(`\t\t\t<session_count>0</session_count>`);
    console.log(`\t\t\t<average_fps>0</average_fps>`);
    console.log(`\t\t\t<average_latency>0</average_latency>`);
    console.log(`\t\t</encoder_stats>`);
    console.log(`\t\t<fbc_stats>`);
    console.log(`\t\t\t<session_count>0</session_count>`);
    console.log(`\t\t\t<average_fps>0</average_fps>`);
    console.log(`\t\t\t<average_latency>0</average_latency>`);
    console.log(`\t\t</fbc_stats>`);
    console.log(`\t\t<dram_encryption_mode>`);
    console.log(`\t\t\t<current_dram_encryption>N/A</current_dram_encryption>`);
    console.log(`\t\t\t<pending_dram_encryption>N/A</pending_dram_encryption>`);
    console.log(`\t\t</dram_encryption_mode>`);
    console.log(`\t\t<ecc_mode>`);
    console.log(`\t\t\t<current_ecc>Disabled</current_ecc>`);
    console.log(`\t\t\t<pending_ecc>Disabled</pending_ecc>`);
    console.log(`\t\t</ecc_mode>`);
    console.log(`\t\t<ecc_errors>`);
    console.log(`\t\t\t<volatile>`);
    console.log(`\t\t\t\t<sram_correctable>N/A</sram_correctable>`);
    console.log(`\t\t\t\t<sram_uncorrectable_parity>N/A</sram_uncorrectable_parity>`);
    console.log(`\t\t\t\t<sram_uncorrectable_secded>N/A</sram_uncorrectable_secded>`);
    console.log(`\t\t\t\t<dram_correctable>N/A</dram_correctable>`);
    console.log(`\t\t\t\t<dram_uncorrectable>N/A</dram_uncorrectable>`);
    console.log(`\t\t\t</volatile>`);
    console.log(`\t\t\t<aggregate>`);
    console.log(`\t\t\t\t<sram_correctable>N/A</sram_correctable>`);
    console.log(`\t\t\t\t<sram_uncorrectable_parity>N/A</sram_uncorrectable_parity>`);
    console.log(`\t\t\t\t<sram_uncorrectable_secded>N/A</sram_uncorrectable_secded>`);
    console.log(`\t\t\t\t<dram_correctable>N/A</dram_correctable>`);
    console.log(`\t\t\t\t<dram_uncorrectable>N/A</dram_uncorrectable>`);
    console.log(`\t\t\t\t<sram_threshold_exceeded>N/A</sram_threshold_exceeded>`);
    console.log(`\t\t\t</aggregate>`);
    console.log(`\t\t\t<aggregate_uncorrectable_sram_sources>`);
    console.log(`\t\t\t\t<sram_l2>N/A</sram_l2>`);
    console.log(`\t\t\t\t<sram_sm>N/A</sram_sm>`);
    console.log(`\t\t\t\t<sram_microcontroller>N/A</sram_microcontroller>`);
    console.log(`\t\t\t\t<sram_pcie>N/A</sram_pcie>`);
    console.log(`\t\t\t\t<sram_other>N/A</sram_other>`);
    console.log(`\t\t\t</aggregate_uncorrectable_sram_sources>`);
    console.log(`\t\t</ecc_errors>`);
    console.log(`\t\t<retired_pages>`);
    console.log(`\t\t\t<multiple_single_bit_retirement>`);
    console.log(`\t\t\t\t<retired_count>N/A</retired_count>`);
    console.log(`\t\t\t\t<retired_pagelist>N/A</retired_pagelist>`);
    console.log(`\t\t\t</multiple_single_bit_retirement>`);
    console.log(`\t\t\t<double_bit_retirement>`);
    console.log(`\t\t\t\t<retired_count>N/A</retired_count>`);
    console.log(`\t\t\t\t<retired_pagelist>N/A</retired_pagelist>`);
    console.log(`\t\t\t</double_bit_retirement>`);
    console.log(`\t\t\t<pending_blacklist>N/A</pending_blacklist>`);
    console.log(`\t\t\t<pending_retirement>N/A</pending_retirement>`);
    console.log(`\t\t</retired_pages>`);
    console.log(`\t\t<remapped_rows>`);
    console.log(`\t\t\t<remapped_row_corr>0</remapped_row_corr>`);
    console.log(`\t\t\t<remapped_row_unc>0</remapped_row_unc>`);
    console.log(`\t\t\t<remapped_row_pending>No</remapped_row_pending>`);
    console.log(`\t\t\t<remapped_row_failure>No</remapped_row_failure>`);
    console.log(`\t\t\t<row_remapper_histogram>`);
    console.log(`\t\t\t\t<row_remapper_histogram_max>192 bank(s)</row_remapper_histogram_max>`);
    console.log(`\t\t\t\t<row_remapper_histogram_high>0 bank(s)</row_remapper_histogram_high>`);
    console.log(`\t\t\t\t<row_remapper_histogram_partial>0 bank(s)</row_remapper_histogram_partial>`);
    console.log(`\t\t\t\t<row_remapper_histogram_low>0 bank(s)</row_remapper_histogram_low>`);
    console.log(`\t\t\t\t<row_remapper_histogram_none>0 bank(s)</row_remapper_histogram_none>`);
    console.log(`\t\t\t</row_remapper_histogram>`);
    console.log(`\t\t</remapped_rows>`);
    console.log(`\t\t<temperature>`);
    console.log(`\t\t\t<gpu_temp>${gpu.temperature} C</gpu_temp>`);
    console.log(`\t\t\t<gpu_temp_tlimit>20 C</gpu_temp_tlimit>`);
    console.log(`\t\t\t<gpu_temp_max_tlimit_threshold>-7 C</gpu_temp_max_tlimit_threshold>`);
    console.log(`\t\t\t<gpu_temp_slow_tlimit_threshold>-2 C</gpu_temp_slow_tlimit_threshold>`);
    console.log(`\t\t\t<gpu_temp_max_gpu_tlimit_threshold>0 C</gpu_temp_max_gpu_tlimit_threshold>`);
    console.log(`\t\t\t<gpu_target_temperature>84 C</gpu_target_temperature>`);
    console.log(`\t\t\t<memory_temp>N/A</memory_temp>`);
    console.log(`\t\t\t<gpu_temp_max_mem_tlimit_threshold>N/A</gpu_temp_max_mem_tlimit_threshold>`);
    console.log(`\t\t</temperature>`);
    console.log(`\t\t<supported_gpu_target_temp>`);
    console.log(`\t\t\t<gpu_target_temp_min>65 C</gpu_target_temp_min>`);
    console.log(`\t\t\t<gpu_target_temp_max>88 C</gpu_target_temp_max>`);
    console.log(`\t\t</supported_gpu_target_temp>`);
    console.log(`\t\t<gpu_power_readings>`);
    console.log(`\t\t\t<power_state>${gpu.performance}</power_state>`);
    console.log(`\t\t\t<average_power_draw>${gpu.powerUsage}.${Math.floor(Math.random() * 100)} W</average_power_draw>`);
    console.log(`\t\t\t<instant_power_draw>${gpu.powerUsage + Math.floor(Math.random() * 20) - 10}.${Math.floor(Math.random() * 100)} W</instant_power_draw>`);
    console.log(`\t\t\t<current_power_limit>${gpu.powerLimit}.00 W</current_power_limit>`);
    console.log(`\t\t\t<requested_power_limit>${gpu.powerLimit}.00 W</requested_power_limit>`);
    console.log(`\t\t\t<default_power_limit>${gpu.powerLimit}.00 W</default_power_limit>`);
    console.log(`\t\t\t<min_power_limit>150.00 W</min_power_limit>`);
    console.log(`\t\t\t<max_power_limit>600.00 W</max_power_limit>`);
    console.log(`\t\t</gpu_power_readings>`);
    console.log(`\t\t<gpu_memory_power_readings>`);
    console.log(`\t\t\t<average_power_draw>N/A</average_power_draw>`);
    console.log(`\t\t\t<instant_power_draw>N/A</instant_power_draw>`);
    console.log(`\t\t</gpu_memory_power_readings>`);
    console.log(`\t\t<module_power_readings>`);
    console.log(`\t\t\t<power_state>${gpu.performance}</power_state>`);
    console.log(`\t\t\t<average_power_draw>N/A</average_power_draw>`);
    console.log(`\t\t\t<instant_power_draw>N/A</instant_power_draw>`);
    console.log(`\t\t\t<current_power_limit>N/A</current_power_limit>`);
    console.log(`\t\t\t<requested_power_limit>N/A</requested_power_limit>`);
    console.log(`\t\t\t<default_power_limit>N/A</default_power_limit>`);
    console.log(`\t\t\t<min_power_limit>N/A</min_power_limit>`);
    console.log(`\t\t\t<max_power_limit>N/A</max_power_limit>`);
    console.log(`\t\t</module_power_readings>`);
    console.log(`\t\t<power_smoothing>N/A</power_smoothing>`);
    console.log(`\t\t<power_profiles>`);
    console.log(`\t\t\t<power_profile_requested_profiles>N/A</power_profile_requested_profiles>`);
    console.log(`\t\t\t<power_profile_enforced_profiles>N/A</power_profile_enforced_profiles>`);
    console.log(`\t\t</power_profiles>`);
    console.log(`\t\t<clocks>`);
    console.log(`\t\t\t<graphics_clock>${gpu.clocks.graphics} MHz</graphics_clock>`);
    console.log(`\t\t\t<sm_clock>${gpu.clocks.sm} MHz</sm_clock>`);
    console.log(`\t\t\t<mem_clock>${gpu.clocks.memory} MHz</mem_clock>`);
    console.log(`\t\t\t<video_clock>${gpu.clocks.video} MHz</video_clock>`);
    console.log(`\t\t</clocks>`);
    console.log(`\t\t<applications_clocks>`);
    console.log(`\t\t\t<graphics_clock>N/A</graphics_clock>`);
    console.log(`\t\t\t<mem_clock>N/A</mem_clock>`);
    console.log(`\t\t</applications_clocks>`);
    console.log(`\t\t<default_applications_clocks>`);
    console.log(`\t\t\t<graphics_clock>N/A</graphics_clock>`);
    console.log(`\t\t\t<mem_clock>N/A</mem_clock>`);
    console.log(`\t\t</default_applications_clocks>`);
    console.log(`\t\t<deferred_clocks>`);
    console.log(`\t\t\t<mem_clock>N/A</mem_clock>`);
    console.log(`\t\t</deferred_clocks>`);
    console.log(`\t\t<max_clocks>`);
    console.log(`\t\t\t<graphics_clock>3120 MHz</graphics_clock>`);
    console.log(`\t\t\t<sm_clock>3120 MHz</sm_clock>`);
    console.log(`\t\t\t<mem_clock>10501 MHz</mem_clock>`);
    console.log(`\t\t\t<video_clock>2415 MHz</video_clock>`);
    console.log(`\t\t</max_clocks>`);
    console.log(`\t\t<max_customer_boost_clocks>`);
    console.log(`\t\t\t<graphics_clock>N/A</graphics_clock>`);
    console.log(`\t\t</max_customer_boost_clocks>`);
    console.log(`\t\t<clock_policy>`);
    console.log(`\t\t\t<auto_boost>N/A</auto_boost>`);
    console.log(`\t\t\t<auto_boost_default>N/A</auto_boost_default>`);
    console.log(`\t\t</clock_policy>`);
    console.log(`\t\t<voltage>`);
    console.log(`\t\t\t<graphics_volt>N/A</graphics_volt>`);
    console.log(`\t\t</voltage>`);
    console.log(`\t\t<fabric>`);
    console.log(`\t\t\t<state>N/A</state>`);
    console.log(`\t\t\t<status>N/A</status>`);
    console.log(`\t\t\t<cliqueId>N/A</cliqueId>`);
    console.log(`\t\t\t<clusterUuid>N/A</clusterUuid>`);
    console.log(`\t\t\t<health>`);
    console.log(`\t\t\t\t<bandwidth>N/A</bandwidth>`);
    console.log(`\t\t\t\t<route_recovery_in_progress>N/A</route_recovery_in_progress>`);
    console.log(`\t\t\t\t<route_unhealthy>N/A</route_unhealthy>`);
    console.log(`\t\t\t\t<access_timeout_recovery>N/A</access_timeout_recovery>`);
    console.log(`\t\t\t</health>`);
    console.log(`\t\t</fabric>`);
    
    // Add supported clocks section
    console.log(`\t\t<supported_clocks>`);
    // Add the first two memory clock entries to keep it manageable
    console.log(`\t\t\t<supported_mem_clock>`);
    console.log(`\t\t\t\t<value>10501 MHz</value>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3120 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3105 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3090 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3075 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3060 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t</supported_mem_clock>`);
    console.log(`\t\t\t<supported_mem_clock>`);
    console.log(`\t\t\t\t<value>10251 MHz</value>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3120 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3105 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3090 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3075 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3060 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t</supported_mem_clock>`);
    console.log(`\t\t\t<supported_mem_clock>`);
    console.log(`\t\t\t\t<value>5001 MHz</value>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3120 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3105 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3090 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3075 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t\t<supported_graphics_clock>3060 MHz</supported_graphics_clock>`);
    console.log(`\t\t\t</supported_mem_clock>`);
    console.log(`\t\t</supported_clocks>`);
    
    // Add processes section
    console.log(`\t\t<processes>`);
    // Add a sample process if memory usage is high
    if (gpu.memoryUsed > gpu.memoryTotal * 0.5) {
      console.log(`\t\t\t<process_info>`);
      console.log(`\t\t\t\t<gpu_instance_id>N/A</gpu_instance_id>`);
      console.log(`\t\t\t\t<compute_instance_id>N/A</compute_instance_id>`);
      console.log(`\t\t\t\t<pid>${Math.floor(Math.random() * 1000000) + 3000000}</pid>`);
      console.log(`\t\t\t\t<type>C</type>`);
      console.log(`\t\t\t\t<process_name></process_name>`);
      console.log(`\t\t\t\t<used_memory>${Math.floor(gpu.memoryUsed * 0.95)} MiB</used_memory>`);
      console.log(`\t\t\t</process_info>`);
    }
    console.log(`\t\t</processes>`);
    console.log(`\t\t<accounted_processes>`);
    console.log(`\t\t</accounted_processes>`);
    console.log(`\t\t<capabilities>`);
    console.log(`\t\t\t<egm>disabled</egm>`);
    console.log(`\t\t</capabilities>`);
    console.log(`\t</gpu>`);
  });
  
  console.log(`</nvidia_smi_log>`);
} else {
  // Default output format
  console.log(createStandardOutput(gpus));
}