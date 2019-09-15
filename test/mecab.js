var nodeunit = require('nodeunit');

var path = require('path'),
    mecab = require(path.resolve('mecab'));

var text = '아버지가방에들어가신다';
var compoundText = '아버지의비밀번호를몰라요';

exports.mecab = {
    'pos': function (test) {
        test.expect(2);

        mecab.pos(text, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0].length, 2);
            test.done();
        });
    },
    'posNoCompound': function (test) {
        test.expect(2);

        mecab.posNoCompound(text, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0].length, 2);
            test.done();
        });
    },
    'pos_compound': function (test) { //compound
        test.expect(2);

        mecab.pos(compoundText, function (err, result) {
            test.equals(result.length, 5);
            test.equals(result[0].length, 2);
            test.done();
        });
    },
    'posNoCompound_compound': function (test) { //compound
        test.expect(2);

        mecab.posNoCompound(compoundText, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0].length, 2);
            test.done();
        });
    },

    'morphs': function (test) {
        test.expect(2);

        mecab.morphs(text, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0], '아버지');
            test.done();
        });
    },

    'orgform': function (test) {
        test.expect(2);

        mecab.morphs(text, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0], '아버지');
            test.done();
        });
    },

    'nouns': function (test) {
        test.expect(1);

        mecab.nouns(text, function (err, result) {
            test.equals(result.length, 2);
            test.done();
        });
    }
};
