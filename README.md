# jsbook-zlm

An interactive JavaScript notebook editor for the terminal. Write, execute, and preview JavaScript and React code in real time — similar to Jupyter Notebooks, but built entirely for the browser and Node.js ecosystem.

---

## What It Does

jsbook-zlm launches a local web server that serves a notebook interface in your browser. You can:

- Add **code cells** — write JavaScript or React, execute it instantly, see the output rendered live
- Add **text cells** — write Markdown, rendered inline
- Use `show()` — a built-in helper to display values, strings, objects, or React components in the preview panel
- Import any npm package on the fly — dependencies are fetched automatically from the unpkg CDN, no install needed
- All cells and their content are **auto-saved** to a local `.js` file on your machine

---

## Quick Start

No installation required. Run directly with npx:

```sh
npx jsbook-zlm serve
```

This opens a notebook at `http://localhost:4005` and saves your cells to `notebook.js` in the current directory.

### Options

```sh
npx jsbook-zlm serve [filename] --port <number>
```

| Argument     | Description                              | Default       |
|--------------|------------------------------------------|---------------|
| `filename`   | File to save and load notebook cells from | `notebook.js` |
| `--port, -p` | Port to run the server on                | `4005`        |

**Examples:**

```sh
# Use a custom filename
npx jsbook-zlm serve my-notes.js

# Run on a different port
npx jsbook-zlm serve --port 3333

# Both
npx jsbook-zlm serve my-notes.js --port 3333
```

---

## Features

- **Live code execution** — code is bundled in the browser using esbuild-wasm, no build step required
- **Cumulative code scope** — each code cell has access to variables defined in all previous cells
- **React support** — render React components directly using the `show()` helper
- **Markdown cells** — full markdown rendering with click-to-edit
- **npm package imports** — import any npm package (e.g. `import _ from 'lodash'`) without installing it
- **Auto-save** — changes are debounced and persisted to your local file automatically
- **Resizable panels** — drag to resize the editor and preview panes
- **Code formatting** — built-in Prettier formatter triggered via a button in the editor
- **Dark theme** — styled with Bulmaswatch superhero theme

---

## Using the `show()` Function

Each code cell has access to a `show()` function for rendering output in the preview panel:

```js
// Display a string
show('Hello, world!');

// Display an object (rendered as JSON)
show({ name: 'jsbook', version: '1.0.3' });

// Display a React component
import React from 'react';
const App = () => <h1 style={{ color: 'coral' }}>Hello from React!</h1>;
show(<App />);
```

Only the **current cell's** `show()` renders output. Previous cells have a no-op version so they don't overwrite each other's previews.

---

## How It Works — Architecture

The project is a Lerna monorepo with three packages:

```
jsbook-zlm (CLI)
    └── jsbook-zlm-local-api  (Express server)
            └── jsbook-zlm-local-client  (React frontend)
```

### Request Flow

```
Terminal
  └── CLI starts Express server on port 4005
          ├── GET /cells  →  reads notebook file from disk
          ├── POST /cells →  writes notebook file to disk
          └── Static serve  →  serves the React app
                  └── Browser loads React app
                          ├── Fetches cells on mount
                          ├── User edits code in Monaco editor
                          ├── esbuild-wasm bundles the code in-browser
                          │       └── imports resolved via unpkg CDN
                          └── Bundled code sent via postMessage to iframe
                                  └── iframe eval()s and renders output
```

### Packages

| Package | Description |
|---|---|
| `jsbook-zlm` | CLI entry point, uses Commander.js to parse arguments |
| `jsbook-zlm-local-api` | Express server — serves the app and handles file persistence |
| `jsbook-zlm-local-client` | React app — editor, bundler, preview, state management |

---

## Building From Scratch

This section walks through how to recreate this project from the ground up.

### Prerequisites

- Node.js v18+
- npm v9+
- Lerna (`npm install -g lerna`)

### 1. Set Up the Monorepo

```sh
mkdir jbook && cd jbook
npm init -y
npm install --save-dev lerna
npx lerna init
```

Your root `package.json` should define workspaces:

```json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```

### 2. Create the Three Packages

```sh
mkdir -p packages/cli/src/commands
mkdir -p packages/local-api/src/routes
mkdir -p packages/local-client/src
```

### 3. Local Client — React Frontend

The frontend is a Vite + React + TypeScript app.

```sh
cd packages/local-client
npm create vite@latest . -- --template react-ts
npm install
```

Install additional dependencies:

```sh
npm install @reduxjs/toolkit react-redux redux redux-thunk
npm install axios localforage immer
npm install @monaco-editor/react monaco-editor monaco-jsx-highlighter
npm install @babel/parser @babel/traverse
npm install prettier
npm install @uiw/react-md-editor
npm install react-resizable
npm install bulmaswatch @fortawesome/fontawesome-free
npm install esbuild-wasm
```

#### State Management

The app uses Redux Toolkit with a custom middleware for auto-saving:

- **Action types** define all possible events (cell CRUD, bundling, fetch/save)
- **Reducers** handle cells (order + data map) and bundles (per-cell build state)
- **Action creators** include async thunks for fetching, saving, and bundling
- **Persist middleware** debounces saves (250ms) after any cell mutation

#### Bundler

Code cells are bundled in the browser using `esbuild-wasm`:

- Lazy-initialized from unpkg CDN on first use
- Two custom esbuild plugins handle module resolution and fetching:
  - `unpkg-path-plugin` — resolves bare imports (e.g. `lodash`) to `https://unpkg.com/lodash`
  - `fetch-plugin` — fetches and caches files from unpkg using localforage

#### Key Components

| Component | Purpose |
|---|---|
| `CellList` | Root list, fetches cells on mount |
| `CellListItem` | Routes to CodeCell or TextEditor based on type |
| `CodeCell` | Monaco editor + resizable preview, triggers bundling |
| `CodeEditor` | Monaco editor with JSX highlighting and Prettier format button |
| `Preview` | Sandboxed iframe, receives bundled code via postMessage |
| `TextEditor` | Click-to-edit Markdown cell using react-md-editor |
| `AddCell` | Insert new code or text cell between existing ones |
| `ActionBar` | Move up/down and delete buttons per cell |
| `Resizable` | Draggable resize wrapper (horizontal and vertical) |

#### Cumulative Code

Each code cell runs with the code of all previous cells prepended. This allows:

```js
// Cell 1
const message = 'hello';

// Cell 2 — can access message from cell 1
show(message.toUpperCase());
```

This is implemented in the `useCumulativeCode` hook which joins all preceding cell contents before bundling.

### 4. Local API — Express Server

```sh
cd packages/local-api
npm init -y
npm install express http-proxy-middleware cors
npm install -D typescript @types/express @types/cors
```

The API server has two responsibilities:

**Serve the frontend:**
- In production (`NODE_ENV=production`): serves static files from `jsbook-zlm-local-client/dist`
- In development: proxies all requests to the Vite dev server on port 3000

**Persist cells:**
- `GET /cells` — reads the notebook file (creates it if missing)
- `POST /cells` — writes the updated cell array to the file as JSON

The cells router is mounted **before** the proxy/static middleware so API routes always take priority.

`tsconfig.json` should use `"module": "commonjs"` and `"esModuleInterop": true`.

### 5. CLI — Command-Line Interface

```sh
cd packages/cli
npm init -y
npm install commander
npm install -D typescript @types/node esbuild
```

The CLI uses Commander.js to expose a `serve` command:

```sh
jsbook-zlm serve [filename] --port <number>
```

It calls the `serve()` function from `jsbook-zlm-local-api`, passing:
- Port number
- Filename (basename)
- Working directory
- `useProxy` flag — `true` in development, `false` in production (`NODE_ENV=production`)

The `prepublishOnly` script uses esbuild to bundle everything into a single `dist/index.js`:

```json
"prepublishOnly": "esbuild src/index.ts --platform=node --outfile=dist/index.js --bundle --minify --external:jsbook-zlm-local-api"
```

Note: `jsbook-zlm-local-api` is marked external so it's required at runtime (and installed as a dependency) rather than bundled.

### 6. Publishing with Lerna

All three packages are published to npm under the names:

- `jsbook-zlm` (CLI)
- `jsbook-zlm-local-api`
- `jsbook-zlm-local-client`

To publish:

```sh
# Bump versions across all packages
lerna version patch --no-push

# Publish to npm (requires npm login)
lerna publish from-package --no-push
```

---

## Project Structure

```
jbook/
├── lerna.json
├── package.json
└── packages/
    ├── cli/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts
    │       └── commands/
    │           └── serve.ts
    ├── local-api/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts
    │       └── routes/
    │           └── cells.ts
    └── local-client/
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        └── src/
            ├── App.tsx
            ├── index.tsx
            ├── bundler/
            │   ├── index.ts
            │   └── plugins/
            │       ├── fetch-plugin.ts
            │       └── unpkg-path-plugin.ts
            ├── components/
            │   ├── action-bar.tsx
            │   ├── add-cell.tsx
            │   ├── cell-list.tsx
            │   ├── cell-list-item.tsx
            │   ├── code-cell.tsx
            │   ├── code-editor.tsx
            │   ├── preview.tsx
            │   ├── resizable.tsx
            │   └── text-editor.tsx
            ├── hooks/
            │   ├── use-actions.ts
            │   ├── use-cumulative-code.tsx
            │   └── use-type-selector.ts
            └── state/
                ├── index.ts
                ├── store.ts
                ├── cell.ts
                ├── action-types/
                ├── actions/
                ├── action-creators/
                ├── reducers/
                └── middlewares/
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| CLI | Node.js, Commander.js |
| Server | Express 5, http-proxy-middleware |
| Frontend | React 19, Vite 7, TypeScript |
| State | Redux Toolkit, Redux Thunk, Immer |
| Editor | Monaco Editor, monaco-jsx-highlighter |
| Bundler | esbuild-wasm (in-browser) |
| Formatting | Prettier |
| Markdown | @uiw/react-md-editor |
| Styling | Bulmaswatch (Superhero), FontAwesome |
| Caching | localforage (IndexedDB) |
| Monorepo | Lerna |

---

## License

MIT
