import typescript from "@rollup/plugin-typescript";

/** @type {() => import('rollup').RollupOptions} */
const createConfig = (format, dir, declarations = false) => ({
  input: "src/index.ts",
  external: ["react", "react/jsx-runtime"],
  output: {
    dir,
    format,
    sourcemap: true,
    preserveModules: true,
  },
  plugins: [
    typescript({
      compilerOptions: {
        declaration: declarations,
        ...(declarations ? { declarationDir: dir, emitDeclarationOnly: true } : {}),
      },
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/test/**"],
    }),
  ],
});

export default [
  createConfig("cjs", "dist/cjs"),
  createConfig("esm", "dist/esm", true),
];
