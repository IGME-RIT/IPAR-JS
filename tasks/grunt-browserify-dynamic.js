// Dynamically generates browserify configurations for directories in src/assets/js

module.exports = function(grunt) {
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
};
