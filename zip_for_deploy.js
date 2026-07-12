const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirsToZip = ['backend-api', 'web-app', 'landing-page'];
const destZip = 'novastrat_deploy.zip';

// Create a staging dir
const stagingDir = path.join(__dirname, 'deploy_staging');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir);

dirsToZip.forEach(dir => {
  const src = path.join(__dirname, dir);
  const dest = path.join(stagingDir, dir);
  console.log(`Copying ${dir}...`);
  try {
    // Robocopy returns 1 on success
    execSync(`robocopy "${src}" "${dest}" /E /XD node_modules dist .git /XF *.sqlite *.zip`, { stdio: 'ignore' });
  } catch (err) {
    // robocopy exit codes < 8 are non-fatal
    if (err.status >= 8) {
      console.error(`Error copying ${dir}:`, err.message);
    }
  }
});

console.log('Zipping...');
try {
  if (fs.existsSync(destZip)) fs.unlinkSync(destZip);
  execSync(`powershell Compress-Archive -Path "${stagingDir}\\*" -DestinationPath "${destZip}" -Force`);
  console.log('✅ novastrat_deploy.zip created successfully!');
} catch(err) {
  console.error('Error zipping:', err.message);
}

// Cleanup
fs.rmSync(stagingDir, { recursive: true, force: true });
