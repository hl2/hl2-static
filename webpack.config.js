const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

module.exports = {
    context: __dirname,
    devtool: 'cheap-eval-source-map',
    entry: './src',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'index.js'
    },
    module: {
        rules: [

            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [

                    {
                        loader: 'file-loader',
                        options: {
                            context: 'src',
                            name: '[path][name].[ext]'
                        }
                    },
                    {
                      loader: 'image-webpack-loader',
                      options: {
                        optimizationLevel: 7,
                        interlaced: false,
                      },
                    },
                ]
            },
            {
                test: /\.html$/i,
                use: [

                  {
                    loader: 'html-loader',
                  },
                ]
            },
        ]
    },
    plugins: [
      new FaviconsWebpackPlugin('./src/favicon.png'),
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
    ],
};
