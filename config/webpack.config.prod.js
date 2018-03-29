const webpackBase = require('./webpack.config.base.js'); // 引入基础配置
const config = require('./config.js'); // 引入配置

const glob = require('glob');
const path = require('path');
const webpack = require('webpack'); // 用于引用官方插件
const webpackMerge = require('webpack-merge'); // 用于合并配置文件
const CleanWebpackPlugin = require('clean-webpack-plugin'); // 用于清除文件夹
const uglifyjs = require('uglifyjs-webpack-plugin');  //压缩代码
// const Purifycss = require("purifycss-webpack"); //清除多余css

const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin'); // 提取css，提取多个来源时，需要实例化多个，并用extract方法

const cssExtracter = new ExtractTextWebpackPlugin({
  filename: './css/[name].[contenthash:8].css', // 直接导入的css文件，提取时添加-css标识
  allChunks: true, // 从所有的chunk中提取，当有CommonsChunkPlugin时，必须为true
});

// const lessExtracter = new ExtractTextWebpackPlugin({
//   filename: './css/[name]-less.[contenthash:8].css', // 直接导入的less文件，提取时添加-less标识
//   allChunks: true,
// });

const webpackProd = {
  output: {
    filename: 'js/[name].[chunkhash:8].bundle.js', // 生产环境用chunkhash
  },
  module: {
    rules: [
      {
        test: /\.css$/, // 生产环境提取css
        include: [config.SRC_PATH],
        use: cssExtracter.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true //css压缩
              }
            }, 'postcss-loader'],
            publicPath: '../', // 默认发布路径会是css，会拼接成css/img/x.png，所以需要重置
        })
      },
      {
        test: /\.less$/, // 生产环境提取css
        include: [config.SRC_PATH],
        use: cssExtracter.extract({
          fallback: 'style-loader',
          use: [{
              loader: 'css-loader',
              options: {
                minimize: true //css压缩
              }
          }, 'postcss-loader', 'less-loader'],
          publicPath: '../', // 默认发布路径会是css，会拼接成css/img/x.png，所以需要重置
        })
      }
    ]
  },
  plugins: [
    cssExtracter,
    // new Purifycss({
    //   paths: glob.sync(path.join(__dirname, 'src/html/*.html'))
    // }),
    new webpack.DefinePlugin({ // 指定为生产环境，进而让一些library可以做一些优化
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.HashedModuleIdsPlugin(), // 生产环境用于标识模块id
    new CleanWebpackPlugin(['./dist/'], {
      root: config.PROJECT_PATH, // 默认为__dirname，所以需要调整
    }),
    new webpack.optimize.CommonsChunkPlugin({ // 抽取公共chunk
      name: 'commons', // 指定公共 bundle 的名称。HTMLWebpackPlugin才能识别
      filename: 'js/commons.[chunkhash:8].bundle.js'
    }),
    new uglifyjs()
  ]
};

module.exports = webpackMerge(webpackBase, webpackProd);