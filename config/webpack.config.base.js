//基础配置文件

const webpack = require('webpack'); 
const path = require('path'); // nodejs路径模块，用于读取路径
const fs = require('fs'); // nodejs文件模块，用于读取文件

const config = require('./config.js'); // 获取配置

const HTMLWebpackPlugin = require("html-webpack-plugin");// 用于生成html

// 获取html文件名，用于生成入口
const getFileNameList = (path) => {
  let fileList = [];
  let dirList = fs.readdirSync(path);
  dirList.forEach(item => {
    if (item.indexOf('html') > -1) {
      fileList.push(item.split('.')[0]);
    }
  });
  return fileList;
};

let htmlDirs = getFileNameList(config.HTML_PATH);

let HTMLPlugins = []; // 保存HTMLWebpackPlugin实例
let Entries = {}; // 保存入口列表

// 生成HTMLWebpackPlugin实例和入口列表
htmlDirs.forEach((page) => {
  let htmlConfig = {
    filename: `${page}.html`,
    template: path.join(config.HTML_PATH, `./${page}.html`) // 模板文件
  };

  let found = config.ignorePages.findIndex((val) => {
    return val === page;
  });

  if (found === -1) { // 有入口js文件的html，添加本页的入口js和公用js，并将入口js写入Entries中
    htmlConfig.chunks = [page, 'commons'];
    Entries[page] = `./src/js/${page}.js`;
  } else { // 没有入口js文件，chunk为空
    htmlConfig.chunks = [];
  }

  const htmlPlugin = new HTMLWebpackPlugin(htmlConfig);
  HTMLPlugins.push(htmlPlugin);
});

module.exports = {
  context: config.PROJECT_PATH, // 入口、插件路径会基于context查找
  entry: Entries,
  output: {
    path: config.BUILD_PATH, // 打包路径，本地物理路径
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              outputPath:'images/'
            }
          }
        ],
      },
      {
        test:/\.js$/,
        use: [{loader:'babel-loader'}],
        include: [config.SRC_PATH]
      },
      {
        test: /\.(htm|html)$/i,
        use:[{loader: 'html-withimg-loader'}] 
      }
    ]
  },
  plugins: [
    ...HTMLPlugins, // 扩展运算符生成所有HTMLPlugins
    new webpack.ProvidePlugin({
      $: 'jquery'
    })
  ]
};