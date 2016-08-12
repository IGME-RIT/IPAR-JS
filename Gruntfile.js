module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: {
    	    src: ['ipar', 'temp']
      }
    },
    copy: {
      main: {
        files: [{
          expand: true,
          src: ['resource/*', 'image/*', '*.html','favicon.ico', '*.php', '*.iparw', 'game/*.html', 'game/*.iparw', 'editor/*.html', 'editor/*.iparw', 'editor/*.php', 'login/*.html', 'login/*.php', 'reader/*.html', '*.md', 'css/**/*', 'img/**/*', 'lib/**/*'],
          dest: 'ipar/',
          filter: 'isFile'
        }]
      }
    },
    watch: {
      js: {
        files: [
          ['game/js/**/*.js', 'editor/js/**/*.js', 'reader/js/**/*.js'],
          'Gruntfile.js'
        ],
        tasks: ['browserify:game', 'uglify:game', 'browserify:editor', 'uglify:editor', 'browserify:reader', 'uglify:reader']
      },
      other: {
          files: ['resource/*', 'image/*', '*.html', 'favicon.ico', '*.php', '*.iparw', 'game/*.html', 'game/*.iparw', 'editor/*.html', 'editor/*.iparw', 'editor/*.php', 'reader/*.html', 'login/*.html', 'login/*.php', '*.md', 'css/**/*', 'img/**/*', 'lib/**/*'],
          tasks: ['copy']
      },
      livereload: {
        files: ['ipar/**/*'],
        options: {
          livereload: true
        }
      }
    },
    browserify: {
      game: {
    	  src: ['game/js/**/*.js'],
          dest: 'temp/game.js',
          options: {
              browserifyOptions: {
                  debug: true
              }
          }
      },
      editor: {
    	  src: ['editor/js/**/*.js'],
  	    dest: 'temp/editor.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      },
      reader: {
    	  src: ['reader/js/**/*.js'],
  	    dest: 'temp/reader.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      }
    },
    uglify: {
      game: {
          src: 'temp/game.js',
          dest: 'ipar/game/game.min.js'
      },
      editor: {
          src: 'temp/editor.js',
          dest: 'ipar/editor/editor.min.js'
      },
      reader: {
          src: 'temp/reader.js',
          dest: 'ipar/reader/reader.min.js'
      }
    },
    php: {
    	dist: {
    		options: {
	          open: true,
	          base: 'ipar'
	        }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-php');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ["clean", "copy", "browserify:game", "uglify:game", "browserify:editor", "uglify:editor", "browserify:reader", "uglify:reader", "php", "watch"]);
};
