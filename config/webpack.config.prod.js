const webpackBase = require('./webpack.config.base.js'); // 引入基础配置
const config = require('./config.js'); // 引入配置

const glob = require('glob');
const path = require('path');
const webpack = require('webpack'); // 用于引用官方插件
const webpackMerge = require('webpack-merge'); // 用于合并配置文件
const CleanWebpackPlugin = require('clean-webpack-plugin'); // 用于清除文件夹
const Purifycss = require("purifycss-webpack"); //清除多余css

const CopyWebpackPlugin = require('copy-webpack-plugin'); //复制静态文件资源

const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin'); // 提取css，提取多个来源时，需要实例化多个，并用extract方法


const UglifyJsPlugin = require('uglifyjs-webpack-plugin');      //去除开发时的console warning 压缩js代码

const cssExtracter = new ExtractTextWebpackPlugin({
  filename: 'css/[name].[contenthash:8].css', // 直接导入的css文件，提取时添加-css标识
  allChunks: true, // 从所有的chunk中提取，当有CommonsChunkPlugin时，必须为true
});
// const lessExtracter = new ExtractTextWebpackPlugin({
//   filename: './css/[name]-less.[contenthash:8].css', // 直接导入的less文件，提取时添加-less标识
//   allChunks: true,
// });


//purifycss匹配不同文件夹下html  
const purifycssDir = [
  ...glob.sync(path.join(__dirname, '../src/*.html')),
  ...glob.sync(path.join(__dirname, '../src/html/*.html')),
  ...glob.sync(path.join(__dirname, '../src/components/*.html')),
];
console.log(purifycssDir);

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
    new Purifycss({
      paths: purifycssDir,
      minimize: true   //启动purifycss后需要再设置下压缩css
    }),
    new webpack.DefinePlugin({ // 指定为生产环境，进而让一些library可以做一些优化
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.HashedModuleIdsPlugin(), // 生产环境用于标识模块id
    new CleanWebpackPlugin(['./dist/'], {
      root: config.PROJECT_PATH, // 默认为__dirname，所以需要调整
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.PUBLIC_PATH,
        ignore: ['.*']
      }
    ]),
    new UglifyJsPlugin({          //去除console
      uglifyOptions: {
        compress: {
          warnings: false,
          drop_debugger: true,
          drop_console: true
        }
      }
    }),
    // new webpack.optimize.CommonsChunkPlugin({ // 抽取公共chunk
    //   name: 'vendor', // 指定公共 bundle 的名称。HTMLWebpackPlugin才能识别
    //   filename: 'js/vendor.[chunkhash:8].bundle.js'
    // }),
    new webpack.optimize.CommonsChunkPlugin({
      name: ['vendor', 'runtime'],                                 //增加运行文件，修改后打包变动的hash在runtime体现, vendor只提取公共用于缓存
      filename: 'js/[name].[chunkhash:8].bundle.js',
      minChunks: 2,
    }),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'yy',                                         //是否需要再次提取公共js     对应vender minChunks需要设置Infinity，
    //   filename: 'js/yy.[chunkhash:8].bundle.js',          //配合入口设置entry.vender = [第三方]    来分离 第三方  公共js  运行文件
    //   chunks: ['index','page2', 'page1']
    // }),
  ]
};

module.exports = webpackMerge(webpackBase, webpackProd);