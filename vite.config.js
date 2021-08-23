import { resolve } from "path";
import fs from "fs";

/**
 * @type {import('vite').UserConfig}
 */
export default {
  plugins: [myPlugin()],
  optimizeDeps: {
    include: ["repro-ssr-pkg"],
  },
};

function myPlugin() {
  /**
   * @type {import('vite').Plugin}
   */
  const plugin = {
    name: "ssr-repro",

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(`http://localhost:3000${req.url}`);

          if (url.pathname !== "/") {
            return next();
          }

          const indexHtml = await server.transformIndexHtml(
            url.href,
            fs.readFileSync(resolve(__dirname, "./index.html"), "utf-8")
          );
          const entrypoint = await server.ssrLoadModule(
            resolve(__dirname, "./entry-server.jsx")
          );

          const render = entrypoint.default || entrypoint;

          const body = render();

          const html = indexHtml.replace(
            `<div id="main">`,
            `<div id="main">${body}`
          );

          res.setHeader("content-type", "text/html");
          res.statusCode = 200;

          res.end(html);
        } catch (e) {
          server.ssrFixStacktrace(e);
          console.log(e.stack);
          res.statusCode = 500;
          res.write(e.stack);
          return next(e);
        }
      });
    },
  };
  return plugin;
}
