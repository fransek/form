# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/@fransek/ui?activeTab=versions

## [0.7.0](https://github.com/fransek/form/compare/v0.6.0...v0.7.0) (2026-06-20)


### Features

* add FormState component for aggregate form state ([#35](https://github.com/fransek/form/issues/35)) ([870fcef](https://github.com/fransek/form/commit/870fcef377a98c25cc0d0e12b8e3a3d12bb01b0e))
* add per-field submit-time async validation skip controls ([#27](https://github.com/fransek/form/issues/27)) ([6b1de2b](https://github.com/fransek/form/commit/6b1de2bdf05bfccd4ef69ece8f39b8659ca46cb4))
* added `cancel()` to `SubmitContext` for cancelling pending validations ([b50cb41](https://github.com/fransek/form/commit/b50cb41a165549963e22acd481ddb17aa77e0c2b))


### Bug Fixes

* exposed `SubmitContext` `CommitOptions` types to public API ([8861b76](https://github.com/fransek/form/commit/8861b76e31e34b45aaf98dcc91052aea2688a8f1))
* removed `onInput` and `onBlur` from `Field` component props ([7a61a28](https://github.com/fransek/form/commit/7a61a2836517d0ed0d92724568bb638c21edf8f8))

## [0.6.0](https://github.com/fransek/form/compare/v0.5.0...v0.6.0) (2026-06-05)


### Features

* after submit validation ([#24](https://github.com/fransek/form/issues/24)) ([a62091d](https://github.com/fransek/form/commit/a62091db2930b310d21a97581f8b4118c2aa05d8))

## [0.5.0](https://github.com/fransek/form/compare/v0.4.0...v0.5.0) (2026-04-16)


### Features

* add dependency-aware validation and fix form behavior ([#21](https://github.com/fransek/form/issues/21)) ([4009ab1](https://github.com/fransek/form/commit/4009ab1c9d96cec94108761d042ea9c65bcac20a))

## [0.4.0](https://github.com/fransek/form/compare/v0.3.0...v0.4.0) (2026-03-22)


### Features

* updated `validate` and `validateAsync` API ([9bcf387](https://github.com/fransek/form/commit/9bcf38721a9b8232a1b6bcec59f66dc54ab52de8))


### Bug Fixes

* fixed minor blur handler validation bug ([#18](https://github.com/fransek/form/issues/18)) ([eae057f](https://github.com/fransek/form/commit/eae057fbd2d797040b62b92e4cc38c7ddd342b7d))

## [0.3.0](https://github.com/fransek/form/compare/v0.2.1...v0.3.0) (2026-03-18)


### Features

* `validateForm` options ([92d32d8](https://github.com/fransek/form/commit/92d32d8f312504d5baad5ee2eb287edaa0d67e2c))


### Bug Fixes

* fixed onBlur validation running when it should not ([4d59416](https://github.com/fransek/form/commit/4d59416610dbe8f8893b8b828310038e1b40bee6))
* optimized form submit validation ([8cc62cc](https://github.com/fransek/form/commit/8cc62ccb6d641f75f9b37401b60cfa8eff7d9452))

## [0.2.1](https://github.com/fransek/form/compare/v0.2.0...v0.2.1) (2026-03-17)


### Bug Fixes

* decreased API surface and added JSDoc comments ([#14](https://github.com/fransek/form/issues/14)) ([dff6a0a](https://github.com/fransek/form/commit/dff6a0acb1c10ae592fe8dfff13899c6449407bb))
* fixed various bugs ([618e820](https://github.com/fransek/form/commit/618e820f0b08476cc8745fc233c90bb9c9d78431))

## [0.2.0](https://github.com/fransek/form/compare/v0.1.0...v0.2.0) (2026-03-16)


### Features

* add `touchedOrDirty` validation mode to field validation flow ([#10](https://github.com/fransek/form/issues/10)) ([b476dff](https://github.com/fransek/form/commit/b476dff4592bc6b8252dadc447f81fbe6f19620f))
