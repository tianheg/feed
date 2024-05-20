const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));

const dest_folders = ["./static"];

async function buildStyles() {
	dest_folders.map((elem) => {
		return gulp
			.src("./static/*.scss")
			.pipe(sass.sync({ outputStyle: "compressed" }).on("error", sass.logError))
			.pipe(gulp.dest(elem));
	});
}

function watch() {
	return gulp.watch("./static/*.scss", buildStyles);
}

exports.css = buildStyles;
exports.watch = watch;
