const child = require('child_process');
const fg = require('fast-glob');

console.logn = (...args) => console.log(...args, '\n');
const run = (cmd) => {
  console.log('\n>', cmd);
  return child.execSync(cmd, {stdio: 'inherit'});
}
const runReturn = (cmd) => {
  console.log('\n>', cmd);
  return child.execSync(cmd, {stdio: 'pipe', encoding: 'utf-8'}).trim();
}
const runSilent = (cmd) => {
  try{
    run(cmd);
    return true;
  } catch(e) {
    // Do nothing
    return false;
  }
}

const globPattern = process.argv[2];
const dirs = fg.sync(globPattern, {onlyDirectories: true});

console.logn('Search pattern', globPattern);
console.logn('✅ Web repositories found:', dirs);

if(dirs.length === 0 || globPattern === undefined) {
  console.log('❌ Please provide the base path to check all available repositories. ❌');
  console.logn('e.g: "gfe /Users/foo/projects/*"')
  process.exit();
}

// Cycle through all repositories 
for (const dir of dirs) {
  console.log("###############################################################################");
  console.log('♻️ ', dir);
  console.logn("###############################################################################");
  process.chdir(dir);

  // Fetch all branches, tags & prune deleted origin branches.
  run('git fetch --all --tags --prune'); 
  // Cleanup unnecessary files and optimize the local repository - https://git-scm.com/docs/git-gc
  run('git gc --auto');

  // Stash any uncommitted changes if any.
  run('git stash');

  // Assume default branch is 'development', if not try 'master' or 'main'.
  let defaultBranch = 'development'
  // Get current working branch
  const workingBranch = runReturn('git branch --show-current');
  // const isDefaultBranch = workingBranch === defaultBranch;
  console.log("Default Branch:", defaultBranch);
  console.log("Current Branch:", workingBranch);

  // Checkout to local default branch & reset to latest origin changes.
  if(runSilent(`git checkout ${defaultBranch}`) === false) {
    defaultBranch = 'master'
    if(runSilent(`git checkout ${defaultBranch}`) === false) {
      defaultBranch = 'main'
      if(runSilent(`git checkout ${defaultBranch}`) === false) {
        console.log('');
        console.logn(`❌ Could not checkout to default branches: development, master or main.`);
        process.exit(1);
      }
    }
  }

  // Reset local default branch to latest origin changes.
  run(`git reset --hard origin/${defaultBranch}`);
  
  // runSilent('source /usr/local/opt/nvm/nvm.sh && nvm use && npm i');
  // runSilent('npm run build -- --no-zip');

  // Go back to the original working branch & pop any stashed changes if any.
  run(`git checkout ${workingBranch}`);
  runSilent(`git reset --hard origin/${workingBranch}`);
  runSilent('git stash pop');
  console.log('');
}

console.log('✅ Done.')
