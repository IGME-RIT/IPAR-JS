module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: ['build']
    },
    copy: {
      main: {
        files: [{
          expand: true,
          src: ['*.html', '*.ipar', '*.md', 'css/**/*', 'img/**/*', 'lib/**/*'],
          dest: 'build/',
          filter: 'isFile'
        }]
      }
    },
    watch: {
      js: {
        files: [
          'js/**/*.js',
          'Gruntfile.js'
        ],
        tasks: ['browserify']
      },
      other: {
          files: ['*.html', '*.ipar', '*.md', 'css/**/*', 'img/**/*', 'lib/**/*'],
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
      dist: {
        src: ['js/**/*.js'],
        dest: 'build/temp/bundle.js',
        options: {
            browserifyOptions: {
                debug: true
            }
        }
      },
    },
    uglify: {
      dist: {
          src: 'build/temp/bundle.js',
          dest: 'build/bundle.min.js'
      }
    },
    connect: {
      livereload: {
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ["clean", "copy", "browserify",  "uglify", "connect", "watch"]);
};