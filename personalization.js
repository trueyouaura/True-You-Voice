export const DEFAULT_TAGLINE='Practice a feminine voice with curiosity, comfort, and a little consistency.';
export const PRONOUN_CHOICES={
 subject:['','she','they','he','ze','xe','she / they','they / she','he / they','they / he','she / he','he / she'],
 object:['','her','them','him','zir','xem','her / them','them / her','him / them','them / him','her / him','him / her'],
 possessive:['','hers','theirs','his','zirs','xyrs','hers / theirs','theirs / hers','his / theirs','theirs / his','hers / his','his / hers']
};
export function normalizeLanguage(value){
 const pronouns={};
 for(const [form,choices] of Object.entries(PRONOUN_CHOICES))pronouns[form]=choices.includes(value?.pronouns?.[form])?value.pronouns[form]:'';
 return {tagline:typeof value?.tagline==='string'&&value.tagline.trim()?value.tagline.trim().slice(0,180):DEFAULT_TAGLINE,pronouns};
}
export function languageCopy(value,name=''){
 const {pronouns}=normalizeLanguage(value);
 const first=form=>pronouns[form].split(' / ')[0];
 const subject=first('subject'),object=first('object'),possessive=first('possessive');
 const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
 return {
  summary:Object.values(pronouns).filter(Boolean).join(' · ')||'No pronouns selected',
  preview:`${subject?`${cap(subject)} ${subject==='they'?'are':'is'}`:'You are'} making room for a voice that feels right. ${object?`Gentle practice gives ${object} time to explore.`:'Gentle practice gives you time to explore.'} ${possessive?`This space is ${possessive}.`:'This space is yours.'}`,
  encouragement:`${name?`${name}’s practice, at ${name}’s pace. `:''}${subject?`${cap(subject)} ${subject==='they'?'are':'is'}`:'You are'} free to explore gently. ${object?`There is room for ${object} to take a rest.`:'There is room to take a rest.'} ${possessive?`Every small step is ${possessive}.`:'Every small step is yours.'}`
 };
}
