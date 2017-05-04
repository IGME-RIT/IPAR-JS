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
		sass: {
			main: {
				files: [{
					expand: true,
					cwd: 'src/',
					src: ['assets/css/*.scss'],
					dest: 'build/',
					ext: '.css',
				}]
			},
		},
		uglify: {
			main: {
				files: [
					{
						expand: true,
						cwd: 'temp',
						src: ['*.js'],
						dest: 'build/assets/js/',
						ext: '.min.js',
						extDot: 'first'
					},
				],
			},
		},
	});

	// load npm tasks
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-sass');

	// load our tasks
	grunt.loadTasks('./tasks');

	// updates src files, excludes static files
	grunt.registerTask('default', ["copy:main", "sass", "browserify-dynamic", "uglify"]);

	// cleans build and temp directories, copies all files
	grunt.registerTask('build-clean', ["clean", "copy", "sass", "browserify-dynamic", "uglify"]);
};
