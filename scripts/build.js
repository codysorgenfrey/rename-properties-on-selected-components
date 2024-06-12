const ts = require('typescript');
const path = require('path');
const fs = require('fs');

// Locations
const srcDir = path.resolve(__dirname, '../src');
const distDir = path.resolve(__dirname, '../dist');

// clean dist folder
if (fs.existsSync(distDir)) {
  fs.rmdirSync(distDir, { recursive: true });
}

// create dist folder
fs.mkdirSync(distDir);

// compile typescript
const tsConfig = ts.readConfigFile(
  path.resolve(__dirname, '../tsconfig.json'),
  ts.sys.readFile
).config;
const tsCompilerOptions = ts.parseJsonConfigFileContent(
  tsConfig,
  ts.sys,
  path.resolve(__dirname, '../')
).options;

const tsProgram = ts.createProgram(
  [path.resolve(__dirname, '../src/index.ts')],
  tsCompilerOptions
);
const tsResult = tsProgram.emit();

if (tsResult.emitSkipped) {
  console.error('Typescript compilation failed');
  process.exit(1);
}

// copy all non-ts files
const files = fs.readdirSync(srcDir);
files.forEach((file) => {
  if (file.endsWith('.ts')) return;
  fs.copyFileSync(path.resolve(srcDir, file), path.resolve(distDir, file));
});
