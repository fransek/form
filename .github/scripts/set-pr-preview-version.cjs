const fs = require("node:fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const versionWithoutBuild = pkg.version.split("+")[0];
const prerelease = `pr.${process.env.PR_NUMBER}.${process.env.RUN_NUMBER}.${process.env.RUN_ATTEMPT}`;

pkg.version = versionWithoutBuild.includes("-")
  ? `${versionWithoutBuild}.${prerelease}`
  : `${versionWithoutBuild}-${prerelease}`;

fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
fs.appendFileSync(
  process.env.GITHUB_OUTPUT,
  `name=${pkg.name}\nversion=${pkg.version}\n`,
);
