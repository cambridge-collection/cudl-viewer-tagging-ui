var path = require('path');

var WebpackConfig = require('webpack-config');


module.exports = new WebpackConfig().merge({
    module: {
        loaders: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, '../src'),
                loader: 'babel'
            },
            {
                test: /\.less$/,
                include: path.resolve(__dirname, '../styles'),
                loader: 'style-loader?sourceMap!css-loader?sourceMap!less-loader?sourceMap'
            }
        ]
    }
});
