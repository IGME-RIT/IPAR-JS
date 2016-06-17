module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: {
    	    src: ['build', '!build/.git/**/*', '!build/resource/*', '!build/image/*']
      }
    },
    copy: {
      main: {
        files: [{
          expand: true,
          src: ['resource/*', 'image/*', '*.ico', '*.html', 'temp/*.js', '*.ipar', 'game/*.html', 'game/*.ipar', 'editor/*.html', 'editor/*ipar', '*.md', 'css/**/*', 'img/**/*', 'lib/**/*'],
          dest: 'build/',
          filter: 'isFile'
        }]
      }
    },
    watch: {
      js: {
        files: [
          ['game/js/**/*.js', 'editor/js/**/*.js'],
          'Gruntfile.js'
        ],
        tasks: ['browserify:game', 'browserify:editor']
      },
      other: {
          files: ['resource/*', 'image/*', '*.html', '*.ico', 'temp/*.js', '*.ipar', 'game/*.html', 'game/*.ipar', 'editor/*.html', 'editor/*ipar', '*.md', 'css/**/*', 'img/**/*', 'lib/**/*'],
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
    	  src: ['game/js/**/*.js'],
          dest: 'build/game/temp/bundle.js',
          options: {
              browserifyOptions: {
                  debug: true
              }
          }
      },
      editor: {
    	  src: ['editor/js/**/*.js'],
  	    dest: 'build/editor/temp/bundle.js',
  	    options: {
  	        browserifyOptions: {
  	            debug: true
  	        }
  	    }
      }
    },
    uglify: {
      game: {
          src: 'build/game/temp/bundle.js',
          dest: 'build/game/bundle.min.js'
      },
      editor: {
          src: 'build/editor/temp/bundle.js',
          dest: 'build/editor/bundle.min.js'
      },
      convert:{
    	  src: 'build/temp/convert.js',
    	  dest: 'build/convert.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ["clean", "copy", "browserify:game", "uglify:game", "browserify:editor", "uglify:editor", "uglify:convert", "watch"]);
};