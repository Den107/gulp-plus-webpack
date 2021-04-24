const { src, dest, watch, parallel, series } = require('gulp'),
  scss = require('gulp-sass'),
  concat = require('gulp-concat'),
  browserSync = require('browser-sync').create(),
  autoprefixer = require('gulp-autoprefixer'),
  imagemin = require('gulp-imagemin'),
  del = require('del'),
  webpack = require('webpack-stream'),
  htmlmin = require('gulp-htmlmin');

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'src/'
    }
  });
}

function cleanDist() {
  return del('dist');
}

function images() {
  return src('src/images/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest('dist/images'));
}

function scripts() {
  return src('src/js/main.js')
    .pipe(webpack({
      output: {
        filename: 'bundle.js'
      },
      mode: 'development',
      resolve: {
        extensions: ['.js', '.json'],
      },
      optimization: {
        splitChunks: {
          chunks: 'all'
        }
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: [{
              loader: "babel-loader",
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-proposal-class-properties']
              }
            }]
          },
        ]
      }
    }))
    .pipe(dest('src/js'))
    .pipe(browserSync.stream());
}

function styles() {
  return src('src/scss/style.scss')
    .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(concat('style.min.css'))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 version'],
      grid: true
    }))
    .pipe(dest('src/css'))
    .pipe(browserSync.stream());
}

function build() {
  return src([
    'src/css/style.min.css',
    'src/fonts/**/*'
  ], { base: 'src' })
    .pipe(dest('dist'));
}
function buildHtml() {
  return src(['src/*.html'])
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist'));
}
function buildJs() {
  return src([
    'src/js/main.js'
  ], { base: 'src' })
    .pipe(webpack({
      output: {
        filename: 'bundle.js'
      },
      mode: 'production',
      resolve: {
        extensions: ['.js', '.json'],
      },
      optimization: {
        splitChunks: {
          chunks: 'all'
        }
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: [{
              loader: "babel-loader",
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-proposal-class-properties']
              }
            }]
          },
        ]
      }
    }))
    .pipe(dest('dist/js'));
}

function watching() {
  watch(['src/scss/**/*.scss'], styles);
  watch(['src/js/main.js'], scripts);
  watch(['src/*.html']).on('change', browserSync.reload);
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;
exports.buildJs = buildJs;
exports.buildHtml = buildHtml;


exports.build = series(cleanDist, images, build, buildJs, buildHtml);
exports.default = parallel(styles, scripts, browsersync, watching);

