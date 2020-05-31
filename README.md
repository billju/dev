# DEV

## 寫網頁這麼簡單，為什麼沒事還要打包
不管是用傳統vallina JS，還是最新最潮es6~es10的語法，都有語法編譯、相容性、檔案優化的問題，您可能聽過pug(前身jade), sass, scss, babel, polyfill，這些東西可以讓寫網頁變得簡潔有力、易於快速修改、解決跨瀏覽器的問題，甚至避免讓辛苦寫好的code輕易被盜用，然而每次修改都要個別針對這些檔案變成可執行的html, css, js，實在是花太多功夫了，所以有了打包工具，從之前pipeline風格的gulp、近來架構化的webpack，甚至到最新的parcel連寫設定檔的功夫都免去，因此打包這個動作就流行起來了，以下介紹目前最廣泛使用的webpack。

## 啥是webpack
![](https://i.imgur.com/gzG9Gdl.png)
取自 https://webpack.js.org/ ，如上圖所示，我們的目標是要優化雜亂的檔案

過去處理一個個檔案就要一個個的去打指令，gulp的pipe功能讓一個指令可以輪流觸發這些動作；而webpack更是將這些處理模式有個架構，長得像這樣
| entry | module | plugins | output |
|-|-|-|-|
| 進入點 | 各類型檔案的前置處理 | 額外插件的後製 | 輸出點 |
:::info
**這個架構看起來夠直覺，讓我們先新增一個資料夾叫webpack-test來試試**
```bash=
mkdir webpack-test
cd webpack-test
npm init -y
npm install --save-dev webpack webpack-cli
```
**新增webpack.config.js**，讓webpack知道檔案在哪裡、要怎麼吃以及要吐到哪邊
```javascript=
const path = require('path'); // 用來確保webpack不會吐在奇怪的地方
module.exports = {
    entry: './src/index.js',  // 這個檔案import了所有css和js
    module: {                 //放一些正規表達式和模組名稱(記得先安裝)
        rules: []
    },
    plugins: {                //放一些類別(class)
    
    },
    output: {                 // 吐出來的檔案預設在dist
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].min.js' // 預設吐出來後把[name]換成main
    }
}
```
**修改package.json的scripts**
(要注意新版的webpack不設定mode會跳出警告)
```json=
{
  "name": "webpack-test",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "devDependencies": {
    "webpack": "^4.29.6",
    "webpack-cli": "^3.2.3",
  },
  "scripts": {
    "build": "webpack --mode production --config webpack.config.js",
  },
  "author": "chuboy",
  "license": "ISC",
}
```
:::
:::info
**把專案丟到src資料夾，讓資料夾長這樣**
* webpack-test
    * node_modules/
    * src/
        * css/
            * bootstrap.css
        * index.html
        * index.js
    * package-lock.json
    * package.json
    * webpack.config.js
:::
:::info
**輸入`npm run build`開始打包，然後dist資料夾就變出來了**
* webpack-test
    * dist/
        * main.js

:::
:::danger
咦怎麼只有吐出main.js，不是說webpack很方便嗎，怎麼感覺有點複雜?
:::
:::info
沒關係只是因為我們還沒有加入module和plugins，它是有點小複雜，就讓我們繼續看下去。
:::
## 可不可以邊寫邊自動打包
:::danger
剛剛如果每次改檔案都要再打一次`npm run build`太麻煩了吧，有沒有像vscode的[LiveServer](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)插件那種好東西，每次按ctrl+S都可以自動更新?
:::
:::info
答案是有的，它叫做webpack-live-server
**修改package.json**
`npm i -D webpack-live-server`
```json=
{
    "devDependencies": {
        ...,
        "webpack-dev-server": "^3.2.1"
    }
    "scripts": {
        "start": "webpack-dev-server --mode development --config webpack.config.js",
        "build": "webpack --mode production --config webpack.config.js",
    },
}
```
**修改webpack.config.js**
```javascript=
module.exports = {
    ...,
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    }
}
```
**終端機**
`npm run start`
```bash=
i ｢wds｣: Project is running at http://localhost:9000/
i ｢wds｣: webpack output is served from /
i ｢wds｣: Content not from webpack is served from C:\Users\ChuBoy\Desktop\webpack-test\dist
i ｢wdm｣: Hash: 8b2111a5fca1e0ccf7b2
```
ctrl+左鍵點擊http://localhost:9000/ 就可以進入網頁
而HTML處理最複雜，以下分別按照js>css>html說明如何處理
:::
## JS & Babel
> 隨著Javascript的語法快速更新，es6, es7的新潮語法讓寫code更具易讀性，像是寫個類別
```javascript=
let [a,b] = [1,2]
const style = {
    ...defaultStyle,
    color: 'dodgerblue'
}
class fileHandler{
    constructor(inputElement){
        this.inputElement = inputElement
    }
    async readFile(file){ // async一定得放在function外且回傳Promise
        const reader = new FileReader()
        return new Promise((resolve,reject)=>{
            reader.onload = ()=>{
                resolve(reader.result)
            }
            reader.readAsArrayBuffer(file)
        })
    }
    getBlob(file){
        const blob = await this.readFile(file) // 異步執行完才會換下一行
        return blob
    }
}
```
:::info
很可惜的是，這些好用的新語法，IE瀏覽器幾乎一概看不懂，因此為了要把語法都編譯成舊版瀏覽器可讀的格式，babel是最為流行的解決方案
**修改webpack.config.js**
`npm i -D @babel/core @babel/preset-env babel-loader`
```javascript=
module.exports = {
    ...,
    module: {
        rules: [ //webpack會用正規表達式去找這個檔案，/.js$/代表檔名尾端是.js
            { test: /.js$/, use: ['babel-loader'] }
        ]
    }
}
```
:::
:::danger
等等，打包出來的東西根本只是複製貼上，沒有變啊
:::
:::info
喔因為剛剛還沒加進babel設定檔，所以要把use改成物件並增加options.presets

**修改webpack.config.js**
```javascript=
module.exports = {
    ...,
    module: {
        rules: [
             {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
        ]
    }
}
```
附帶一提，webpack本身不會清掉dist裡面的舊檔案，也許是怕會刪錯東西，因此要加個插件
`npm i -D clean-webpack-plugin`
```javascript=
const CleanWebpackPulgin = require('clean-webpack-plugin')
module.exports = {
    ...,
    plugins: [
        new CleanWebpackPlugin(),
    ]
}
```
:::
:::danger
我在IE上測試網頁還是怪怪的耶，有時候甚至一片空白。
:::
:::info
除了語法問題，原生API也不是每個瀏覽器都通用，這時候最強工具Polyfill就要出馬，能讓不支援API的瀏覽器也能正常瀏覽(但功能還是不一定會有)。
`npm i -D @babel/polyfill`
```javascript=
module.exports = {
    entry: ['@babel/polyfill','./src/index.js'],
}
```
再附帶一提，如果想要讓打包後的js不讓別人輕易盜取，可用terser-webpack-plugin
`npm i -D terser-webpack-plugin`
```javascript=
const TerserPlugin = require('terser-webpack-plugin')
module.exports = {
    plugins: [
        new TerserPlugin(),
    ]
}
```
:::
:::danger
如果我的HTML長這樣，要保留這些js檔有解嗎?
```html
<body>
    ...
    <script src="js/skrollr.js"/>
    <script src="js/textFx.js"/>
    <script src="js/chart.js"/>
</body>
```
:::
:::info
這種狀況就要改entry的設定，讓webpack一次吐一堆js檔，其中output的[name]值會對應到entry的自定義的命名。
```javascript=
module.exports = {
    entry: {
        skrollr: './src/js/skrollr.js',
        textFx: './src/js/textFx.js',
        chart: './src/js/chart.js'
    },
    ...,
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    }
}
```
:::
## Css/Sass/Scss
新語法有一個我覺得比較不直觀的地方，就是加入css要在js中設定檔案位置，然後從html中移除
`<link href="css/bootstrap.css" type="stylesheet">`，而且需要特定的loader與plugin來編譯，最後webpack才會自動加入`<link>`標籤，導入方式如下
:::info
**修改./src/index.js**
```javascript=
import 'css/bootstrap.css'
import 'css/index.css'
import Chart from 'chart.js'
...
```
**修改webpack.config.js**
`npm i -D css-loader mini-css-extract-plugin`
```javascript=
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    'css-loader'
                ]
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({filename: '[name].css'})
    ]
}
```
:::
:::danger
可是瑞凡，我用SASS
:::
:::info
這還不簡單
**修改webpack.config.js**
`npm i -D node-sass sass-loader`
```javascript=
module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    'css-loader','sass-loader'
                ]
            },
        ]
    },
}
```
如果要優化css的話，use的陣列再加一項css的前處理器
`npm i -D postcss-loader autoprefixer cssnano`
```javascript=
{
    loader: 'postcss-loader',
    options: {
    plugins: ()=>([
        require('autoprefixer'), // 自動添加 -webkit- -moz- -ms- 這類東西
        require('cssnano') // css最小化
    ])
}
```
:::
## Html/Pug
:::info
html因為會包含靜態檔案、css、js，也因此處理的時候會有非常多情況與選擇性。
`npm i -D html-webpack-plugin`
```javascript=
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    ...,
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html', //輸入html
            filename: 'index.html', //打包完的名稱
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
    ]
}
```
:::
:::danger
筆者不是很愛用PUG嗎?
:::
:::info
`npm i -D html-loader pug-html-loader`
```javascript=
module.exports = {
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: ['html-loader','pug-html-loader']
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.pug', //改成pug
            filename: 'index.html', //output name
        }),
    ]
}
```
:::
:::danger
為什麼我的html中
<input type="file" onchange="handleFile(event.target.files)"/>
handleFile這個變數會不見
:::
:::info
因為打包後會重新更改變數名稱，很可惜沒有一個套件可以自動解決，其中一個用硬派解法是在entry的js中將函式定義為window的全域變數。
```javascript=
function handleFile(){...}
// 將其定義為window的函數
window.handleFile = handleFile
```
:::
:::danger
靜態檔案怎麼處理，我的圖片命名很隨便，不想被看到可以自動換名稱嗎?
:::
:::info
把[name]改成[hash]就可以囉
`npm i -D file-loader`
```javascript=
module.exports = {
    module: {
        rules: [
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
        ]
    },
}
```
:::
## 完整範例
**package.json**
```json=
{
  "name": "webpack-test",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "dependencies": {
    "bootstrap": "^4.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.10.1",
    "@babel/polyfill": "^7.10.1",
    "@babel/preset-env": "^7.10.1",
    "autoprefixer": "^9.8.0",
    "babel-loader": "^8.1.0",
    "clean-webpack-plugin": "^3.0.0",
    "css-loader": "^2.1.0",
    "cssnano": "^4.1.10",
    "file-loader": "^3.0.1",
    "html-loader": "^0.5.5",
    "html-webpack-plugin": "^3.2.0",
    "mini-css-extract-plugin": "^0.5.0",
    "node-sass": "^4.11.0",
    "postcss-loader": "^3.0.0",
    "pug-html-loader": "^1.1.5",
    "sass-loader": "^7.1.0",
    "terser-webpack-plugin": "^3.0.2",
    "webpack": "^4.29.6",
    "webpack-cli": "^3.2.3",
    "webpack-dev-server": "^3.2.1"
  },
  "scripts": {
    "start": "webpack-dev-server --mode development --config webpack.config.js",
    "build": "webpack --mode production --config webpack.config.js",
  },
  "author": "chuboy",
  "license": "ISC",
}
```
**webpack.config.js**
```javascript=
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
module.exports = {
    entry: ['@babel/polyfill','./intro/js/index.js'],
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: ['html-loader','pug-html-loader']
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
                    }
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
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({ filename: '[name].css' }),
        new TerserPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.pug',
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
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].min.js',
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    }
}
```
P.S.感謝[Magic Len大大的好文](https://magiclen.org/webpack/)，讓我的學習之路有解。
P.S.如果是Vue的使用者，不用遲疑就用Parcel(預設支援Vue)