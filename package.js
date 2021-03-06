Package.describe({
  name: 'mstn:overpass',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: 'cache overpass data on server',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/mstn/overpass.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'osmtogeojson':'2.2.5'
});


Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use(['http','mongo', 'yauh:turfjs'], 'server');
  api.addFiles('both/api.js');
  api.addFiles([
    'server/utils.js',
    'server/cache.js',
    'server/overpass.js',
    'server/api.js'
  ], 'server');
  api.export('Overpass');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use(['http','mongo', 'yauh:turfjs'], 'server');
  api.use(['minimongo', 'mongo-livedata'], 'client');
  api.addFiles('both/api.js');
  api.addFiles([
    'server/utils.js',
    'server/cache.js',
    'server/overpass.js',
    'server/api.js'
  ], 'server');
  api.addFiles(['tests/test.js'], 'client');
});
