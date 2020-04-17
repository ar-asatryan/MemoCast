'use strict';

const gulp = require('gulp'),
    sass = require('gulp-sass'),
    concatCss = require('gulp-concat-css'),
    cleanCSS = require('gulp-clean-css'),
    jsmin = require('gulp-jsmin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    del = require('del');

gulp.task('clear', function () {
    return del([
        './.tmp',
        './dist'
    ]);
});

gulp.task('css-lib', function () {
    return gulp.src(['./.tmp/**/*.css',
        './bower_components/growl/stylesheets/jquery.growl.css',
        './bower_components/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css',
        './bower_components/vjs-resolution-switcher/lib/videojs-resolution-switcher.css',
        './bower_components/select2/dist/css/select2.css'
        ])
        .pipe(concatCss('lib.css'))
        .pipe(cleanCSS())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('css-lib-admin', ['bootstrap'], function () {
    return gulp.src(['./.tmp-admin/**/*.css',
        './bower_components/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css',
        './bower_components/select2/dist/css/select2.css'
        ])
        .pipe(concatCss('lib.admin.css'))
        .pipe(cleanCSS())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/css'));
});


gulp.task('bootstrap', function () {
    return gulp.src('./bower_components/bootstrap/scss/bootstrap.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./.tmp-admin/css'));
});

gulp.task('sass', function () {
    return gulp.src('./sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(concatCss('bundle.css'))
      .pipe(cleanCSS())
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('./dist/css'));
});

gulp.task('css-material', function () {
    return gulp.src('./material/sass/material-kit.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('video-js', function () {
    return gulp.src('./bower_components/video.js/src/css/video-js.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./.tmp/css'));
});

gulp.task('js-lib', function () {
    return gulp.src([
        './bower_components/handlebars/handlebars.js',
        './bower_components/growl/javascripts/jquery.growl.js',
        // './bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.js',
        './bower_components/jquery-validation/dist/jquery.validate.js',
        './src/client/libraries/jQuery-Autocomplete/dist/jquery.autocomplete.js',
        // video js
        // './bower_components/video.js/dist/video.js',
        // './bower_components/video.js/dist/ie8/videojs-ie8.js',
        './scripts/lib/video.js.chromecast.js',
        './bower_components/vjs-resolution-switcher/lib/videojs-resolution-switcher.js',
        './bower_components/select2/dist/js/select2.js',
        './bower_components/tether/dist/js/tether.js'
        ])
        .pipe(concat('lib.js'))
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('js-lib-admin', function () {
    return gulp.src([
        './bower_components/jquery/dist/jquery.js',
        './bower_components/tether/dist/js/tether.js',
        './bower_components/bootstrap/dist/js/bootstrap.js',
        './bower_components/handlebars/handlebars.js',
        './bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.js',
        './bower_components/jquery-validation/dist/jquery.validate.js',
        './src/client/libraries/jQuery-Autocomplete/dist/jquery.autocomplete.js',
        './bower_components/select2/dist/js/select2.js',
        './bower_components/datatables.net/js/jquery.dataTables.js'
        ])
        .pipe(concat('lib.admin.js'))
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('js-bundle', function () {
    return gulp.src([
        './scripts/memocast.js',
        './scripts/templates.js',
        './scripts/back.on.top.js',
        './scripts/autocomplete.js',
        './scripts/video-title-popover.js',
        './scripts/form.validation.js',
        './scripts/io.js',
        './scripts/settings.js',
        './scripts/comments.js',
        './scripts/feed.js'
        ])
        .pipe(concat('bundle.js'))
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('css', function () {
    gulp.start('css-lib', 'css-lib-admin', 'sass', 'css-material');
});

gulp.task('js', function () {
    // gulp.start('js-lib');
    // gulp.start('js-bundle');
    gulp.start('js-lib', 'js-bundle', 'js-lib-admin');
});

gulp.task('watch', ['default'], function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
  gulp.watch('./bower_components/video.js/**/*.scss', ['css-lib', 'css-lib-admin']);
  gulp.watch('./scripts/**/*.js', ['js-bundle']);
  gulp.watch('./material/sass/**/*.scss', ['css-material']);
});

gulp.task('default', function() {
    gulp.start('js', 'css');
});
