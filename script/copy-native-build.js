const fs = require('fs');

const sourceFilePath = 'build/Release/ctrlc.node';
const destinationFilePath = 'lib/ctrlc.node';

fs.copyFile(sourceFilePath, destinationFilePath, (err) => {
  if (err) throw err;
  console.log('ctrlc.node copied to lib successfully!');
});
