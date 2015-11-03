var path = require('path');

var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    context: __dirname,
    entry: {
        client: './src/bootstrap'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'tagging.js',
        library: 'tagging'
    },
    externals: [
        {
            'cudl': 'var cudl'
        }
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                loader: 'babel'
            },
            {
                test: /\.less$/,
                include: path.resolve(__dirname, 'styles'),
                loader: ExtractTextPlugin.extract(
                    "style-loader", "css-loader!less-loader")
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin("tagging.css", { allChunks: true })
    ]
};
