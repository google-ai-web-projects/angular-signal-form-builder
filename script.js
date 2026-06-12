const fs = require('fs');
const execSync = require('child_process').execSync;
try {
  console.log(execSync('find / -name "angular.json" 2>/dev/null').toString());
} catch(e) {}
