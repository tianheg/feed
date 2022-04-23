'use strict'

const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))

let dest_folders = ['./src/tech/static', './src/life/static']

async function buildStyles() {
  dest_folders.map((elem) => {
    return gulp
      .src(`./static/*.scss`)
      .pipe(sass.sync().on('error', sass.logError))
      .pipe(gulp.dest(elem))
  })
}

function watch() {
  return gulp.watch('./**/*.scss', buildStyles)
}

exports.css = buildStyles
exports.watch = watch
