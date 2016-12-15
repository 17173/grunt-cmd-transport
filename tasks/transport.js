/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  var path = require('path');
  var cmd = require('cmd-util');

  var text = require('./lib/text').init(grunt);
  var script = require('./lib/script').init(grunt);
  var style = require('./lib/style').init(grunt);
  var template = require('./lib/template').init(grunt);
  var json = require('./lib/json').init(grunt);

  grunt.registerMultiTask('transport', 'Transport everything into cmd.', function() {

    var options = this.options({
      paths: ['sea-modules'],

      idleading: '',
      alias: {
        // importstyle: 'pandora/importstyle/1.0.0/importstyle',
        // handlebars: 'gallery/handlebars/1.3.0/handlebars-runtime'
      },

      // create a debug file or not
      debug: true,

      // process a template or not
      process: false,

      // define parsers
      parsers: {
        '.js': [script.jsParser],
        '.css': [style.css2jsParser],
        '.html': [text.html2jsParser],
        '.json': [json.jsonParser],
        '.tpl': [template.tplParser],
        '.handlebars': [template.handlebarsParser]
      },

      // for styles
      css: {
        template: [
          'define(\'%s\', [\'%s\'], function(require, exports, module) {',
            'var importStyle = require(\'%s\');',
            'module.exports = function() {',
              'importStyle(\'%s\', \'%s\');',
            '};',
          '});'
        ].join('\n')
      },

      // for handlebars
      handlebars: {
        knownHelpers: [],
        knownHelpersOnly: false,
        template: [
          'define(\'%s\', [\'%s\'], function(require, exports, module) {',
            'var Handlebars = require(\'%s\');',
            'module.exports = Handlebars.template(',
              '%s',
            ');',
          '})'
        ].join('\n')
      },

      // output beautifier
      uglify: {
        beautify: true,
        comments: true
      },

      // https://github.com/aliceui/aliceui.org/issues/9
      styleBox: false
    });

    if (options.process === true) {
      options.process = {};
    }

    var count = 0;
    this.files.forEach(function(fileObj) {
      // cwd shouldn't exist after normalize path
      if (fileObj.cwd) {
        grunt.fail.warn('should specify expand when use cwd');
      }

      var src = fileObj.src[0], dest = fileObj.dest;
      var extname = path.extname(src);
      var fileparsers = options.parsers[extname];
      if (!fileparsers || fileparsers.length === 0) {
        grunt.file.copy(src, dest);
        return;
      }
      if (!Array.isArray(fileparsers)) {
        fileparsers = [fileparsers];
      }
      var srcData = grunt.file.read(src);
      if (options.process) {
        srcData = grunt.template.process(srcData, options.process);
      }
      fileparsers.forEach(function(fn) {
        fn({
          src: src,
          srcData: srcData,
          name: path.relative(fileObj.orig.cwd || '', src),
          dest: dest
        }, options);
      });

      count++;
    });
    grunt.log.writeln('transport ' + count.toString().cyan + ' files');
  });
};
