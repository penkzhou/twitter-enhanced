// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  })
);

webpack(config, function (err, stats) {
  if (err) {
    console.error('Webpack error:', err);
    throw err;
  }

  if (stats.hasErrors()) {
    console.error('Webpack compilation errors:', stats.toJson().errors);
    throw new Error('Webpack compilation failed');
  }

  console.log('Build completed successfully!');
  console.log('Package info:', packageInfo.name, packageInfo.version);
  console.log(
    'Zip should be at:',
    path.join(
      __dirname,
      '../',
      'zip',
      `${packageInfo.name}-${packageInfo.version}.zip`
    )
  );

  // Check if zip file was created
  const zipPath = path.join(
    __dirname,
    '../',
    'zip',
    `${packageInfo.name}-${packageInfo.version}.zip`
  );
  if (fs.existsSync(zipPath)) {
    console.log('✅ ZIP file created successfully at:', zipPath);
  } else {
    console.error('❌ ZIP file was not created at:', zipPath);
  }
});
