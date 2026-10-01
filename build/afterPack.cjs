const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async function afterPack(context) {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, '.desktop-package', 'app', 'node_modules');
  const destination = path.join(context.appOutDir, 'resources', 'app', 'node_modules');
  await fs.rm(destination, { recursive: true, force: true });
  await fs.cp(source, destination, { recursive: true });
  console.log(`AIFISHER production node_modules copied to ${destination}`);
};
