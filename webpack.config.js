const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve("dist"),
    filename: "index.js",
    libraryTarget: "commonjs2",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: "babel-loader",
      },
      {
        test: /\.png$/,
        use: "file-loader",
      },
      {
        test: /\.worker\.js$/,
        loader: "worker-loader",
        options: {
          esModule: false,
          inline: "fallback",
          filename: "[name].js",
        },
      },
    ],
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
  externals: [
    "react",
    "react-dom",
    "react-webcam",
    "@react-three/fiber",
    "@react-three/drei",
    "jotai",
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};
