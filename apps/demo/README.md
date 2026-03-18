# @fransek/form Vite demo

A small Vite + React application that shows how to consume `@fransek/form` as a
regular dependency and wire up validation with CSS modules.

## Getting started

From the repository root:

- Install dependencies: `pnpm install --no-frozen-lockfile`
- Start the dev server: `pnpm -C apps/demo dev`

## Available scripts

- `pnpm -C apps/demo dev` – run the Vite dev server
- `pnpm -C apps/demo build` – type-check and build the app
- `pnpm -C apps/demo preview` – preview the production build locally

## What the demo covers

- Using `<Form>` and `<Field>` to coordinate validation and submission
- Displaying validation feedback from the render props API
- Styling the UI with CSS modules
