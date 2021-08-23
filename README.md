# Vite - Nested ESM dependencies repro

Instructions:

1. Clone the repo

```
yarn
yarn dev
```

1. Visit http://localhost:3000 in the browser
2. You should see an error in your server console:

```
2:26:32 PM [vite] new dependencies found: repro-ssr-pkg, updating...
 > node_modules/react-dom/cjs/react-dom-server.node.development.js:18:21: error: Could not read from file: /Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/stream
    18 │ var stream = require('stream');
       ╵                      ~~~~~~~~

2:26:32 PM [vite] error while updating dependencies:
Error: Build failed with 1 error:
node_modules/react-dom/cjs/react-dom-server.node.development.js:18:21: error: Could not read from file: /Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/stream
    at failureErrorWithLog (/Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:1449:15)
    at /Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:1131:28
    at runOnEndCallbacks (/Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:921:63)
    at buildResponseToResult (/Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:1129:7)
    at /Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:1236:14
    at /Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:609:9
    at handleIncomingPacket (/Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:706:9)
    at Socket.readFromStdout (/Users/joshlarson/src/github.com/jplhomer/repro-ssr-modules/node_modules/esbuild/lib/main.js:576:7)
    at Socket.emit (node:events:378:20)
    at Socket.EventEmitter.emit (node:domain:470:12)
```

## What's happening?

1. Vite loads the dev server
1. Initial request for `/` comes through
1. `configureServer` middleware picks up the request, loads `entry-server.jsx` as an SSR module
1. Since `entry-server.jsx` an ESM dependency from https://github.com/jplhomer/repro-ssr-pkg, Vite attempts to optimize the newly-discovered "missing" dep (with `ssr: true`)
1. The `react-dom/server` nested dependency attempts to load the Node.js code, referring to `stream` built-in
1. Vite can't resolve `stream`, leading to the error above in the console.
1. **Strangely**, the request still succeeds, and the React element is still rendered to string :thinking_face: How mysterious. In other projects, the server ends up breaking at this same spot, though (e.g. the entire React application can't be rendered).

## Workarounds

- Adding `repro-ssr-pkg` to `optimizeDeps.include`:

```
$ vite --force
Pre-bundling dependencies:
  repro-ssr-pkg
(this will be run only when your dependencies or config have changed)
```

No error :tada: Super weird — why would this make a difference?

- Using `vite < 2.4.0` (didn't seem to have this issue for old versions of Vite)
