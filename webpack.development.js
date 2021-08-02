const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const { merge } = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  entry: ['webpack/hot/signal', path.join(__dirname, 'src/main.ts')],
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/signal'],
    }),
  ],
  mode: 'development',
  plugins: [
    new RunScriptWebpackPlugin({
      name: 'server.js',
      nodeArgs: ['--inspect', '--require', 'dotenv/config'],
      signal: true,
    }),
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    hot: true,
    disableHostCheck: true,
  },
  watch: true,
});
