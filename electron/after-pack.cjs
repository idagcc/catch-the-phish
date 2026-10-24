const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const root = context.packager.projectDir;
  await Promise.all([
    fs.copyFile(path.join(root, 'scripts', 'Launch.cmd'), path.join(context.appOutDir, 'Launch.cmd')),
    fs.copyFile(path.join(root, 'docs', 'windows-setup.md'), path.join(context.appOutDir, 'Windows setup.txt')),
  ]);
};
