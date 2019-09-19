module.exports = function(grunt) {
    grunt.initConfig({
        nodeunit: {
            main: ['test/mecab.js'],
        },
        jshint: {
            main: ['mecab.js'],
            options: {
              node: true,
              esversion: 6
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('default', ['jshint', 'nodeunit']);
};
