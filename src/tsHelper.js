// @ts-check
const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const disallowedPackageRegexes = [
    /^react-icons/,
    /^@sentry/,
    /^@reduxjs/,
    /^uuid/,
    /^immer/,
    /^@kapwing/,
    /^lodash/,
    /^history/,
    /^sharedb\/lib/,
    /^@openreplay/,
    /^@stripe/,
    /^@welldone-software/,
    /^@loadable/,
    /^@testing-library/,
    /^react-dom/,
    /^react-konva/,
    /^konva/,
    /^workers\//,
    /^@mediapipe/,
    /^@tensorflow/,
    /^@sinonjs/,
    /^@giphy/,
    /^@rehooks/,
    /^@typeform/,
]

module.exports.getImportsForFile = function getImportsForFile(file, srcRoot) {
    const rootKapwing = srcRoot.substring(0, srcRoot.length - 10);
    const fileInfo = ts.preProcessFile(fs.readFileSync(file).toString());
    return fileInfo.importedFiles
        .map(importedFile => importedFile.fileName)
        .filter(fileName => !/\.scss|\.css|\.svg|\.png|\.jpeg|\.json/.test(fileName)) // disallowed filetypes
        .filter(x => /\//.test(x)) // remove node modules (the import must contain '/')
        .filter(x => !disallowedPackageRegexes.some(rgx => rgx.test(x))) // remove nested nested node modules
        .map(fileName => {
            if (/(^\.\/)|(^\.\.\/)/.test(fileName)) {
                return path.join(path.dirname(file), fileName);
            }
            
            // add shared code folder
            if (/^@shared/.test(fileName)) {
                const sharedCodePath = path.join(rootKapwing, "/shared/src");
                const fileNameWithoutAnnotation = fileName.replace(/^@shared/, "");
                return path.join(sharedCodePath, fileNameWithoutAnnotation);
            }
        
            return path.join(srcRoot, fileName);
        }).map(fileName => {
            if (fs.existsSync(`${fileName}.ts`)) {
                return `${fileName}.ts`;
            }
            if (fs.existsSync(`${fileName}.tsx`)) {
                return `${fileName}.tsx`;
            }
            if (fs.existsSync(`${fileName}.jsx`)) {
                return `${fileName}.jsx`;
            }
            if (fs.existsSync(`${fileName}.js`)) {
                return `${fileName}.js`;
            }
            if (fs.existsSync(`${fileName}.d.ts`)) {
                return `${fileName}.d.ts`;
            }
            if (fs.existsSync(`${fileName}/index.ts`)) {
                return `${fileName}/index.ts`;
            }
            if (fs.existsSync(`${fileName}/index.tsx`)) {
                return `${fileName}/index.tsx`;
            }
            if (fs.existsSync(fileName)) {
                return fileName;
            }
            throw new Error(`Unresolved import ${fileName} in ${file}`);
        });
    };
