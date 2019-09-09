var gulp = require("gulp");
var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var minify = require("gulp-minify");

gulp.task('build', () => {
  browserify({
    entries: './RsWooCommerce.js',
    debug: true
  })
  .transform(babelify, {presets:['@babel/env']})
  .bundle()
  .pipe( source('./RsWooCommerce.js') )
  .pipe( gulp.dest('./dist') );

  return gulp.src('./dist/RsWooCommerce.js')

});

gulp.task('minify', () => {
  gulp.src('./dist/RsWooCommerce.js')
  .pipe( minify() )
  .pipe(gulp.dest('./dist'));

  return gulp.src('./dist/RsWooCommerce.js')
})