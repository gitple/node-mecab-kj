'use strict';
var cp = require('child_process');
var sq = require('shell-quote');


var MECAB_KO_PATH = process.env.MECAB_KO_PATH;
var MECAB_KO_DIC_PATH = process.env.MECAB_KO_DIC_PATH;
var MECAB_JA_PATH = process.env.MECAB_JA_PATH;
var MECAB_JA_DIC_PATH = process.env.MECAB_JA_DIC_PATH;
var MECAB_ZH_PATH = process.env.MECAB_ZH_PATH;
var MECAB_ZH_DIC_PATH = process.env.MECAB_ZH_DIC_PATH;
if (!process.env.MECAB_KO_PATH) {
  MECAB_KO_PATH=
    process.env.MECAB_LIB_PATH ?
    process.env.MECAB_LIB_PATH :
    __dirname + '/mecab';
}

let DEFAULT_LANG='ko';
var buildCommand = function (text, lang) {
  switch(lang) {
    case 'ja':
      return 'LD_LIBRARY_PATH=' + MECAB_JA_PATH + ' ' +
        sq.quote(['echo', text]) + ' | ' + MECAB_JA_PATH + '/bin/mecab' + 
        (MECAB_JA_DIC_PATH ? ' -d ' + MECAB_JA_DIC_PATH : '');
    case 'zh':
      return 'LD_LIBRARY_PATH=' + MECAB_ZH_PATH + ' ' +
        sq.quote(['echo', text]) + ' | ' + MECAB_ZH_PATH + '/bin/mecab' +
        (MECAB_JA_DIC_PATH ? ' -d ' + MECAB_ZH_DIC_PATH : '');
    case 'ko':
      return 'LD_LIBRARY_PATH=' + MECAB_KO_PATH + ' ' +
        sq.quote(['echo', text]) + ' | ' + MECAB_KO_PATH + '/bin/mecab' +
        (MECAB_JA_DIC_PATH ? ' -d ' + MECAB_KO_DIC_PATH : '');
  }
};

var execMecab = function (text, lang, callback) {
    cp.exec(buildCommand(text, lang), function(err, result) {
        if (err) { return callback(err); }
        callback(err, result);
    });    
};

var parseFunctions = {
    'pos': function (result, elems, lang) {
      switch(lang) {
        case 'ko':
          result.push([elems[0]].concat(elems[1].split(',')[0]));
          return result;
        case 'zh':
          result.push([elems[0]].concat(elems[1].split(',')[0]));
          return result;
        case 'ja': // 名詞,固有名詞,人名
          let tags = elems[1].split(',');
          result.push([elems[0]].concat(tags[0], tags[1], tags[2]));
          return result;
      }
    },
    'posNoCompound': function (result, elems, lang) {
      if (lang === 'ja') { // FIXME: No Compound Noun handing in Japanses
        return parseFunctions['pos'](result, elems, lang);    
      }
      if (lang === 'zh') { // FIXME: No Compound Noun handing in Chinese
        return parseFunctions['pos'](result, elems, lang);    
      }

      let word = elems[0];
      let tags = elems[1] && elems[1].split(',');
      let tag = tags && tags[0];

      // NNG+VCP+EC,*,F,고양이로소이다,Preanalysis,NNG,EC,고양이/NNG/*+/VCP/*+로소이다/EC/*
      // NNP,지명,T,강남역,Compound,*,*,강남/NNP/지명+역/NNG/*
      // NNP,*,F,포스텍기술지주,Preanalysis,NNP,NNG,포스텍/NNP/*+기술/NNG/*+지주/NNG/*
      // NP+VCP+EF,*,F,어딘가요,Inflect,NP,EF,어디/NP/*+이/VCP/*+ᆫ가요/EF/*
      if (tag.charAt(0) === 'N' && (tags[4] === 'Compound' || tags[4] === 'Preanalysis' || tags[4] === 'Inflect')) {
        let compunds = tags[7]; // 강남/NNP/지명+역/NNG/* or  포스텍/NNP/*+기술/NNG/*+지주/NNG/*
        compunds.split('+').forEach((els)=>{ 
          let el = els.split('/');
          if (el[1] && el[1].charAt(0) === 'N') { // only noun parts
            result.push([el[0]].concat(el[1]));
          }
        });
      } else {
        result.push([word].concat(tag));
      }
          return result;
    },
    'orgform': function (result, elems, lang) {
      //console.log(elems);
      let word = elems[0];
      let tags = elems[1].split(',');
      let tag = tags[0];
      switch(lang) {
        case 'ko':
          switch(tag.charAt(0)) {
            case 'J': //조사
            case 'E': //어미
            case 'X': //접두사, 접미사
            case 'S': //symbol
              if (tag === 'SL' || tag === 'SN' || tag === 'SH') { break; } // allow foreign lang and number
              //console.log('remove:', word, tag);
              return result; //형식 형태소 무시

            case 'V': //동사만 원형으로
              if (tag[1] === 'X') { //보조용언(VX)도 무시.
                return result;
              }
              let orgForm = elems[1].split(',')[7];
              if (orgForm !== '*') {
                word = orgForm.split(/\//)[0]; 
              }
            word += '다';
            break;
          }
          result.push([word].concat(tag));
          return result;
        case 'zh':
          switch(tag) {
            case 'an':
            case 'i':
            case 'j':
            case 'm':
            case 'n':
            case 'nr':
            case 'nt':
            case 'nx':
            case 'nz':
            case 't':
            case 'v':
            case 'vn':
              result.push([word].concat(tag));
              break;
          }
          return result;
        case 'ja':
          switch(tag) {
          /*
          名詞  명사
          動詞  동사
          形容詞  형용사
          副詞  부사
          助詞  조사
          接続詞  접속사
          助動詞  조동사
          連体詞  연체사
          感動詞  감동사
          その他  기타
          フィラー  필러
          記号  기호
          接頭詞  접두사

          記号,アルファベット// 기호, 알파벳
          記号,一般, // 기호, 일반
          記号,括弧開,// 기호, 괄호 열고
          記号,括弧閉,// 기호, 괄호 닫힘
          記号,句点,// 기호, 구두점
          記号,空白,// 기호, 공백
          記号,読点,// 기호, 쉼표
           */
            case '助詞': // 조사
            case '接続詞': // 접속사
            case '助動詞': // FIXME: 조동사
            case '連体詞': // FIXME: 연체사, 명사를 수식하는 
            case 'フィラー':  //FIXME: 필러
            case '接頭詞':  //접두사
            case '助動詞':  //FIXME: 조동사
            case '記号': //기호
              if (tags[1] === 'アルファベット') { break; } // allow foreign lang and number
              //console.log('remove:', word, tag);
              return result; //형식 형태소 무시

// 行く 가다
// 行く	動詞,自立,*,*,五段・カ行促音便,基本形,行く,イク,イク
// 行きます 갑니다
// 行き	動詞,自立,*,*,五段・カ行促音便,連用形,行く,イキ,イキ
// ます	助動詞,*,*,*,特殊・マス,基本形,ます,マス,マス
            case '動詞': //동사만 원형으로
              let orgForm = tags[6];
              if (orgForm !== '*') {
                word = orgForm;
              }
            break;
          }
          result.push([word].concat(tag));
          return result;
      }
    },
    'morphs': function (result, elems/*, lang*/) {
        //lang
        result.push(elems[0]);
        return result;
    },

    'nouns': function (result, elems, lang) {
        var tags = elems[1].split(',');
        var tag = tags[0];
        var tag1 = tags[1];
        
        switch(lang) {
          case 'ko':
            if (tag === 'NNG' || tag === 'NNP') {
              result.push(elems[0]);
            }
            break;
          case 'zh':
            switch(tag) {
              case 'an':
              case 'n':
              case 'nr':
              case 'nt':
              case 'nx':
              case 'nz':
              case 'vn':
                result.push(elems[0]);
                break;
            }
            break;
          case 'ja': //고유명사, 일반명사 see: https://taku910.github.io/mecab/posid.html
            if ( (tag === '名詞') &&
               (tag1 === '一般' || tag1 === '固有名詞')) {
              result.push(elems[0]);
            }
            break;
        }

        return result;
    }
};

var parse = function (text, lang, method, callback) {
    execMecab(text, lang, function (err, result) {
        if (err) { return callback(err); }

        result = result.split('\n').reduce(function(parsed, line) {
            var elems = line.split('\t');

            if (elems.length > 1) {
                return parseFunctions[method](parsed, elems, lang);
            } else {
                return parsed;
            }
        }, []);

        callback(err, result);
    });
};

var pos = function (text, lang, callback) {
    if (typeof lang === 'function') { 
      lang = DEFAULT_LANG; 
      callback = lang;
    } 
    if (!lang) { lang = DEFAULT_LANG; }

    parse(text, lang, 'pos', callback);
};

var posNoCompound = function (text, lang, callback) {
    if (typeof lang === 'function') { 
      lang = DEFAULT_LANG; 
      callback = lang;
    } 
    if (!lang) { lang = DEFAULT_LANG; }

    parse(text, lang, 'posNoCompound', callback);
};

var orgform = function (text, lang, callback) {
    if (typeof lang === 'function') { 
      lang = DEFAULT_LANG; 
      callback = lang;
    } 
    if (!lang) { lang = DEFAULT_LANG; }

    parse(text, lang, 'orgform', callback);
};

var morphs = function (text, lang, callback) {
    if (typeof lang === 'function') { 
      lang = DEFAULT_LANG; 
      callback = lang;
    } 
    if (!lang) { lang = DEFAULT_LANG; }

    parse(text, lang, 'morphs', callback);
};

var nouns = function (text, lang, callback) {
    if (typeof lang === 'function') { 
      lang = DEFAULT_LANG; 
      callback = lang;
    } 
    if (!lang) { lang = DEFAULT_LANG; }

    parse(text, lang, 'nouns', callback);
};

module.exports = {
    pos: pos,
    posNoCompound: posNoCompound,
    orgform: orgform,
    morphs: morphs,
    nouns: nouns
};
