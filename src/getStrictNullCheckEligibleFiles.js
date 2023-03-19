// @ts-check
const path = require("path");
const { getImportsForFile } = require("./tsHelper");
const glob = require("glob");
const config = require("./config");

/**
 * @param {string} srcRoot
 * @param {{ includeTests: boolean }} [options]
 */
const forEachFileInSrc = (srcRoot, options) => {
  const rootKapwing = srcRoot.substring(0, srcRoot.length - 10);
  const sharedCodePath = path.join(rootKapwing, "/shared/src");
  return new Promise((resolve, reject) => {
    glob(
      `{${srcRoot}/**/*.{ts,tsx},${sharedCodePath}/**/*.{ts,tsx}}`,
      (err, files) => {
        if (err) {
          return reject(err);
        }

        return resolve(
          files.filter((file) => {
            if (
              options &&
              !options.includeTests &&
              (file.endsWith(".test.ts") ||
                file.endsWith(".test.tsx") ||
                file.endsWith(".stories.tsx"))
            ) {
              return false;
            }
            return true;
          })
        );
      }
    );
  });
};
module.exports.forEachFileInSrc = forEachFileInSrc;

/**
 * @param {string} vscodeRoot
 * @param {(file: string) => void} forEach
 * @param {{ includeTests: boolean }} [options]
 */
module.exports.forUncheckedIndexEligbleFiles = async (
  vscodeRoot,
  forEach,
  options
) => {
  const srcRoot = path.join(vscodeRoot, "src");

  const tsconfig = require(path.join(vscodeRoot, config.targetTsconfig));
  const checkedFiles = await getCheckedFiles(tsconfig, vscodeRoot);

  const imports = new Map();
  const getMemoizedImportsForFile = (file, srcRoot) => {
    if (imports.has(file)) {
      return imports.get(file);
    }
    const importList = getImportsForFile(file, srcRoot);
    imports.set(file, importList);
    return importList;
  };

  const files = await forEachFileInSrc(srcRoot, options);
  const uncheckedFiles = files.filter((file) => !checkedFiles.has(file));
  const uncheckedAndUnskippedFiles = uncheckedFiles.filter(
    (file) => !config.skippedFiles.has(path.relative(srcRoot, file))
  );
  return uncheckedAndUnskippedFiles.filter((file) => {
    const allProjImports = getMemoizedImportsForFile(file, srcRoot);

    const nonCheckedImports = allProjImports
      .filter((x) => x !== file)
      .filter((imp) => {
        if (checkedFiles.has(imp)) {
          return false;
        }
        // Don't treat cycles as blocking
        const impImports = getMemoizedImportsForFile(imp, srcRoot);
        return (
          impImports
            .filter((x) => x !== file)
            .filter((x) => !checkedFiles.has(x)).length !== 0
        );
      });

    const isEdge = nonCheckedImports.length === 0;
    if (isEdge) {
      forEach(file);
    }
    return isEdge;
  });
};

async function getCheckedFiles(tsconfig, vscodeRoot) {
  const set = new Set(
    tsconfig.files.map((include) => path.join(vscodeRoot, include))
  );
  if (tsconfig.include) {
    const includes = tsconfig.include.map((include) => {
      return new Promise((resolve, reject) => {
        glob(path.join(vscodeRoot, include), (err, files) => {
          if (err) {
            return reject(err);
          }

          for (const file of files) {
            set.add(file);
          }
          resolve();
        });
      });
    });
    await Promise.all(includes);
  }
  return set;
}
