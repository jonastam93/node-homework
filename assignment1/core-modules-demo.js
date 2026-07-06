const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

async function runDemo() {
  try {
// OS module
    console.log('Platform:', os.platform());
    console.log('CPU:', os.cpus()[0].model);
    console.log('Total Memory:', os.totalmem());


// Path module
    const joinedPath = path.join(
      __dirname,
      'sample-files',
      'folder',
      'file.txt'
    );
    console.log('Joined path:', joinedPath);
// fs.promises API
    const demoFile = path.join(sampleFilesDir, 'demo.txt');
    // Write the File
    await fs.promises.writeFile(demoFile, 'Hello from fs.promises!');
    // Read the File
    const content = await fs.promises.readFile(demoFile, 'utf8');
    console.log('fs.promises read:', content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runDemo();

// Streams for large files- log first 40 chars of each chunk
