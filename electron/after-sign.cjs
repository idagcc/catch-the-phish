const { execFile } = require('node:child_process');
const path = require('node:path');
const { promisify } = require('node:util');

const run = promisify(execFile);

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  await run('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath]);
  console.log('Mac app and nested code signatures verified.');
};
