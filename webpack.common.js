const path = require('path');
const {
  GraphQLCodegenWebpackPlugin,
} = require('graphql-codegen-webpack-plugin');

module.exports = {
  plugins: [new GraphQLCodegenWebpackPlugin({ configPath: './codegen.yml' })],
  module: {
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js', '.graphql', '.gql'],
    symlinks: true,
  },
};
