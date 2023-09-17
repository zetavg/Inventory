const path = require('path');
const fs = require('fs');

function isPackage(path) {
  if (!fs.statSync(path).isDirectory()) {
    return false;
  }
  const files = fs.readdirSync(path);
  return files.includes('package.json');
}

const projects = fs
  .readdirSync(__dirname)
  .filter(f => isPackage(path.join(__dirname, f)));
const packages = fs
  .readdirSync(path.join(__dirname, 'packages'))
  .filter(f => isPackage(path.join(__dirname, 'packages', f)));

const dependencies = [
  ...projects.map(p => path.join(__dirname, p)),
  ...packages.map(p => path.join(__dirname, 'packages', p)),
]
  .flatMap(p =>
    Object.keys(require(path.join(p, 'package.json'))?.dependencies),
  )
  .filter((value, index, self) => self.indexOf(value) === index);

module.exports = dependencies;
