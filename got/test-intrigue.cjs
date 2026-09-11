const fs=require('fs'), vm=require('vm'), assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname, 'war_tool.html'),'utf8');
const source=html.match(/<script>([\s\S]*)<\/script>/)[1];
new vm.Script(source);
let fail=false;const storage=new Map();
const context={console,assert,Date,alert:()=>{},document:{addEventListener:()=>{},getElementById:()=>({addEventListener:()=>{}})},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');storage.set(k,v);}}};
vm.createContext(context);
vm.runInContext(source.slice(0,source.lastIndexOf('/* ========= init ========= */'))+'\nrenderAll=()=>{};reopenResult=()=>{};closeResult=()=>{};',context);
let count=0;
function test(name,body){fail=false;storage.clear();vm.runInContext('initDefaults();',context);vm.runInContext('{'+body+'}',context);count++;console.log('PASS',name);}
test('21 people; excluded NPCs absent; Rito has three physical defenses', `
assert.equal(INTRIGUE_PEOPLE.length,21);
assert(!INTRIGUE_PEOPLE.some(x=>['lyle','eusebia'].includes(x.id)));
assert.equal(iData().defenses.find(x=>x.provider==='rito').remaining,3);
assert.equal(iUnavailable('rito'),'');
`);
test('Zero/multiple detainees, Maria release and Maester death independently unlock', `
setIntriguePerson('lion','detained',true);setIntriguePerson('gail','detained',true);
assert(iBound('lion'));assert(iBound('gail'));
assert.throws(()=>addAttack('lion','helena','physical','ナイフ',true),/拘束中/);
iCommit('release',d=>{d.mariaRelease=true;});assert(!iBound('lion'));assert(!iBound('gail'));
iCommit('revoke',d=>{d.mariaRelease=false;});assert(iBound('lion'));
setIntriguePerson('maester','status','dead');assert(!iBound('lion'));assert(!iBound('gail'));
undoIntrigue();assert(iBound('lion'));
assert.throws(()=>setIntriguePerson('rito','detained',true),/拘束不可/);
assert.throws(()=>setIntriguePerson('reni','detained',true),/拘束不可/);
`);
test('Dead, retired and detained characters contribute no R3 power/support/debuff', `
state.roundIndex=3;
state.rounds[3].chars.rito.placed={field:'金華',side:'攻撃'};
state.rounds[3].chars.lion.placed={field:'金華',side:'攻撃'};
state.rounds[3].chars.emil.placed={field:'金華',side:'攻撃'};
state.rounds[3].chars.gentoku.placed={field:'金華',side:'攻撃'};
state.charsMeta.lion.extra.targetArmy='王室騎士団';
state.charsMeta.gentoku.extra={pay:10,targetArmy:'王室騎士団'};
state.rounds[3].armies['王室騎士団'].placed={field:'金華',side:'防衛'};
setIntriguePerson('rito','status','dead');setIntriguePerson('lion','detained',true);
setIntriguePerson('emil','status','retired');setIntriguePerson('gentoku','status','dead');
assert.equal(compute(3).results[3].atkTotal,0);
assert.equal(compute(3).results[3].defTotal,120);
assert.equal(getSupportLoyaltyDeltaList(3).length,0);
undoIntrigue();assert.equal(getSupportPowerBonusMap(3)['王室騎士団'],50);
`);
test('Preview does not consume defenses; chosen eligible defense only is consumed', `
addDefense('maria','lion',2,true);
addDefense('noelis','lion',1,true);
addAttack('sebastian','lion','physical','ナイフ',true);
const a=iNext();startAttack(a.id,true);
const before=JSON.stringify(iData());const candidates=defenseCandidates(iData().actions.find(x=>x.id===a.id));
assert.equal(JSON.stringify(iData()),before);
const noelis=candidates.find(x=>x.name.includes('ノエリス／緑'));
assert.throws(()=>chooseDefense(a.id,noelis.id,false),/確認/);
chooseDefense(a.id,noelis.id,true);
assert.equal(iData().defenses.find(x=>x.provider==='noelis'&&x.kind==='all').remaining,0);
assert.equal(iData().defenses.find(x=>x.provider==='maria').remaining,2);
assert.throws(()=>chooseDefense(a.id,noelis.id,true),/処理中/);
assert(undoIntrigue());assert.equal(iData().defenses.find(x=>x.id===noelis.id).remaining,1);
`);
test('Poison bypasses normal guards; item confirmation occurs at actual use', `
addDefense('gail','helena',2,true);addDefense('emil','helena',1,false);
addAttack('yuris','helena','poison','錬成毒',true);const a=iNext();startAttack(a.id,true);
const candidates=defenseCandidates(iData().actions.find(x=>x.id===a.id));
assert(!candidates[0].enabled);assert(candidates[1].enabled);
assert.throws(()=>chooseDefense(a.id,candidates[1].id,false),/確認/);
assert.throws(()=>chooseDefense(a.id,candidates[0].id,true),/使用できません/);
markUndefended(a.id,true);assert(iPending('helena'));assert(!charEligible('helena',3));
setIntriguePerson('helena','antidote',true);resolveVictim(a.id,'antidote',true);
assert.equal(iData().people.helena.status,'alive');assert(!iData().people.helena.antidote);
`);
test('Poison immunity does not consume Rito physical defenses', `
addAttack('yuris','rito','poison','錬成毒',true);const a=iNext();startAttack(a.id,true);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'done');

assert.equal(iData().defenses.find(d=>d.provider==='rito').remaining,3);
`);
test('Ruri watches the attacker, not the victim; mutually exclusive assassination', `
addDefense('ruri','sebastian',1,true);
assert.throws(()=>addAttack('ruri','gail','physical','クナイ',true),/登録済み/);
addAttack('sebastian','helena','poison','速攻毒',true);const a=iNext();startAttack(a.id,true);
const resolved=iData().actions.find(x=>x.id===a.id);
assert.equal(resolved.status,'done');assert.match(resolved.result,/自動発動/);
assert.equal(iData().defenses.find(d=>d.kind==='watch').remaining,0);
assert(!defenseCandidates(resolved).some(x=>x.name.includes('ルリ')));
assert.equal(iData().people.helena.status,'alive');
undoIntrigue();assert.equal(iData().defenses.find(d=>d.kind==='watch').remaining,1);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'queued');
`);
test('Reni and Gail share two slots; required killing weapon is enforced', `
addDefense('reni','lion',1,true);addAttack('reni','helena','physical','白い羽',true);
assert.throws(()=>addAttack('reni','helena','physical','白い羽',true),/合計2回/);
addDefense('gail','lion',2,true);assert.throws(()=>addAttack('gail','helena','physical','聖剣',true),/合計2回/);
assert.throws(()=>addAttack('helena','lion','physical','ナイフ',true),/必要武器/);
`);
test('Additional bodyguard sacrifice becomes a separate all-defense-only event', `
addDefense('rata','lion',2,true);addDefense('noelis','rata',1,true);
addAttack('gail','lion','physical','聖剣',true);addAttack('gail','lion','physical','聖剣',true);
const d=iData().defenses.find(x=>x.provider==='rata');
let a=iNext();startAttack(a.id,true);chooseDefense(a.id,d.id,true);
assert(!iData().actions.some(x=>x.kind==='cost'));
a=iNext();startAttack(a.id,true);chooseDefense(a.id,d.id,true);
const cost=iNext();assert.equal(cost.kind,'cost');assert.equal(cost.target,'rata');
assert.throws(()=>cancelAttack(cost.id),/代償/);
startAttack(cost.id,true);const all=defenseCandidates(iData().actions.find(x=>x.id===cost.id)).find(x=>x.name.includes('ノエリス／緑'));
assert(all.enabled);chooseDefense(cost.id,all.id,true);assert.equal(iData().people.rata.status,'alive');
`);
test('Il second assassination carries a cost even when attack is defended', `
addAttack('il','rito','physical','クナイ',true);addAttack('il','rito','physical','クナイ',true);
let a=iNext();startAttack(a.id,true);
a=iNext();startAttack(a.id,true);
const cost=iNext();assert.equal(cost.target,'il');assert.equal(cost.kind,'cost');
startAttack(cost.id,true);markUndefended(cost.id,true);resolveVictim(cost.id,'dead',true);
assert.equal(iData().people.il.status,'dead');assert(!charEligible('il',3));
`);
test('Spread poison independently launches three simultaneous targets immediately', `
addAttack('sebastian','rito','physical','ナイフ',true);
const base=iNext();startAttack(base.id,true);
assert.equal(iUsed('sebastian'),1);
addSpreadPoison('sebastian',['lion','helena','rito'],true);
assert.equal(iUsed('sebastian'),1);assert(!iData().meetingEnded);
iCommit('hex',d=>{d.poisonDisabled=true;});
const spread=iNext();assert.equal(spread.kind,'spread');startAttack(spread.id,true);
let batch=iData().actions.filter(a=>a.kind==='spread');
assert.equal(batch.filter(a=>a.status==='active').length,2);
assert.equal(new Set(batch.map(a=>a.startedAt)).size,1);assert(!iNext());
setIntriguePerson('sebastian','status','dead');
assert(!defenseCandidates(iData().actions.find(x=>x.id===spread.id)).some(x=>x.id==='nullified'));
markUndefended(spread.id,true);resolveVictim(spread.id,'dead',true);assert.equal(iData().people.lion.status,'dead');
const dragon=batch.find(a=>a.target==='rito');
assert.equal(iData().people.rito.status,'alive');assert(iUnresolved());
const helena=batch.find(a=>a.target==='helena');markUndefended(helena.id,true);resolveVictim(helena.id,'dead',true);
assert(!iUnresolved());
`);
test('Spread validates three targets and item, cancellation and undo are atomic', `
assert.throws(()=>addSpreadPoison('maria',['lion','helena'],true),/3人/);
assert.throws(()=>addSpreadPoison('maria',['lion','lion','rito'],true),/3人/);
assert.throws(()=>addSpreadPoison('maria',['lion','helena','rito'],false),/確認/);
addDefense('gail','maria',2,true);
addSpreadPoison('gail',['lion','helena','rito'],true);assert.equal(iUsed('gail'),0);
let a=iNext();cancelAttack(a.id);assert(!iUnresolved());undoIntrigue();
a=iNext();startAttack(a.id,true);assert.equal(iData().actions.filter(a=>a.status==='active').length,2);
undoIntrigue();assert.equal(iData().actions.filter(a=>a.status==='queued').length,3);
setIntriguePerson('gail','status','dead');assert.throws(()=>startAttack(a.id,true),/死亡/);
`);
test('Sequential starts, killed queued actors and R3 unresolved-action lock', `
state.roundIndex=3;
addAttack('lion','helena','physical','ナイフ',true);addAttack('helena','gail','physical','騎士の剣',true);
assert.equal(finalizeRound(),false);
const first=iNext();startAttack(first.id,true);assert(!iNext());
markUndefended(first.id,true);resolveVictim(first.id,'dead',true);
const next=iNext();assert.throws(()=>startAttack(next.id,true),/死亡/);cancelAttack(next.id);
assert(!iUnresolved());assert(finalizeRound());
assert.throws(()=>setIntriguePerson('lion','status','dead'),/確定済み/);
assert(undoRound(3));assert(!iLocked());
`);
test('Cross retirement, Maester death from attack, reload and undo', `
setIntriguePerson('lion','detained',true);setIntriguePerson('gail','cross',true);
addAttack('sebastian','maester','physical','ナイフ',true);const a=iNext();startAttack(a.id,true);
markUndefended(a.id,true);resolveVictim(a.id,'dead',true);assert(!iBound('lion'));
save();initDefaults();load();assert(!iBound('lion'));assert.equal(iData().people.maester.status,'dead');
undoIntrigue();assert(iBound('lion'));assert.equal(iData().actions.find(x=>x.id===a.id).status,'awaiting');
resolveVictim(a.id,'dead',true);
addAttack('lion','gail','physical','ナイフ',true);const b=iNext();startAttack(b.id,true);markUndefended(b.id,true);resolveVictim(b.id,'retired',true);
assert.equal(iData().people.gail.status,'retired');assert(!charEligible('gail',3));
`);
test('Reset clears intrigue and GM changes retain undo history', `
setIntriguePerson('lion','status','dead');assert.equal(iData().history.length,1);
initDefaults();assert.equal(iData().people.lion.status,'alive');assert.equal(iData().history.length,0);
`);
test('Dragon ash preserves life, removes only resistances for all five dragons', `
for(const target of ['rito','rata','ruri','il','reni']){
  initDefaults();
  addAttack('lion',target,'physical','ナイフ',true,[],true);
  const a=iNext();startAttack(a.id,true);
  const self=iData().defenses.find(d=>d.id==='self_'+target),remaining=self?.remaining;
  assert(!defenseCandidates(a).some(d=>d.id==='self_'+target&&d.enabled));
  assert.throws(()=>markUndefended(a.id,false),/確認/);
  assert(!iDragonSealed(target));markUndefended(a.id,true);
  assert(iDragonSealed(target));assert.equal(iData().people[target].status,'alive');
  assert.equal(iData().actions.find(x=>x.id===a.id).status,'done');assert(!iUnresolved());
  assert(charEligible(target,3));assert.equal(iUnavailable(target),'');
  if(self)assert.equal(iData().defenses.find(d=>d.id===self.id).remaining,remaining);
  const poison=defenseCandidates({target,actor:'yuris',method:'poison'}).find(x=>x.id==='immunity');
  assert(poison&&!poison.enabled);assert(!iUnbound(target));
  setIntriguePerson(target,'detained',true);assert(iBound(target));
  iCommit('release',d=>{d.mariaRelease=true;});assert(charEligible(target,3));
}
`);
test('Ash status persists, undo restores resistances, skills remain usable', `
addAttack('lion','rito','physical','ナイフ',true,[],true);const a=iNext();startAttack(a.id,true);markUndefended(a.id,true);
save();initDefaults();load();assert(iDragonSealed('rito'));assert(charEligible('rito',3));
undoIntrigue();assert(!iDragonSealed('rito'));assert(iUnbound('rito'));
assert.equal(iData().defenses.find(d=>d.id==='self_rito').remaining,3);
markUndefended(a.id,true);addAttack('rito','lion','physical','不要（氷結）',true);
assert.equal(iUsed('rito'),2);
`);
test('External defense blocks ash without sealing, invalid ash targets rejected', `
assert.throws(()=>addAttack('lion','maester','physical','ナイフ',true,[],true),/竜の血族/);
assert.throws(()=>addAttack('lion','rito','poison','速攻毒',true,[],true),/物理攻撃/);
addDefense('emil','reni',1,true);addAttack('lion','reni','physical','ナイフ',true,[],true);
const a=iNext();startAttack(a.id,true);const d=defenseCandidates(a).find(d=>d.enabled&&d.id.startsWith('def_'));
chooseDefense(a.id,d.id,true);assert(!iDragonSealed('reni'));assert(iUnbound('reni'));
assert.equal(iData().people.reni.status,'alive');assert.equal(iData().defenses.find(x=>x.id===d.id).remaining,0);
`);
test('Used skills cannot register twice; queued edits preserve position and limits', `
addAttack('lion','rito','physical','ナイフ',true);const id=iNext().id;
assert(skillRegistrationReason('lion','attack'));
assert.throws(()=>addAttack('lion','helena','physical','ナイフ',true),/使い切/);
addAttack('lion','reni','physical','ナイフ',true,[],false,id);
assert.equal(iNext().id,id);assert.equal(iNext().target,'reni');assert.equal(iUsed('lion'),1);
addAttack('sebastian','rito','physical','ナイフ',true);
assert.throws(()=>addAttack('sebastian','helena','physical','ナイフ',true,[],false,id),/使い切/);
assert.equal(iData().actions.find(a=>a.id===id).actor,'lion');
startAttack(id,true);
assert(skillRegistrationReason('lion','attack'));
assert.throws(()=>addAttack('lion','rito','physical','ナイフ',true,[],false,id),/執行済み/);
`);
test('Guard corrections do not refill consumed skills; unused cancellation frees slot', `
addDefense('maria','lion',2,true);const d=iData().defenses.find(d=>d.provider==='maria');
assert(skillRegistrationReason('maria','guard'));
addDefense('maria','serin',2,true,d.id);
assert.equal(iGuards('maria'),2);assert.equal(iData().defenses.find(x=>x.id===d.id).target,'serin');
assert.throws(()=>addDefense('maria','rito',2,true,d.id),/スカーレット/);
removeDefense(d.id);assert.equal(iGuards('maria'),0);assert(!skillRegistrationReason('maria','guard'));
undoIntrigue();assert.equal(iGuards('maria'),2);
addAttack('lion','serin','physical','ナイフ',true);const a=iNext();startAttack(a.id,true);chooseDefense(a.id,d.id,true);
assert.throws(()=>addDefense('maria','lion',2,true,d.id),/使用済み/);
assert.throws(()=>removeDefense(d.id),/使用済み/);
assert.equal(iData().defenses.find(x=>x.id===d.id).remaining,1);
`);
test('Il pending second attack cost follows edits and cancellation', `
addAttack('il','rito','physical','クナイ',true);const first=iNext().id;
addAttack('il','reni','physical','クナイ',true);const second=iData().actions.at(-1).id;
assert(iData().actions.find(x=>x.id===second).sacrifice);
addAttack('il','rata','physical','クナイ',true,[],false,first);
assert(!iData().actions.find(x=>x.id===first).sacrifice);assert(iData().actions.find(x=>x.id===second).sacrifice);
cancelAttack(first);assert(!iData().actions.find(x=>x.id===second).sacrifice);
`);
test('Gail supports split guards, mixed actions in either order, and two kills', `
for(const mode of ['split','same','guardKill','killGuard','kills']){
  initDefaults();
  if(mode==='split'){addDefense('gail','gail',1,true);addDefense('gail','lion',1,true);assert.equal(iData().defenses.filter(d=>d.provider==='gail').length,2);}
  if(mode==='same')addDefense('gail','lion',2,true);
  if(mode==='guardKill'){addDefense('gail','lion',1,true);addAttack('gail','helena','physical','聖剣',true);}
  if(mode==='killGuard'){addAttack('gail','helena','physical','聖剣',true);addDefense('gail','lion',1,true);}
  if(mode==='kills'){addAttack('gail','helena','physical','聖剣',true);addAttack('gail','lion','physical','聖剣',true);}
  assert.equal(iGuards('gail')+iUsed('gail'),2);
  assert(skillRegistrationReason('gail','attack'));assert(skillRegistrationReason('gail','guard'));
  assert.throws(()=>addAttack('gail','rito','physical','聖剣',true));
  assert.throws(()=>addDefense('gail','rito',1,true));
}
initDefaults();assert.throws(()=>addAttack('gail','lion','physical','ナイフ',true),/必要武器/);
assert.throws(()=>addAttack('gail','lion','physical','聖剣',false),/確認/);
addDefense('gail','lion',1,false);
assert(defenseCandidates({actor:'sebastian',target:'lion',method:'physical'}).find(d=>d.name.includes('筆頭騎士')).enabled);
`);
test('Gail guard edit and cancellation retain shared action accounting', `
addDefense('gail','lion',1,true);const d=iData().defenses.find(d=>d.provider==='gail');
addAttack('gail','rito','physical','聖剣',true);
addDefense('gail','maria',1,true,d.id);assert.equal(iUsed('gail')+iGuards('gail'),2);
assert.throws(()=>addDefense('gail','maria',2,true,d.id),/合計2回/);
removeDefense(d.id);assert(!skillRegistrationReason('gail','guard'));undoIntrigue();
assert(skillRegistrationReason('gail','guard'));save();initDefaults();load();assert.equal(iUsed('gail')+iGuards('gail'),2);
`);
test('Lorentz only faces death adjudication when his second guard is actually used', `
addDefense('lorentz','lion',2,true);const d=iData().defenses.find(d=>d.provider==='lorentz');
assert(!iData().actions.some(a=>a.kind==='cost'));
addAttack('gail','lion','physical','聖剣',true);let a=iNext();startAttack(a.id,true);chooseDefense(a.id,d.id,true);
assert.equal(iData().people.lorentz.status,'alive');assert(!iData().actions.some(a=>a.kind==='cost'));
addAttack('gail','lion','physical','聖剣',true);a=iNext();startAttack(a.id,true);
defenseCandidates(a);assert(!iData().actions.some(a=>a.kind==='cost'));
chooseDefense(a.id,d.id,true);assert.equal(iData().people.lorentz.status,'alive');
assert.equal(iNext().kind,'cost');assert.equal(iNext().target,'lorentz');
undoIntrigue();assert(!iData().actions.some(a=>a.kind==='cost'));
assert.equal(iData().defenses.find(x=>x.id===d.id).remaining,1);
assert(!iData().actions.some(a=>a.kind==='cost'));
assert.equal(iData().people.lorentz.status,'alive');
`);
test('Hexagram applies at execution time, never retroactively to poison', `
addAttack('yuris','lion','poison','錬成毒',true);const first=iNext();startAttack(first.id,true);
markUndefended(first.id,true);resolveVictim(first.id,'dead',true);
const past=JSON.stringify(iData().actions.find(a=>a.id===first.id));
addHexagram('yuris',['creations'],true);assert(!iHexEffect());assert.equal(iUsed('yuris'),1);
const hex=iNext();startAttack(hex.id,true);assert(iHexEffect('creations'));
assert.equal(JSON.stringify(iData().actions.find(a=>a.id===first.id)),past);
assert.equal(iData().people.lion.status,'dead');
addAttack('sebastian','helena','poison','速攻毒',true);const next=iNext();startAttack(next.id,true);
assert(defenseCandidates(iData().actions.find(a=>a.id===next.id)).find(d=>d.id==='nullified').enabled);
chooseDefense(next.id,'nullified',true);assert.equal(iData().people.helena.status,'alive');
addSpreadPoison('maria',['helena','gail','rito'],true);startAttack(iNext().id,true);
for(const a of iData().actions.filter(a=>a.kind==='spread'))assert(defenseCandidates(a).find(d=>d.id==='nullified').enabled);
`);
test('Hexagram restricts user and item; selective effects restore on undo and reload', `
assert.throws(()=>addHexagram('noelis',['castle'],true),/エミールかユリス/);
assert.throws(()=>addHexagram('emil',['castle'],false),/確認/);
assert.throws(()=>addHexagram('emil',[],true),/破壊対象/);
addHexagram('emil',['castle','sword'],true);
assert.throws(()=>addHexagram('yuris',['creations'],true),/登録済み/);
const hex=iNext();assert.equal(wallBonus('セントラル',3),100);
startAttack(hex.id,true);assert.equal(wallBonus('セントラル',3),0);assert.equal(wallBonus('セントラル',2),100);
assert(!charEligible('lorentz',3));assert.equal(iData().people.lorentz.status,'alive');assert(!iHexEffect('creations'));
save();initDefaults();load();assert(iHexEffect('castle'));undoIntrigue();
assert.equal(wallBonus('セントラル',3),100);assert(charEligible('lorentz',3));assert(!iHexEffect());
cancelAttack(hex.id);assert(!iUnresolved());addHexagram('yuris',['creations'],true);
`);
test('Destroyed creations block flowers and medicine after hexagram', `
addDefense('emil','lion',1,true);setIntriguePerson('lion','antidote',true);
addHexagram('emil',['creations'],true);startAttack(iNext().id,true);
addAttack('sebastian','lion','physical','ナイフ',true);const a=iNext();startAttack(a.id,true);
const flower=defenseCandidates(iData().actions.find(x=>x.id===a.id)).find(d=>d.name.includes('黒の花'));
assert(flower&&!flower.enabled);assert.match(flower.reason,/破壊/);
assert(iData().actions.find(x=>x.id===a.id).medicineDisabled);
`);
test('Automatic poison watch blocks all three spread victims with one trigger', `
addDefense('ruri','maria',1,false);addSpreadPoison('maria',['lion','helena','gail'],true);
const first=iNext();startAttack(first.id,true);
assert.equal(iData().actions.filter(a=>a.kind==='spread'&&a.status==='done').length,3);
assert.equal(iData().defenses.find(d=>d.kind==='watch').remaining,0);
assert(!iUnresolved());assert(['lion','helena','gail','ruri'].every(id=>iData().people[id].status==='alive'));
undoIntrigue();assert.equal(iData().defenses.find(d=>d.kind==='watch').remaining,1);
assert.equal(iData().actions.filter(a=>a.status==='queued').length,3);
`);
test('Sealed Ruri receives redirected poison; dead Ruri cannot trigger watch', `
addDefense('ruri','sebastian',1,true);
iCommit('seal',d=>{d.people.ruri.dragonSealed=true;});
addAttack('sebastian','helena','poison','速攻毒',true);startAttack(iNext().id,true);
const redirected=iData().actions.find(a=>a.kind==='watchPoison');assert(redirected);assert.equal(redirected.target,'ruri');
assert.equal(iData().people.helena.status,'alive');assert.equal(redirected.status,'active');
assert(!defenseCandidates(redirected).find(d=>d.id==='immunity').enabled);
initDefaults();addDefense('ruri','sebastian',1,true);setIntriguePerson('ruri','status','dead');
addAttack('sebastian','helena','poison','速攻毒',true);startAttack(iNext().id,true);
assert.equal(iData().defenses.find(d=>d.kind==='watch').remaining,1);
assert.equal(iData().actions[0].status,'active');
`);
test('Ruri watches only the first poison action, in either basic/spread order', `
for(const spreadFirst of [false,true]){
  initDefaults();addDefense('ruri','yuris',1,true);
  if(spreadFirst){addSpreadPoison('yuris',['lion','helena','gail'],true);addAttack('yuris','sebastian','poison','錬成毒',true);}
  else{addAttack('yuris','sebastian','poison','錬成毒',true);addSpreadPoison('yuris',['lion','helena','gail'],true);}
  startAttack(iNext().id,true);
  const watch=iData().defenses.find(d=>d.kind==='watch');assert.equal(watch.remaining,0);
  const protectedCount=iData().actions.filter(a=>a.automaticDefense===watch.id).length;
  assert.equal(protectedCount,spreadFirst?3:1);
  const second=iNext();assert(second);startAttack(second.id,true);
  assert.equal(iData().actions.filter(a=>a.automaticDefense===watch.id).length,protectedCount);
  assert.equal(iData().actions.find(a=>a.id===second.id).status,'active');
  save();initDefaults();load();assert.equal(iData().defenses.find(d=>d.kind==='watch').remaining,0);
}
`);
test('Old unconfirmed guard data remains eligible, confirming use consumes only once', `
addDefense('gail','lion',1,false);const guard=iData().defenses.find(d=>d.provider==='gail');
addAttack('sebastian','lion','physical','ナイフ',true);const a=iNext();startAttack(a.id,true);
assert(defenseCandidates(iData().actions.find(x=>x.id===a.id)).find(x=>x.id===guard.id).enabled);
assert.throws(()=>chooseDefense(a.id,guard.id,false),/確認/);assert.equal(iData().defenses.find(x=>x.id===guard.id).remaining,1);
chooseDefense(a.id,guard.id,true);assert.equal(iData().defenses.find(x=>x.id===guard.id).remaining,0);
assert.throws(()=>chooseDefense(a.id,guard.id,true),/処理中/);
assert(!defenseCandidates({actor:'sebastian',target:'lion',method:'physical'}).find(x=>x.id===guard.id).enabled);
`);
test('Antidote submission at resolution needs no preregistration and records one item', `
assert(!iData().people.helena.antidote);
addAttack('yuris','helena','poison','錬成毒',true);const a=iNext();startAttack(a.id,true);markUndefended(a.id,true);
assert.throws(()=>resolveVictim(a.id,'antidote',false),/確認/);
resolveVictim(a.id,'antidote',true);assert.equal(iData().people.helena.status,'alive');
assert.equal(iData().actions.find(x=>x.id===a.id).consumedItem,'毒治療薬');
assert.equal(iData().actions.find(x=>x.id===a.id).itemCount,1);
assert.throws(()=>resolveVictim(a.id,'antidote',true),/死亡確定待ち/);
undoIntrigue();assert.equal(iData().actions.find(x=>x.id===a.id).consumedItem,undefined);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'awaiting');
iCommit('medicine disabled at attack',d=>{d.actions.find(x=>x.id===a.id).medicineDisabled=true;});
assert.throws(()=>resolveVictim(a.id,'antidote',true),/使用できません/);
initDefaults();addAttack('lion','helena','physical','ナイフ',true);const b=iNext();startAttack(b.id,true);markUndefended(b.id,true);
assert.throws(()=>resolveVictim(b.id,'antidote',true),/使用できません/);
`);
test('Innate physical defenses need no item, while crystal defenses retain item labels', `
for(const target of ['rito','reni']){
  const candidate=defenseCandidates({actor:'lion',target,method:'physical'}).find(d=>d.id==='self_'+target);
  assert(candidate.enabled);assert.equal(candidate.item,'');assert.match(candidate.reason,/アイテム不要/);
}
assert(defenseCandidates({actor:'lion',target:'karuna',method:'physical'}).find(d=>d.id==='self_karuna').item);
`);
test('Antidote can be received from anyone during active poison without awaiting step', `
addAttack('yuris','helena','poison','錬成毒',true);const a=iNext();startAttack(a.id,true);
assert(!iData().people.helena.antidote);assert.equal(iData().actions.find(x=>x.id===a.id).status,'active');
resolveVictim(a.id,'antidote',true);assert.equal(iData().people.helena.status,'alive');assert(!iUnresolved());
assert.equal(iData().actions.find(x=>x.id===a.id).consumedItem,'毒治療薬');
undoIntrigue();assert.equal(iData().actions.find(x=>x.id===a.id).status,'active');
iCommit('medicine disabled',d=>{d.actions.find(x=>x.id===a.id).medicineDisabled=true;});
assert.throws(()=>resolveVictim(a.id,'antidote',true),/使用できません/);
`);
test('Detention blocks every registered guard including independent soldiers and flowers', `
for(const provider of ['maria','gentoku','emil','noelis','gail','lorentz']){
  initDefaults();addDefense(provider,'lion',1,true);const d=iData().defenses.find(x=>x.provider===provider&&x.kind!=='self');
  setIntriguePerson(provider,'detained',true);
  addAttack('sebastian','lion','physical','ナイフ',true);const a=iNext();startAttack(a.id,true);
  const candidate=defenseCandidates(iData().actions.find(x=>x.id===a.id)).find(x=>x.id===d.id);
  assert(!candidate.enabled);assert.match(candidate.reason,/拘束中/);
  assert.throws(()=>chooseDefense(a.id,d.id,true),/使用できません/);
  assert.equal(iData().defenses.find(x=>x.id===d.id).remaining,1);
  iCommit('Maria releases',data=>{data.mariaRelease=true;});
  assert(defenseCandidates(iData().actions.find(x=>x.id===a.id)).find(x=>x.id===d.id).enabled);
}
`);
test('Detained Ruri does not trigger or spend poison watch and can trigger after release', `
addDefense('ruri','yuris',1,true);setIntriguePerson('ruri','detained',true);
addAttack('yuris','helena','poison','錬成毒',true);const a=iNext();startAttack(a.id,true);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'active');
assert.equal(iData().defenses.find(x=>x.kind==='watch').remaining,1);
resolveVictim(a.id,'antidote',true);setIntriguePerson('maester','status','dead');
addSpreadPoison('yuris',['lion','helena','gail'],true);startAttack(iNext().id,true);
assert.equal(iData().actions.filter(x=>x.kind==='spread'&&x.status==='done').length,3);
assert.equal(iData().defenses.find(x=>x.kind==='watch').remaining,0);
`);
test('Rito registers and starts two strikes once; two defenses are needed', `
addDefense('maria','lion',2,true);const d=iData().defenses.find(x=>x.provider==='maria');
addAttack('rito','lion','physical','氷結',true);const a=iNext();
assert.equal(iUsed('rito'),2);assert.equal(iData().actions.length,1);
assert.throws(()=>addAttack('rito','lion','physical','氷結',true),/使い切/);
startAttack(a.id,true);chooseDefense(a.id,d.id,true);
assert.equal(iData().actions.find(x=>x.id===a.id).strikesLeft,1);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'active');assert(!iNext());
chooseDefense(a.id,d.id,true);assert.equal(iData().actions.find(x=>x.id===a.id).status,'done');
assert.equal(iData().defenses.find(x=>x.id===d.id).remaining,0);
undoIntrigue();assert.equal(iData().actions.find(x=>x.id===a.id).strikesLeft,1);
assert.equal(iData().defenses.find(x=>x.id===d.id).remaining,1);
`);
test('One innate defense does not stop both Rito strikes; edit and cancellation reserve two', `
addAttack('rito','reni','physical','氷結',true);const a=iNext();
addAttack('rito','gail','physical','氷結',true,[],false,a.id);assert.equal(iUsed('rito'),2);
addAttack('rito','reni','physical','氷結',true,[],false,a.id);
startAttack(a.id,true);
assert(!defenseCandidates(iData().actions.find(x=>x.id===a.id)).find(x=>x.id==='self_reni').enabled);
markUndefended(a.id,true);resolveVictim(a.id,'dead',true);assert.equal(iData().people.reni.status,'dead');
initDefaults();addAttack('rito','lion','physical','氷結',true);cancelAttack(iNext().id);assert.equal(iUsed('rito'),0);
`);
test('Unavailable actions advance with a recorded reason, not registration cancellation', `
addAttack('lion','helena','physical','ナイフ',true);const first=iNext();
assert.throws(()=>skipUnavailableAction(first.id),/実行可能/);
setIntriguePerson('lion','status','retired');skipUnavailableAction(first.id);
assert.equal(iData().actions[0].status,'skipped');assert.match(iData().actions[0].result,/出家/);
assert(!iUnresolved());undoIntrigue();assert.equal(iData().actions[0].status,'queued');
assert.equal(iData().people.lion.status,'retired');
skipUnavailableAction(first.id);save();initDefaults();load();assert.equal(iData().actions[0].status,'skipped');
`);
test('Retired spread caster skips entire group; skipped hexagram has no effects', `
addSpreadPoison('maria',['lion','helena','gail'],true);setIntriguePerson('maria','status','retired');
skipUnavailableAction(iNext().id);assert.equal(iData().actions.filter(a=>a.status==='skipped').length,3);assert(!iUnresolved());
addHexagram('emil',['castle','creations'],true);setIntriguePerson('emil','status','dead');
skipUnavailableAction(iNext().id);assert(!iHexEffect());assert.equal(wallBonus('セントラル',3),100);assert(!iUnresolved());
`);
test('Automatic watch notice names attacker and all protected victims, undo removes it', `
assert.equal(renderAutomaticWatchNotice(),'');
addDefense('ruri','yuris',1,true);addSpreadPoison('yuris',['lion','helena','gail'],true);
startAttack(iNext().id,true);const notice=renderAutomaticWatchNotice();
for(const name of ['ルリ','ユリス','リオン','ヘレナ','ゲイル','毒見が発動','対象3人','生存'])assert(notice.includes(name));
save();initDefaults();load();assert(renderAutomaticWatchNotice().includes('毒見が発動'));
undoIntrigue();assert.equal(renderAutomaticWatchNotice(),'');
`);
test('Maria release applies in sequence without reviving earlier skipped actions', `
addAttack('lion','helena','physical','ナイフ',true);
addMariaRelease(['lion','gail']);const release=iData().actions.find(a=>a.kind==='release');
addAttack('gail','helena','physical','聖剣',true);
setIntriguePerson('lion','detained',true);setIntriguePerson('gail','detained',true);
assert(iBound('lion'));assert(iBound('gail'));assert.throws(()=>startAttack(release.id,true),/前の行動/);
const earlier=iNext();skipUnavailableAction(earlier.id);assert(iBound('gail'));
startAttack(release.id,true);assert(!iBound('lion'));assert(!iBound('gail'));
assert.equal(iData().actions.find(a=>a.id===earlier.id).status,'skipped');
undoIntrigue();assert(iBound('gail'));assert.equal(iNext().id,release.id);
startAttack(release.id,true);save();initDefaults();load();assert(!iBound('gail'));
startAttack(iNext().id,true);assert.equal(iData().actions.at(-1).status,'active');
`);
test('Cancelling Maria release does not lift detention', `
setIntriguePerson('lion','detained',true);addMariaRelease(['lion']);assert.throws(()=>addMariaRelease(['lion']),/登録/);
cancelAttack(iNext().id);assert(iBound('lion'));assert(!iUnresolved());addMariaRelease(['lion']);assert(iBound('lion'));
`);
test('Maria releases only selected detainees and may release others later', `
for(const id of ['lion','gail','ruri'])setIntriguePerson(id,'detained',true);
assert.throws(()=>addMariaRelease([]),/選んで/);
addMariaRelease(['lion']);startAttack(iNext().id,true);
assert(!iBound('lion'));assert(iBound('gail'));assert(iBound('ruri'));
addMariaRelease(['gail','ruri']);const second=iNext();assert(iBound('gail'));startAttack(second.id,true);
assert(!iBound('gail'));assert(!iBound('ruri'));undoIntrigue();
assert(!iBound('lion'));assert(iBound('gail'));assert(iBound('ruri'));
save();initDefaults();load();assert(!iBound('lion'));assert(iBound('gail'));
`);
test('Innate defense auto-consumes, reports, restores on undo and leaves guards untouched', `
addDefense('emil','reni',1,false);const flower=iData().defenses.find(d=>d.provider==='emil');
addAttack('lion','reni','physical','ナイフ',true);const a=iNext();startAttack(a.id,true);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'done');
assert.equal(iData().defenses.find(d=>d.id==='self_reni').remaining,0);
assert.equal(iData().defenses.find(d=>d.id===flower.id).remaining,1);
assert(renderInnateNotice().includes('レニ'));assert(renderInnateNotice().includes('自動で防ぎました'));
save();initDefaults();load();assert(renderInnateNotice().includes('竜の身体'));
undoIntrigue();assert.equal(renderInnateNotice(),'');assert.equal(iData().defenses.find(d=>d.id==='self_reni').remaining,1);
startAttack(a.id,true);addAttack('sebastian','reni','physical','ナイフ',true);const second=iNext();startAttack(second.id,true);
assert.equal(iData().actions.find(x=>x.id===second.id).status,'active');
assert(!iData().actions.find(x=>x.id===second.id).automaticInnate);
`);
test('Ash disables automatic innate protection while crystal item defenses stay manual', `
iCommit('seal',d=>{d.people.rito.dragonSealed=true;});
addAttack('yuris','rito','poison','錬成毒',true);const a=iNext();startAttack(a.id,true);
assert.equal(iData().actions.find(x=>x.id===a.id).status,'active');assert.equal(renderInnateNotice(),'');
initDefaults();addAttack('lion','karuna','physical','ナイフ',true);startAttack(iNext().id,true);
assert.equal(iData().actions[0].status,'active');assert.equal(iData().defenses.find(d=>d.id==='self_karuna').remaining,1);
`);
test('Rito full manifestation targets both sides after battle, preserving frozen results', `
state.roundIndex=3;state.charsMeta.rito.flags.ritoFull=true;
state.rounds[3].chars.rito.placed={field:'金華',side:'攻撃'};
state.rounds[3].chars.lion.placed={field:'金華',side:'攻撃'};
state.rounds[3].chars.helena.placed={field:'金華',side:'防衛'};
state.rounds[3].chars.reni.placed={field:'ノースランド',side:'防衛'};
addDefense('maria','lion',2,true);
assert.equal(ritoFullTargets().length,2);assert(finalizeRound());
const battle=JSON.stringify(state.finalizations[3]);
assert.equal(state.finalizations[3].ritoVictims.length,2);startRitoWarDeaths();
assert.throws(()=>startRitoWarDeaths(),/開始済み/);
assert.throws(()=>setIntriguePerson('gail','status','dead'),/確定済み/);
const lion=iData().actions.find(a=>a.kind==='ritoWar'&&a.target==='lion');
const helena=iData().actions.find(a=>a.kind==='ritoWar'&&a.target==='helena');
chooseDefense(lion.id,iData().defenses.find(d=>d.provider==='maria').id,true);
markUndefended(helena.id,true);resolveVictim(helena.id,'dead',true);
assert.equal(iData().people.helena.status,'dead');assert.equal(iData().people.lion.status,'alive');
assert.equal(JSON.stringify(state.finalizations[3]),battle);
save();initDefaults();load();assert.equal(iData().people.helena.status,'dead');
undoIntrigue();assert.equal(iData().people.helena.status,'alive');assert.equal(iData().actions.find(a=>a.id===helena.id).status,'awaiting');
undoRound(3);assert(!iData().ritoWarStarted);assert(!iData().actions.some(a=>a.postWar));
`);
test('Rito normal form, absence, death and other fields do not select victims', `
state.roundIndex=3;state.rounds[3].chars.rito.placed={field:'金華',side:'攻撃'};
state.rounds[3].chars.helena.placed={field:'金華',side:'防衛'};
assert.equal(ritoFullTargets().length,0);state.charsMeta.rito.flags.ritoFull=true;
setIntriguePerson('helena','status','retired');assert.equal(ritoFullTargets().length,0);
setIntriguePerson('helena','status','alive');setIntriguePerson('rito','status','dead');assert.equal(ritoFullTargets().length,0);
`);
test('Postwar guard eligibility is simultaneous and sacrifice cost remains resolvable', `
state.roundIndex=3;state.charsMeta.rito.flags.ritoFull=true;
for(const id of ['rito','lion','lorentz'])state.rounds[3].chars[id].placed={field:'金華',side:'攻撃'};
addDefense('lorentz','lion',2,true);const d=iData().defenses.find(d=>d.provider==='lorentz');
addAttack('sebastian','lion','physical','ナイフ',true);let a=iNext();startAttack(a.id,true);chooseDefense(a.id,d.id,true);
assert(finalizeRound());startRitoWarDeaths();
const own=iData().actions.find(a=>a.kind==='ritoWar'&&a.target==='lorentz');markUndefended(own.id,true);resolveVictim(own.id,'dead',true);
const lion=iData().actions.find(a=>a.kind==='ritoWar'&&a.target==='lion');
assert(defenseCandidates(lion).find(x=>x.id===d.id).enabled);chooseDefense(lion.id,d.id,true);
const cost=iNext();assert(cost.postWar);skipUnavailableAction(cost.id);assert(!iUnresolved());
`);
vm.runInContext('initDefaults();var beforeFailure=JSON.stringify(state);',context);fail=true;
vm.runInContext("assert.equal(setIntriguePerson('lion','status','dead'),false);assert.equal(JSON.stringify(state),beforeFailure);",context);
count++;console.log('PASS save failure rolls back intrigue changes');
console.log(count+' intrigue scenario groups passed.');
