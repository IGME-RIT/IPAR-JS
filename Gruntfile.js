module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build: {
				src: ['build', 'temp']
			}
		},
		copy: {
			// copy non compiled files like .php, .html, etc
			main: {
				expand: true,
				cwd: 'src',
				src: ['**/*.php', '**/*.html', '**/*.css', '**/.htaccess'],
				dest: 'build/'
			},
			// copy static files directly to output
			static: {
				expand: true, 
				cwd: 'static', 
				src: '**', 
				dest: 'build/'
			}
		},
		watch: {
		},
		browserify: {
			// TODO: make this more dynamic so we don't have to add every file manually
			videoplayer: {
				src: ['src/js/player/**/*.js'],
				dest: 'temp/player.js',
				options: {
					browserifyOptions: {
						debug: true
					}
				}
			},
			game: {
				src: ['src/ipar/game/js/**/*.js'],
				dest: 'temp/ipar/game.js',
				options: {
					browserifyOptions: {
						debug: true
					}
				}
			},
			editor: {
				cwd: 'src',
				src: ['src/ipar/editor/js/**/*.js'],
				dest: 'temp/ipar/editor.js',
				options: {
					browserifyOptions: {
						debug: true
					}
				}
			},
			reader: {
				cwd: 'src',
				src: ['src/ipar/reader/js/**/*.js'],
				dest: 'temp/ipar/reader.js',
				options: {
					browserifyOptions: {
						debug: true
					}
				}
			},
		},
		uglify: {
			videoplayer: {
				src: 'temp/player.js',
				dest: 'build/js/player.min.js'
			},
			game: {
				src: 'temp/ipar/game.js',
				dest: 'build/ipar/game/game.min.js'
			},
			editor: {
				src: 'temp/ipar/editor.js',
				dest: 'build/ipar/editor/editor.min.js'
			},
			reader: {
				src: 'temp/ipar/reader.js',
				dest: 'build/ipar/reader/reader.min.js'
			}
		}
});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// updates src files, excludes static files
	grunt.registerTask('default', ["copy:main", "browserify", "uglify"]);

	// cleans build and temp directories, copies all files
	grunt.registerTask('build-clean', ["clean", "copy", "browserify", "uglify"]);
};
