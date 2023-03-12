/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  serverDependenciesToBundle: [/~/],
  serverModuleFormat: "esm",
  future: {
    unstable_postcss: true,
    unstable_tailwind: true,
  },
};
