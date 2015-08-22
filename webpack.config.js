var path = require('path');

var ExtractTextPlugin = require("extract-text-webpack-plugin");

var TAGGING_CSS = path.join(__dirname, 'style/tagging.less');

module.exports = {
	context: __dirname,
	entry: {
		client: './src/bootstrap'
	},
	// devtool: 'source-map',
	// stats: {
    //     colors: true,
    //     reasons: true
    // },
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'tagging.js',
		library: 'tagging'
	},
	externals: [
		{
			'jquery': 'var jQuery',
			'cudl': 'var cudl',
			'spin': 'var Spinner'
		}
	],
	module: {
		loaders: [
			{ 
				test: /\.js$/, 
				exclude: /node_modules/,
				loader: require.resolve('babel-loader')
			},
			// { 
				// test: /\.css$/, 
				// loader: "style!css" 
			// },
			// {
                // test: /\.css$/,
                // loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            // }	
		    {
		    	test: /\.less$/,
		     	exclude: TAGGING_CSS,
		     	loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
		    },
		    {
		    	test: /\.json$/,
		    	loader: require.resolve('json-loader')
		    },
		    {
		    	test: /\.node$/,
		    	loader: require.resolve('node-loader')
		    }
		]
	},
    plugins: [
        new ExtractTextPlugin("tagging.css", { allChunks: true })
    ],
    // node: {
    // 	fs: "empty" // fix Cannot resolve module 'fs' problem
    // },
    // resolve: {
    // 	extensions: ['', '.js', '.jsx', '.node']
    // }
};