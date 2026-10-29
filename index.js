const $ = selector => document.querySelector(selector);
const pads = [...document.querySelectorAll('.pad')];
const power = $('#on'), strict = $('#strict'), start = $('#start'), difficulty = $('#difficulty');
const mode = $('#mode'), sound = $('#sound'), theme = $('#theme'), mute = $('#mute');
const statusText = $('#status'), counter = $('#turn'), hint = $('#hint'), board = $('#outer-circle');
const speeds = { easy: [650, 300], normal: [420, 200], expert: [240, 130] };
const colors = ['#37ff8c', '#ff5269', '#ffe66a', '#58c4ff'];
const badgeNames = { first:'First round', ten:'10 perfect rounds', expert:'Expert champion', daily:'Daily champion', endless:'Endless 25', duo:'Memory partners' };
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
let badges = read('simon-badges', []); if (!Array.isArray(badges)) badges = [];
let records = read('simon-records', {}); if (!records || typeof records !== 'object') records = {};
const previousBest = Number(read('simon-best', 0));
if (Number.isFinite(previousBest) && previousBest > (Number(records['classic:normal']) || 0)) { records['classic:normal'] = previousBest; save('simon-records', records); }
let sequence = [], position = 0, accepting = false, session = 0, active = false;
let score = 0, attempts = 0, correctPresses = 0, mistakes = 0, player = 1, phase = 'repeat', seed = 1;
let audioContext;
let paused = false, tutorial = false, pausedView = null;
const wait = async ms => {
 const token = session;
 let remaining = ms;
 while (remaining > 0 && token === session) {
  await new Promise(resolve => setTimeout(resolve, Math.min(remaining, 40)));
  if (!paused) remaining -= Math.min(remaining, 40);
 }
};
function dateKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function recordKey() { return `${mode.value}:${difficulty.value}${mode.value === 'daily' ? ':'+dateKey() : ''}`; }
function updateBest() { $('#best').textContent = String(Number(records[recordKey()]) || 0).padStart(2,'0'); }
function renderBadges() { $('#badges').replaceChildren(); for (const [id, name] of Object.entries(badgeNames)) { const b=document.createElement('span'); b.className='badge'+(badges.includes(id)?' earned':''); b.textContent=(badges.includes(id)?'★ ':'☆ ')+name; $('#badges').append(b); } }
function unlock(id) { if (badges.includes(id)) return; badges.push(id); save('simon-badges',badges); renderBadges(); $('#unlock').textContent=`Unlocked: ${badgeNames[id]}`; }
function progress(value) { $('.progress-ring circle').style.strokeDashoffset = String(301.6 * (1-value)); }
function display(label, round, message) { statusText.textContent=label; counter.textContent=typeof round==='number'?String(round).padStart(2,'0'):round; hint.textContent=message; const screen=$('.display'); screen.classList.remove('bump'); void screen.offsetWidth; screen.classList.add('bump'); }
function enablePads(enabled) { accepting=enabled; pads.forEach(p=>{p.disabled=!enabled||paused;}); }
function unlockAudio() { try { audioContext ??= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume().catch(()=>{}); } catch {} }
function tone(index,duration) {
 if (!audioContext || mute.checked) return;
 const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
 const piano=sound.value==='piano', synth=sound.value==='synth';
 oscillator.type=piano?'triangle':synth?'sawtooth':'sine';
 oscillator.frequency.value=(piano?[261.63,329.63,392,523.25]:[329.63,261.63,220,164.81])[index];
 gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(synth?.055:.13,now+.012); gain.gain.exponentialRampToValueAtTime(.001,now+duration/1000);
 oscillator.connect(gain).connect(audioContext.destination); oscillator.start();oscillator.stop(now+duration/1000);
}
async function flash(index,duration,token) { if(token!==session)return; pads[index].classList.add('lit');tone(index,duration);await wait(duration);if(token===session)pads[index].classList.remove('lit'); }
function resetEffects() { pads.forEach(p=>p.classList.remove('lit'));board.classList.remove('celebrate');$('#confetti').replaceChildren(); }
function nextColor() { if(mode.value!=='daily')return Math.floor(Math.random()*4);seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>30; }
function setActive(value) { active=value; if(!value)clearPause(); $('#pause').disabled=!value; $('#tutorial').disabled=value;$('#finish').disabled=!value;mode.disabled=value;difficulty.disabled=value;strict.disabled=value; }
async function playback(token) {
 enablePads(false);progress(0);display(tutorial?'PRACTICE':'WATCH',sequence.length,tutorial?(sequence.length===1?'Watch the green triangle light up.':'Now watch: green triangle, then blue square.'):'Watch closely. Remember the order.');
 const [duration,gap]=speeds[difficulty.value];await wait(650);
 for(const index of sequence){if(token!==session)return;await flash(index,duration,token);await wait(gap);}
 if(token!==session)return;position=0;phase='repeat';enablePads(true);display(tutorial?'TRY IT':mode.value==='duo'?`PLAYER ${player}`:'YOUR TURN',sequence.length,tutorial?(sequence.length===1?'Press the green triangle, or key 1.':'Press green, then blue — keys 1, then 4.'):`Repeat the sequence · 0 / ${sequence.length}`);
}
function newGame(practice = false) {
 if(!power.checked)return;
 clearPause(); tutorial=practice; const token=++session;resetEffects();$('#recap').close();$('#handoff').hidden=true;$('#unlock').textContent='';progress(0);
 score=attempts=correctPresses=mistakes=0;player=1;position=0;
 seed=[...dateKey()].reduce((h,c)=>Math.imul(h,31)+c.charCodeAt(0)|0,0)>>>0;
 setActive(true);start.textContent='RESTART';
 if(!tutorial&&mode.value==='duo'){sequence=[];phase='add';enablePads(true);display('PLAYER 1','+', 'Choose the first color, then pass to Player 2.');}
 else{sequence=[tutorial?0:nextColor()];playback(token);}
}
function recordRound() {
 score=sequence.length;
 if(score>(Number(records[recordKey()])||0)){records[recordKey()]=score;save('simon-records',records);updateBest();}
 unlock('first');if(score>=10&&mistakes===0)unlock('ten');if(mode.value==='endless'&&score>=25)unlock('endless');if(mode.value==='duo'&&score>=5)unlock('duo');
}
function finish(won=false, detail='') {
 if(!active)return; ++session;enablePads(false);setActive(false);updateMode();resetEffects();$('#handoff').hidden=true;
 const title=tutorial?'Practice complete!':won?'You did it!':mode.value==='duo'?`Player ${3-player} wins!`:'Nice run!';
 display(won?'YOU WIN!':'RUN OVER',score,detail||'Ready for another round?');
 $('#result-title').textContent=title;$('#result-detail').textContent=detail||`${mode.options[mode.selectedIndex].text} · ${difficulty.value}`;
 $('#result-score').textContent=tutorial?'Practice':score;$('#result-accuracy').textContent=attempts?`${Math.round(correctPresses/attempts*100)}%`:'—';
 $('#recap').showModal();if(won)celebrate(session);
}
async function press(index) {
 if(!accepting||!active||paused||!power.checked)return;unlockAudio();enablePads(false);const token=session;
 if(!tutorial&&mode.value==='duo'&&phase==='add'){
  sequence.push(index);await flash(index,220,token);if(token!==session)return;
  player=3-player;phase='handoff';$('#handoff').hidden=false;$('#handoff').textContent=`Player ${player} ready`;
  display('PASS IT',sequence.length,`Pass to Player ${player}. Press Ready to repeat the sequence, then add one color.`);return;
 }
 const correct=index===sequence[position];attempts++;if(correct)correctPresses++;await flash(index,220,token);if(token!==session)return;
 if(!correct&&tutorial){display('TRY AGAIN',sequence.length,'No pressure. Watch the practice sequence again.');await wait(700);if(token===session)playback(token);return;}
 if(!correct){mistakes++;if(mode.value!=='classic'||strict.checked){finish(false,mode.value==='duo'?`Player ${player} missed the sequence.`:'One wrong color. Give it another try!');return;}
 display('TRY AGAIN',sequence.length,'Take another look. Your score is still in play.');await wait(900);if(token===session)playback(token);return;}
 position++;progress(position/sequence.length);
 if(position<sequence.length){enablePads(true);hint.textContent=`Repeat the sequence · ${position} / ${sequence.length}`;return;}
 if(tutorial){
  if(sequence.length===1){display('GREAT!',1,'Now let’s try two colors.');await wait(700);if(token!==session)return;sequence=[0,3];playback(token);}
  else finish(true,'Practice complete! You’re ready. Play again starts your selected game mode.');
  return;
 }
 recordRound();
 if(mode.value==='duo'){phase='add';enablePads(true);display(`PLAYER ${player}`,'+','Sequence matched! Choose one new color to add.');return;}
 if((mode.value==='classic'||mode.value==='daily')&&score===20){if(difficulty.value==='expert')unlock('expert');if(mode.value==='daily')unlock('daily');finish(true,'All 20 rounds complete!');return;}
 display('NICE!',score,'Round complete. Here comes one more…');await wait(650);if(token!==session)return;sequence.push(nextColor());playback(token);
}
async function celebrate(token) {
 board.classList.add('celebrate');for(let i=0;i<70;i++){const piece=document.createElement('i');piece.className='confetti';piece.style.cssText=`left:${Math.random()*100}%;--color:${colors[i%4]};--sway:${Math.random()*160-80}px;animation-delay:${Math.random()*.7}s`;$('#confetti').append(piece);}
 for(let i=0;i<8;i++){if(token!==session)return;await flash(i%4,160,token);}await wait(2400);if(token===session)resetEffects();
}
function updateMode() {
 $('#goal').textContent=['endless','duo'].includes(mode.value)?'∞':'20';
 $('#rules').textContent=mode.value==='duo'?'Repeat, add one color, then pass. A wrong color ends the match.':mode.value==='daily'?`Daily challenge · ${dateKey()} · One mistake ends the run.`:mode.value==='endless'?'Keep going. One mistake ends the run.':'Reach round 20. Strict mode ends the run on a mistake; otherwise you can retry.';
 strict.disabled=active||mode.value!=='classic';updateBest();
}
power.addEventListener('change',()=>{++session;setActive(false);enablePads(false);resetEffects();progress(0);$('#handoff').hidden=true;$('#recap').close();start.disabled=!power.checked;start.textContent='START';updateMode();if(power.checked){unlockAudio();display('READY','--','Press Start. Let’s find your rhythm.');}else display('POWER OFF','--','Power on to begin · Play with clicks or keys 1–4');});
function clearPause() {
 paused=false;document.body.classList.remove('paused');$('#pause').textContent='Pause';$('#pause').setAttribute('aria-pressed','false');$('#handoff').disabled=false;
 if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});
}
function togglePause() {
 if(!active)return;paused=!paused;
 document.body.classList.toggle('paused',paused);$('#pause').textContent=paused?'Resume':'Pause';$('#pause').setAttribute('aria-pressed',String(paused));$('#handoff').disabled=paused;
 pads.forEach(p=>p.disabled=paused||!accepting);
 if(paused){pausedView=[statusText.textContent,counter.textContent,hint.textContent];display('PAUSED','Ⅱ','Take your time. Press Resume to continue.');audioContext?.suspend().catch(()=>{});}
 else{display(...pausedView);unlockAudio();}
}
function beginPractice(){ $('#welcome').close();save('simon-welcomed',true);power.checked=true;start.disabled=false;unlockAudio();newGame(true); }
$('#pause').addEventListener('click',togglePause);
$('#tutorial').addEventListener('click',beginPractice);
$('#welcome-practice').addEventListener('click',beginPractice);
$('#welcome-skip').addEventListener('click',()=>{$('#welcome').close();save('simon-welcomed',true);});
start.addEventListener('click',()=>{unlockAudio();newGame();});
$('#finish').addEventListener('click',()=>finish(false,'Run ended. Your completed rounds are saved.'));
$('#again').addEventListener('click',()=>{unlockAudio();newGame();});
$('#handoff').addEventListener('click',()=>{if(!active||paused||!power.checked)return;$('#handoff').hidden=true;phase='repeat';position=0;progress(0);enablePads(true);display(`PLAYER ${player}`,sequence.length,'Repeat from memory, then add one color.');});
mode.addEventListener('change',updateMode);difficulty.addEventListener('change',updateBest);
for(const [control,key] of [[theme,'theme'],[sound,'sound'],[mute,'mute']]){const value=read('simon-'+key,null);if(control===mute)control.checked=value===true;else if([...control.options].some(o=>o.value===value))control.value=value;control.addEventListener('change',()=>{save('simon-'+key,control===mute?control.checked:control.value);document.body.dataset.theme=theme.value;});}
document.body.dataset.theme=theme.value;
pads.forEach((pad,index)=>pad.addEventListener('click',()=>press(index)));
document.addEventListener('keydown',event=>{if(event.repeat||!$('#install-guide').hidden||$('#welcome').open||$('#recap').open||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;if(/^[1-4]$/.test(event.key)){event.preventDefault();press(Number(event.key)-1);}});
for(let i=0;i<16;i++){const particle=document.createElement('i');particle.className='particle';particle.style.cssText=`left:${Math.random()*100}%;top:${60+Math.random()*40}%;--color:${colors[i%4]};animation-delay:${-Math.random()*12}s;animation-duration:${12+Math.random()*8}s`;$('#particles').append(particle);}
renderBadges();updateMode();

if(!read('simon-welcomed',false)) $('#welcome').showModal();

// Freeze a run when switching apps so a sequence cannot play unseen.
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)togglePause();});
