var path = require('path'),
        HTMLWebpackPlugin = require('html-webpack-plugin'),
        ExtractTextPlugin = require('extract-text-webpack-plugin'),
        webpack = require('webpack'),
        polyfill = require('es6-promise').polyfill()
var extractPlugin = new ExtractTextPlugin({
    filename: './bundle.styles.css'
})


module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: `./js/index.js`, // main JS file for application
    output: {
        path: `${__dirname}/dist`, // defining output path for build files
        filename: 'js/[name].bundle.js' // defining naming convention for bundled dist file
    },
    module: {
        rules : [
            // write code for the future, but make it compatible for the past
            {
                test: /\.(js|json)$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {
                    presets: ["env", "es2015", 'stage-2'] // convert everything to ES2015
                } 
            },
            // want to bundle your CSS files? i got u fam
            {
                test: /\.css/,
                use: extractPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader']
                })
            },
            {
                test: /\.(png|gif)$/,
                use: [{
                    loader: "file-loader",
                    options: {
                        name: "img/[name].[ext]",
                        limit: 1000
                    }
                }]
            },
            {
                test: require.resolve('imports-loader'),
                use : "imports-loader?this=>window"
            }
        ]
    },
    watch: true,
    devServer: {
        // configuration of server that will run upon npm start command
        contentBase: path.resolve(__dirname, 'src'),
        port: 9000
    },
    plugins: [
        new HTMLWebpackPlugin({
            title: 'Custom Template',
            template: 'index.html',
            hash: true
        }),
        extractPlugin,
        new webpack.ProvidePlugin({
            "Promise": "imports-loader?this=>global!exports-loader?global.Promise!es6-promise",
            "fetch": "imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch"
        })
    ]
};