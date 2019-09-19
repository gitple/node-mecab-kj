var nodeunit = require('nodeunit');

var path = require('path'),
    mecab = require(path.resolve('mecab')),
    _ = require('lodash');

var TEXT_KO = '아버지가방에들어가신다';
var COMPOUND_TEXT_KO = '아버지의비밀번호를몰라요';

exports.mecab = {
    'pos': function (test) {
        test.expect(2);

        mecab.pos(TEXT_KO, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0].length, 2);
            test.done();
        });
    },
    'posNoCompound': function (test) {
        test.expect(2);

        mecab.posNoCompound(TEXT_KO, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0].length, 2);
            test.done();
        });
    },
    'pos_compound': function (test) { //compound
        test.expect(2);

        mecab.pos(COMPOUND_TEXT_KO, function (err, result) {
            test.equals(result.length, 5);
            test.equals(result[0].length, 2);
            test.done();
        });
    },
    'posNoCompound_compound': function (test) { //compound
        test.expect(2);

        mecab.posNoCompound(COMPOUND_TEXT_KO, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0].length, 2);
            test.done();
        });
    },

    'morphs': function (test) {
        test.expect(2);

        mecab.morphs(TEXT_KO, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0], '아버지');
            test.done();
        });
    },

    'orgform': function (test) {
        test.expect(2);

        mecab.morphs(TEXT_KO, function (err, result) {
            test.equals(result.length, 6);
            test.equals(result[0], '아버지');
            test.done();
        });
    },

    'nouns': function (test) {
        test.expect(1);

        mecab.nouns(TEXT_KO, function (err, result) {
            test.equals(result.length, 2);
            test.done();
        });
    }
};


const ORGFORM_DATA = {
  ja: {
    a: '私 今日 学校 行く',
    q: [ '私は今日学校に行った！', //나는 오늘 학교에 갔다!
      '私は今日の学校を行く', // 나는     오늘 학교를 갑니다
    '私は今日、学校だけ行く'] , //나는     오늘 학교만 가다
  },
  zh: {
    a: '今天 去 上学',
    q: [ '我今天去上学。'] // 나는 오늘 학교에 간다.
  },
  ko: {
    a: '나 오늘 학교 가다',
    q: [ '나는 오늘 학교에 갔다!',
      '나는     오늘 학교를 간다',
    '나는,오늘   학교만 갔지롱' ],
  }
};
function orgform_test(test, lang) {
  let questionArr = ORGFORM_DATA[lang].q;
  let answer = ORGFORM_DATA[lang].a;
  let assertCount = _.size(questionArr);

  test.expect(assertCount);
  _.each(questionArr, (q) => {
    mecab.orgform(q, lang, (err, result) => {
      test.equals(_.map(result, _.first).join(' '), answer);
      if(--assertCount === 0) { test.done(); }
    });
  });
}
exports.mecab_orgform_lang = {
  'ja': (test) => { orgform_test(test, 'ja'); },
  'ko': (test) => { orgform_test(test, 'ko'); },
  'zh': (test) => { orgform_test(test, 'zh'); },
};

const NOUNS_DATA = {
  ja: {
    a: '学校',
    q: [ '私は今日学校に行った！', //나는 오늘 학교에 갔다!
      '私は今日の学校を行く', // 나는     오늘 학교를 갑니다
    '私は今日、学校だけ行く'] , //나는     오늘 학교만 가다
  },
  zh: {
    a: '大学',
    q: [ '我今天要上大学了'] // 나는 오늘 학교에 간다.
  },
  ko: {
    a: '학교',
    q: [ '나는 오늘 학교에 갔다!',
      '나는     오늘 학교를 간다',
    '나는,오늘   학교만 갔지롱' ],
  }
};
function nouns_test(test, lang) {
  let questionArr = NOUNS_DATA[lang].q;
  let answer = NOUNS_DATA[lang].a;
  let assertCount = _.size(questionArr);

  test.expect(assertCount);
  _.each(questionArr, (q) => {
    mecab.nouns(q, lang, (err, result) => {
      test.equals(result.join(' '), answer);
      if(--assertCount === 0) { test.done(); }
    });
  });
}
exports.mecab_nouns_lang = {
  'ja': (test) => { nouns_test(test, 'ja'); },
  'ko': (test) => { nouns_test(test, 'ko'); },
  'zh': (test) => { nouns_test(test, 'zh'); },
};

const POS_DATA = {
  ja: {
    a: '私,名詞,代名詞,一般 は,助詞,係助詞,* 今日,名詞,副詞可能,* 学校,名詞,一般,* に,助詞,格助詞,一般 行っ,動詞,自立,* た,助動詞,*,* ！,記号,一般,*',
    q: [ '私は今日学校に行った！' ], //나는 오늘 학교에 갔다!
  },
  zh: {
    a: '我,r 今天,t 要,v 上,v 大学,n 了,y',
    q: [ '我今天要上大学了'] // 나는 오늘 학교에 간다.
  },
  ko: {
    a: '나,NP 는,JX 오늘,MAG 학교,NNG 에,JKB 갔,VV+EP 다,EF !,SF',
    q: [ '나는 오늘 학교에 갔다!' ],
  }
};
function pos_test(test, lang) {
  let questionArr = POS_DATA[lang].q;
  let answer = POS_DATA[lang].a;
  let assertCount = _.size(questionArr);

  test.expect(assertCount);
  _.each(questionArr, (q) => {
    mecab.pos(q, lang, (err, result) => {
      test.equals(result.join(' '), answer);
      if(--assertCount === 0) { test.done(); }
    });
  });
}
exports.mecab_pos_lang = {
  'ja': (test) => { pos_test(test, 'ja'); },
  'ko': (test) => { pos_test(test, 'ko'); },
  'zh': (test) => { pos_test(test, 'zh'); },
};
