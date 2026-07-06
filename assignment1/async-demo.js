const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
const folderPath = path.join(__dirname, 'sample-files');
const filePath = path.join(folderPath, 'sample.txt');
const fileContent = 'Hello, async world!';

// Create folder and file programmatically
fs.mkdirSync(folderPath, { recursive: true });
fs.writeFileSync(filePath, fileContent);

// 1. Callback style
fs.readFile(filePath, 'utf8', (error, data) => {
  if (error) {
    console.error('Callback error:', error.message);
    return;
  }

  console.log('Callback read:', data);
});


  // Callback hell example (test and leave it in comments):
/*fs.readFile("file1.txt", "utf8", (error, data1) => {
  if (error) return console.error(error);

  fs.readFile("file2.txt", "utf8", (error, data2) => {
    if (error) return console.error(error);

    fs.readFile("file3.txt", "utf8", (error, data3) => {
      if (error) return console.error(error);

      console.log(data1, data2, data3);
    });
  });
});*/

  // 2. Promise style
  function readFilePromise(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  readFilePromise(filePath)
    .then((data) => {
      console.log('Promise read:', data);
    })
    .catch((error) => {
      console.error('Promise error:', error.message);
    });


      // 3. Async/Await style
      async function readFileAsync() {
        try {
          const data = await readFilePromise(filePath);
          console.log('Async/Await read:', data);
        } catch (error) {
          console.error('Async/Await error:', error.message);
        }
      }

      readFileAsync();
