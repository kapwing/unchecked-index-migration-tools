A fork of the Vscode team's scripts they used to progressively adopt the `strictNullChecks` TS rule.  The process they used is describe [in this blog post](https://code.visualstudio.com/blogs/2019/05/23/strict-null).  The scripts have been modified for the Kapwing repo so we can migrate to using the `noUncheckedIndexedAccess` TS rule.

# Original README

Scripts to help [migrate VS Code to use strict null checks](https://github.com/Microsoft/vscode/issues/60565)

## Usage

```bash
$ npm install
```

**index.js**

The main script prints of list of files that are eligible for strict null checks. This includes all files that only import files thare are already strict null checked. 

```bash
$ node index.js /path/to/kapwing/client
```

**autoAdd.js**

Very simple script that tries to auto add any eligible file to the `tsconfig.strictNullChecks.json`. This iteratively compiles the `tsconfig` project with just that file added. If there are no errors, it is added to the `tsconfig`

```bash
$ node autoAdd.js /path/to/kapwing/client
```
