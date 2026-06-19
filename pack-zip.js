const path = require('path');
const fs = require('fs');
const jszip = require('jszip');

const iconFile = path.join(__dirname, 'icon.png');
const fileIconFile = path.join(__dirname, 'file-icon.png');
const pluginJSON = path.join(__dirname, 'plugin.json');
const distFolder = path.join(__dirname, 'dist');

if (!fs.existsSync(pluginJSON)) {
  console.error('Error: plugin.json not found.');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(pluginJSON, 'utf8'));
let readmeDotMd;
let changelogDotMd;

// 1. Fixed Readme Logic: Use the value from plugin.json if it exists
const readmeTarget = typeof json.readme === 'string' ? json.readme : 'readme.md';
readmeDotMd = path.join(__dirname, readmeTarget);
if (!fs.existsSync(readmeDotMd)) {
  readmeDotMd = path.join(__dirname, 'README.md'); // Fallback case check
}

// 2. Fixed Changelog Logic: Use the value from plugin.json if it exists
const changelogTarget = typeof json.changelogs === 'string' ? json.changelogs : 'changelog.md';
changelogDotMd = path.join(__dirname, changelogTarget);
if (!fs.existsSync(changelogDotMd)) {
  changelogDotMd = path.join(__dirname, 'CHANGELOG.md'); // Fallback case check
}

const zip = new jszip();

// Safely add root assets if they exist
if (fs.existsSync(iconFile)) zip.file('icon.png', fs.readFileSync(iconFile));
if (fs.existsSync(fileIconFile)) zip.file('file-icon.png', fs.readFileSync(fileIconFile));
zip.file('plugin.json', fs.readFileSync(pluginJSON));

// Only attempt to read markdown files if they actually exist on disk
if (readmeDotMd && fs.existsSync(readmeDotMd)) {
  zip.file("readme.md", fs.readFileSync(readmeDotMd));
}
if (changelogDotMd && fs.existsSync(changelogDotMd)) {
  zip.file("changelog.md", fs.readFileSync(changelogDotMd));
}

// Pack the dist folder contents
if (fs.existsSync(distFolder)) {
  loadFile('', distFolder);
}

zip
  .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
  .pipe(fs.createWriteStream(path.join(__dirname, 'plugin.zip')))
  .on('finish', () => {
    console.log('Plugin plugin.zip written.');
  });

// 3. Fixed recursive folder packager
function loadFile(root, folder) {
  const distFiles = fs.readdirSync(folder);
  
  distFiles.forEach((file) => {
    const localPath = path.join(folder, file);
    const stat = fs.statSync(localPath);
    
    // Crucial: Forces forward slashes ('/') for internal ZIP paths across all platforms
    const zipPath = root ? `${root}/${file}` : file;

    if (stat.isDirectory()) {
      // Recursively step into directories (JSZip auto-creates parent folders via file paths)
      loadFile(zipPath, localPath);
      return;
    }

    if (!/LICENSE.txt/.test(file)) {
      zip.file(zipPath, fs.readFileSync(localPath));
    }
  });
}
