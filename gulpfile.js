let syntax     = 'sass', // Syntax - .sass or .scss
		fileswatch = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

import pkg from 'gulp'
const { src, dest, parallel, series, watch } = pkg

import browserSync   from 'browser-sync'
import gulpSass      from 'gulp-sass'
import * as dartSass from 'sass'
const  sass          = gulpSass(dartSass)
import postCss       from 'gulp-postcss'
import cssnano       from 'cssnano'
import concat        from 'gulp-concat'
import uglify        from 'gulp-uglify'
import autoprefixer  from 'autoprefixer'
import rsyncModule   from 'gulp-rsync'

function browsersync() {
	browserSync.init({
		server: {
			baseDir: '_site/'
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
		// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
	})
}

function scripts() {
	return src([
		'libs/jquery/dist/jquery.min.js',
		'libs/likely/likely.js',
		'libs/prognroll/prognroll.js',
		'js/common.js', // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	.pipe(uglify()) // Mifify js (opt.)
	.pipe(dest('js'))
	.pipe(dest('_site/js'))
	.pipe(browserSync.stream())
}

function styles() {
	return src([`${syntax}/**/*.${syntax}`])
		.pipe(sass({ 'include css': true }))
		.pipe(postCss([
			autoprefixer({ grid: 'autoplace' }),
			cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
		]))
		.pipe(concat('main.min.css'))
		.pipe(dest('css'))
		.pipe(dest('_site/css'))
		.pipe(browserSync.stream())
}

function rsync() {
	return src('_site/') // Без звёздочек!
		.pipe(rsyncModule({
			root: '_site/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			clean: true, // Mirror copy with file deletion
			include: ['*.htaccess'], // Includes files to deploy
			exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}))
}

function startwatch() {
	watch([`${syntax}/**/*.${syntax}`], { usePolling: true }, styles)
	watch(['js/common.js', 'libs/**/*.js'], { usePolling: true }, scripts)
	watch([`*.{${fileswatch}}`, `_site/**/*.{${fileswatch}}`], { usePolling: true }).on('change', browserSync.reload)
}

export { scripts, styles, rsync }
export let assets = series(scripts, styles)

export default series(scripts, styles, parallel(browsersync, startwatch))
