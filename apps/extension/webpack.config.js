const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/index.ts',
    popup: './src/popup/index.ts',
    'content-twitter': './src/content/twitter.ts',
    'content-reddit': './src/content/reddit.ts',
    'content-hackernews': './src/content/hackernews.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public', to: '.' },
        { from: 'src/popup/index.html', to: 'popup.html' },
      ],
    }),
  ],
  optimization: {
    minimize: false, // Easier debugging for now
  },
};
