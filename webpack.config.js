const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const copyWebpackPlugin = require("copy-webpack-plugin")

module.exports = (env) => {
    let devtool, mode, stats,
        isProd = env.production !== undefined && env.production === true;
    if (isProd) {
        devtool = 'hidden-source-map';
        mode = 'production';
        stats = 'none';
    } else {
        devtool = 'eval';
        mode = 'development';
        stats = 'minimal';
    }
    return {
        devtool, mode, stats,
        entry: path.resolve(__dirname, 'src'),
        output: {
            filename: 'main.js',
            path: path.resolve(__dirname, 'dist'),
        },
        devServer: {
            contentBase: path.resolve(__dirname, 'dist'),
            open: true,
            quiet: true
        },
        module: {
            rules: [
                // Babel
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                // Handlebars
                {
                    test: /\.hbs$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "handlebars-loader",
                            options: {
                                partialDirs: path.resolve(__dirname, "./src/components"),

                            }
                        }
                    ],
                },
                // Scss
                {
                    test: /\.s[ac]ss$/i,
                    exclude: /node_modules/,
                    use: [
                        !isProd
                            ? 'style-loader'
                            : MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader'
                    ]
                },
                // Files loader 
                // more infor https://webpack.js.org/loaders/file-loader/
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    exclude: /node_modules/,
                    use: [
                        'file-loader',
                    ],
                    type: 'asset/resource'
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    exclude: /node_modules/,
                    use: [
                        'file-loader',
                    ],
                    type: 'asset/inline'
                }
            ]
        },
        plugins: [
            // Pluging for combining the html and scripts and style links
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'src/index.hbs'),
                filename: "index.html"
            }),
            new CleanWebpackPlugin({
                cleanStaleWebpackAssets: false
            }),
            new copyWebpackPlugin({
                patterns: [{ from: "./public", to: "./" }]
            }),
            new ESLintWebpackPlugin(),
            new FriendlyErrorsWebpackPlugin({
                compilationSuccessInfo: {
                    messages: ['The application is running here http://localhost:8080']
                }
            }),
            new MiniCssExtractPlugin()
        ]
    }
}