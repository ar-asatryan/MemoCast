var gulp = require('gulp');
var args = require('yargs').argv;
var del = require('del');
var path = require('path');
var config = require('./gulp.config')();

var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('styles', ['clean-styles'], function () {
    log('Compiling LESS --> CSS');
    return gulp.src(config['less-src'])
        .pipe($.if(args.verbose, $.print()))
        .pipe($.plumber())
        .pipe($.less())
//        .pipe($.autoprefixer())
//        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe($.concat('styles.css'))
        .pipe(gulp.dest(config['less-dest']));
});

gulp.task('clean-styles', function() {
    var files = config['tmp'] + '**/*.css';
    clean(files);
});

gulp.task('vet', function() {
    log('JSHINT and JSCS code verification');
    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('less-watcher', function() {

  gulp.watch(config['less-src'], ['styles']);

});

gulp.task('default', function() {
    gulp.start('less-watcher', 'styles');
});


/////////////

function clean(path) {
    $.util.log($.util.colors.red('Cleaning: ' + path));
    del(path);
}

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}