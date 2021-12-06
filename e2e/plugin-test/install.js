const parentPackageJson = require("../../package.json");
const {execSync} = require("child_process");
const {join} = require("path");

const version = parentPackageJson.version;
const packageName = parentPackageJson.name.replace("@", "").replace("\/", "-");
const fullPackageName = `${packageName}-${version}.tgz`;
const packagePath = join(__dirname, "..", "..", fullPackageName);

execSync(`npm i --no-save ${packagePath}`);