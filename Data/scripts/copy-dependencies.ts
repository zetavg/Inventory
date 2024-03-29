import { ESLint } from 'eslint';
import fs from 'fs';
import path from 'path';

const eslint = new ESLint({
  useEslintrc: true,
  fix: true,
});

async function writeLintedCode(code: string, outputPath: string) {
  const results = await eslint.lintText(code);
  if (results && results[0] && results[0].output) {
    fs.writeFileSync(outputPath, results[0].output);
  } else {
    fs.writeFileSync(outputPath, code);
  }
}

function copyFile(
  fromPath: Array<string>,
  toPath: Array<string>,
  sourcePathStr: string,
) {
  const srcContent = fs.readFileSync(path.join(...fromPath), 'utf8');

  if (toPath[toPath.length - 1].endsWith('.snap')) {
    fs.writeFileSync(path.join(...toPath), srcContent);
  } else {
    const prefix =
      [
        '//',
        '// DO NOT edit this file directly. The content of this file is auto generated',
        '// by `yarn run copy-dependencies.`',
        '//',
        '// Please edit the following source file instead:',
        `//   ${sourcePathStr}`,
        '//',
      ].join('\n') + '\n\n';

    writeLintedCode(prefix + srcContent, path.join(...toPath));
  }

  console.log(`Code written to "${path.join(...toPath)}".`);
}

function copyDepDir(source: Array<string>, target: Array<string>) {
  const fullTargetPath = [__dirname, '..', 'deps', ...target];
  const fullTargetPathStr = path.join(...fullTargetPath);
  if (!fs.existsSync(fullTargetPathStr)) {
    fs.mkdirSync(fullTargetPathStr, { recursive: true });
    console.log(`Directory ${fullTargetPathStr} created.`);
  }

  const fullSourcePath = [__dirname, '..', '..', ...source];
  const fullSourcePathStr = path.join(...fullSourcePath);
  const files = fs.readdirSync(fullSourcePathStr);
  for (const file of files) {
    const fileFullPath = [...fullSourcePath, file];
    const fileStats = fs.statSync(path.join(...fileFullPath));

    const fileTargetPath = [...fullTargetPath, file];

    if (fileStats.isDirectory()) {
      copyDepDir([...source, file], [...target, file]);
    } else if (
      file.endsWith('.js') ||
      file.endsWith('.jsx') ||
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('.snap')
    ) {
      copyFile(fileFullPath, fileTargetPath, [...source, file].join('/'));
    }
  }
}

copyDepDir(['packages', 'epc-utils', 'lib'], ['epc-utils']);
copyDepDir(['packages', 'epc-utils', 'types'], ['types']);
