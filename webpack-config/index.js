var path = require('path');

var WebpackConfig = require('webpack-config');


module.exports = new WebpackConfig()
    .extend(path.resolve(__dirname, './loaders.js'))
    .merge({
        context: path.resolve(__dirname, '..'),
        entry: {
            client: path.resolve(__dirname, '../src/bootstrap')
        },
        output: {
            path: path.join(__dirname, '../dist'),
            filename: 'tagging.js',
            library: 'tagging'
        },
        externals: [{
            'cudl': 'var cudl'
        }]
    });
