export default {
  poweredByHeader: false,
  // Keep build type checking in the TypeScript 5 compiler API. This also avoids
  // capturing a tsc subprocess through pipes in restricted development shells.
  experimental: { useTypeScriptCli: false },
};
