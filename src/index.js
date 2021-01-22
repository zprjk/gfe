const child = require('child_process');
const fg = require('fast-glob');

console.logn = (...args) => console.log(...args, '\n');
const run = (cmd) => child.execSync(cmd, {stdio: 'inherit'});
const rung = (cmd) => child.execSync(cmd, {stdio: 'pipe', encoding: 'utf-8'}).trim();

const MAIN_BRANCH = 'development';
const globPattern = process.argv[2];
const dirs = fg.sync(globPattern, {onlyDirectories: true});

console.logn('Search pattern', globPattern);
console.logn('Web repositories found:', dirs);

if(dirs.length === 0 || globPattern === undefined) {
  console.log('❌ Please provide the base path to check all available repositories. ❌');
  console.logn('e.g: "gfe /Users/foo/projects/*"')
  process.exit();
}

// Cycle through all repositories 
for (const dir of dirs) {
  console.log("#######################################################");
  console.log('♻️ ', dir);
  console.logn("#######################################################");
  process.chdir(dir);

  // Fetch all branches, tags & prune deleted origin branches.
  run('git fetch --all --tags --prune'); 
  // Cleanup unnecessary files and optimize the local repository - https://git-scm.com/docs/git-gc
  run('git gc --auto'); 

  // get current working branch
  const branch = rung('git branch --show-current');
  console.log(branch);
  const isMainBranch = branch === MAIN_BRANCH;

  // 
  if(isMainBranch === false) {
    run('git stash');
  }

  // Checkout to local main branch & reset to latest origin changes.
  run(`git checkout ${MAIN_BRANCH}`);
  run(`git reset --hard origin/${MAIN_BRANCH}`);

  // 
  if(isMainBranch === false) {
    run(`git checkout ${branch}`);
    try {
      run('git stash pop');
    } catch {
      // Do nothing.
    }
  }

  console.log('');
}

console.log('✅ Done.')
