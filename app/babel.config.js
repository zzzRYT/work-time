module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@shared": "./src/shared",
            "@pages": "./src/pages",
            "@app": "./src/app",
          },
        },
      ],
    ],
  };
};
