const path = require('path');

module.exports = {
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    // compress: true,
    port: 9000
  },
  devtool: 'inline-source-map',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
};