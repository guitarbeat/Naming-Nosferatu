const { execSync } = require('child_process');

try {
  execSync('git push -u origin fix-ci-checks');
  console.log('Successfully pushed changes to branch.');
} catch (error) {
  console.error('Error pushing changes:', error.message);
}
