const path = require("node:path");

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@repo/ui"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // La imagen para compartir lee la fuente Syne del disco en cada petición.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/**"],
  },
};
