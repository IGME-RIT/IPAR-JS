module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: {
    	    src: ['build', 'temp']
      }
    },
    copy: {
      main: {
        files: [{
          expand: true,
          src: ['.htaccess', '*.php', '*.html', 'Cases/**/*', 'CasesW/**/*', 'files/**/*', 'js/**/*', 'assets/json/**/*', 'assets/php/**/*', 'assets/css/**/*', 'assets/fonts/**/*', 'assets/html/**/*', 'assets/img/**/*', 'assets/js/**/*', 'assets/workshop/**/*', 'assets/media/**/*', 'ipar/.htaccess', 'ipar/resource/*', 'ipar/image/*', 'ipar/*.html', 'favicon.ico', 'ipar/*.php', 'ipar/*.iparw', 'ipar/game/*.html', 'ipar/game/*.php', 'ipar/game/*.iparw', 'ipar/editor/*.html', 'ipar/editor/*.iparw', 'ipar/editor/*.php', 'ipar/editor/.htaccess', 'ipar/login/*.html', 'ipar/login/*.php', 'ipar/reader/*.html', 'ipar/reader/*.php', 'ipar/*.md', 'ipar/css/**/*', 'ipar/img/**/*', 'ipar/lib/**/*', 'ipar/admin/*','ipar/admin/.htaccess', 'php-markdown/**/*'],
          dest: 'build/',
          filter: 'isFile'
        }]
      },
    },
    watch: {
        // TODO: reenable this and figure out how to properly fix warnings -ntr
      js: {
        files: [
          ['ipar/game/js/**/*.js', 'ipar/editor/js/**/*.js', 'ipar/reader/js/**/*.js'],
         'Gruntfile.js'
         ],
       tasks: ['browserify:game', 'uglify:game', 'browserify:editor', 'uglify:editor', 'browserify:reader', 'uglify:reader']
     },
      other: {
          files: ['ipar/.htaccess', 'ipar/resource/*', 'ipar/image/*', 'ipar/*.html', 'favicon.ico', 'ipar/*.php', 'ipar/*.iparw', 'ipar/game/*.html', 'ipar/game/*.iparw', 'ipar/editor/*.html', 'ipar/editor/*.iparw', 'ipar/editor/*.php', 'ipar/reader/*.html', 'ipar/login/*.html', 'ipar/login/*.php', '*.md', 'ipar/css/**/*', 'ipar/img/**/*', 'ipar/lib/**/*', 'ipar/admin/*'],
          tasks: ['copy']
      },
      livereload: {
        files: ['build/**/*'],
        options: {
          livereload: true
        }
      }
    },
    browserify: {
      game: {
    	  src: ['ipar/game/js/**/*.js'],
          dest: 'temp/ipar/game.js',
          options: {
              browserifyOptions: {
                  debug: true
              }
          }
      },
      devgame: {
    	  src: ['ipar/game/js/**/*.js'],
          dest: 'build/ipar/game/game.min.js',
          options: {
              browserifyOptions: {
                  debug: true
              }
          }
      },
      editor: {
    	  src: ['ipar/editor/js/**/*.js'],
  	    dest: 'temp/ipar/editor.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      },
      deveditor: {
    	  src: ['ipar/editor/js/**/*.js'],
  	    dest: 'build/ipar/editor/editor.min.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      },
      reader: {
    	  src: ['ipar/reader/js/**/*.js'],
  	    dest: 'temp/ipar/reader.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      },
      devreader: {
    	  src: ['ipar/reader/js/**/*.js'],
  	    dest: 'build/ipar/reader/reader.min.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      }
    },
    uglify: {
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
    },
    php: {
    	dist: {
    		options: {
	          open: true,
	          base: 'build'
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

  grunt.registerTask('default', ["clean", "copy:main", "browserify:game", "uglify:game", "browserify:editor", "uglify:editor", "browserify:reader", "uglify:reader", "php", "watch"]);
  grunt.registerTask('dev-deploy', ["clean", "copy:main", "browserify:devgame", "browserify:deveditor", "browserify:devreader"]);
  grunt.registerTask('deploy', ["clean", "copy:main", "browserify:game", "uglify:game", "browserify:editor", "uglify:editor", "browserify:reader", "uglify:reader"]);
};
