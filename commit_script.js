const { execSync } = require('child_process');

try {
  execSync('git config --global user.email "161369871+google-labs-jules[bot]@users.noreply.github.com"');
  execSync('git config --global user.name "google-labs-jules[bot]"');
  execSync('git commit -a --amend --no-edit');
  execSync('git push -f origin HEAD', { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
