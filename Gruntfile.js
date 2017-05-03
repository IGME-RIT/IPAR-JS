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
		watch: { // watch doesn't seem to work on wsl :(
			// watch for changes in scripts that need to be minified
			scripts: {
				files: ['src/**/*.js'],
				tasks: ['browserify','uglify'],
				options: {
					spawn: false,
				},
			},

			// watch for changes in direct copy files	
			src: {
				files: ['src/**/*.php', 'src/**/*.html', '**/*.css', '**/.htaccess'],
				tasks: ['copy:main'],
			},

			// watch for configuration changes
			conf: {
				files: ['Gruntfile.js'],
				options: {
					reload: true
				},
			},
		},
		uglify: {
			main: {
				files: [
					{
						expand: true,
						src: ['temp/*.js'],
						dest: 'build/assets/js/',
						ext: '.min.js',
						extDot: 'first'
					},
				],
			},
		},
	});

	// register task to dynamically browserify js files by directory
	grunt.registerTask("browserify-dynamic", "Iterates over directories in src/assets/js, and browserifies their contents into one file named after the directory.", function() {
		// read all directories from src/assets/js
		grunt.file.expand("./src/assets/js/*").forEach(function(dir) {
			// get the current browserify config
			var browserify = grunt.config.get('browserify') || {};

			// get the subdirectory name
			var dirs = dir.split('/');
			dir = dirs[dirs.length - 1];

			// set the config for this directory
			browserify[dir] = {
				src: ['src/assets/js/'+dir+'/**.js'],
				dest: 'temp/' + dir + '.js',
				options: {
					browserifyOptions: {
						debug: true
					}
				}
			}

			// save the new configuration
			grunt.config.set('browserify', browserify);
		});

		// run browserify
		grunt.task.run('browserify');
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
