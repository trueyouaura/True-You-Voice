import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLanguage,languageCopy,DEFAULT_TAGLINE} from '../personalization.js';
import {readProfiles,validTheme} from '../profiles-store.js';
test('old profiles keep the original tagline without assuming pronouns',()=>{
 const [profile]=readProfiles({getItem:()=>JSON.stringify([{id:'old',name:'Alex',theme:'nonbinary-dark'}])});
 assert.equal(profile.language.tagline,DEFAULT_TAGLINE);
 assert.deepEqual(profile.language.pronouns,{subject:'',object:'',possessive:''});
 assert.match(languageCopy(profile.language).preview,/You are/);
});
test('personal wording is bounded and invalid pronouns fall back to you',()=>{
 const value=normalizeLanguage({tagline:' x '.repeat(200),pronouns:{subject:{},object:'invented',possessive:14}});
 assert.equal(value.tagline.length,180);assert.deepEqual(value.pronouns,{subject:'',object:'',possessive:''});
 assert.equal(normalizeLanguage({tagline:'  '}).tagline,DEFAULT_TAGLINE);
});
test('independent and mixed pronouns use correct agreement and pronoun cases',()=>{
 const mixed=languageCopy({pronouns:{subject:'she / they',object:'them',possessive:'theirs'}});
 assert.match(mixed.preview,/She is/);assert.match(mixed.preview,/gives them time/);assert.match(mixed.preview,/space is theirs/);
 const they=languageCopy({pronouns:{subject:'they / she',object:'her / them',possessive:'hers / theirs'}});
 assert.match(they.preview,/They are/);assert.match(they.preview,/gives her time/);assert.match(they.encouragement,/step is hers/);
});
test('taglines and independent pronouns survive registry restoration',()=>{
 const language={tagline:'Explore a voice that feels like me.',pronouns:{subject:'she / they',object:'them',possessive:'theirs'}};
 const [profile]=readProfiles({getItem:()=>JSON.stringify([{id:'mixed',name:'Taylor',language}])});
 assert.deepEqual(profile.language,language);
});
test('retired Trans Masc looks preserve brightness in their fallback',()=>{
 assert.equal(validTheme('trans-masc-light'),'trans-fem-light');
 assert.equal(validTheme('trans-masc-dark'),'trans-fem-dark');
});
