var path = require('path'),
        HTMLWebpackPlugin = require('html-webpack-plugin'),
        ExtractTextPlugin = require('extract-text-webpack-plugin')
<<<<<<< HEAD
        
var extractPlugin = new ExtractTextPlugin({
    filename: './bundle.styles.css'
})
=======

    let extract = new ExtractTextPlugin({
        filename: './bundle.styles.css'
    })
>>>>>>> webpack config
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
<<<<<<< HEAD
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader']
=======
                test: /\.css/,
                use: extract.extract({
                    fallback: 'style-loader',
                    use: ['css-loader']
                })
>>>>>>> webpack config
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
<<<<<<< HEAD
        extractPlugin
=======
        extract
>>>>>>> webpack config
    ]
};