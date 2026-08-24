const fs = require('fs');
const glob = require('glob');

glob("client/src/components/*.jsx", (err, files) => {
  if (err) throw err;
  let count = 0;
  files.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    // Remove the line <Box h="3px" bgGradient="linear(...)" /> and any surrounding whitespace on that line
    const regex = /^\s*<Box h="3px" bgGradient="linear[^>]+>\s*\n?/gm;
    if (regex.test(code)) {
      code = code.replace(regex, '');
      fs.writeFileSync(file, code);
      count++;
    }
  });
  console.log('Removed modal top lines from ' + count + ' files!');
});
