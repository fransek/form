import typescript from "@rollup/plugin-typescript";

/**
 * The root package.json sets `"type": "module"`, so Node would parse the
 * CommonJS output as ESM. Emitting a nested package.json marks the CJS build
 * directory as CommonJS.
 * @returns {import('rollup').Plugin}
 */
const commonjsPackageJson = () => ({
  name: "commonjs-package-json",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "package.json",
      source: JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
    });
  },
});

/** @type {() => import('rollup').RollupOptions} */
const createConfig = (format, dir) => ({
  input: "src/index.ts",
  external: ["react"],
  output: {
    dir,
    format,
    sourcemap: true,
    preserveModules: true,
  },
  plugins: [
    typescript({
      compilerOptions: {
        declarationDir: dir,
        emitDeclarationOnly: true,
      },
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/test/**",
      ],
    }),
    ...(format === "cjs" ? [commonjsPackageJson()] : []),
  ],
});

export default [
  createConfig("cjs", "dist/cjs"),
  createConfig("esm", "dist/esm"),
];
