var path = require('path');

var Config = require('webpack-config').Config;


module.exports = new Config().merge({
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, '../src'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.less$/,
                include: path.resolve(__dirname, '../styles'),
                use: ['style-loader', 'css-loader', 'less-loader']
            }
        ]
    }
});
