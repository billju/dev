const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const dir = 'lightGIS'
module.exports = {
    entry: ['@babel/polyfill',`./${dir}/js/index.js`],
    module: {
        rules: [
            {
                test: /\.pug$/,
                oneOf: [
                    {
                        resourceQuery:/^\?vue/, 
                        use: 'pug-plain-loader'
                    },
                    {
                        use:['html-loader','pug-html-loader']
                    }
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    'css-loader','sass-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: ()=>([
                                require('autoprefixer'),
                                require('cssnano')
                            ])
                        }
                    },
                ]
            },
            {
                test: /\.js$/,
                exclude: '/node_modules/',
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: {
                    loader:'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: './assets/',
                        publicPath: './assets/'
                    }
                }
            },
            {
                test: /\.(eot|woff|woff2|[ot]tf)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: './fonts/',
                        publicPath: './fonts/'
                    }
                }
            },
        ]
    },
    plugins: [
        // new CleanWebpackPlugin(),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({ filename: '[name].css' }),
        new TerserPlugin(),
        new HtmlWebpackPlugin({
            template: `./${dir}/index.pug`,
            filename: 'index.html',
            minify: {
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                minifyCSS: true,
                minifyJS: true,
                sortAttributes: true,
                useShortDoctype: true
            },
        }),
    ],
    resolve: { 
        alias: { 
            'vue': 'vue/dist/vue.js' 
        } 
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].min.js',
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    },
}