/* Mills Maths Tools — Counting Strategies for Linear Relationships: the worded problems.
   ONE shared file, loaded by the teaching tool AND the worksheet creator, so a story added here
   appears in both. Plain script: window.MMT_CL_CTX.

   A story is a counting instruction in disguise: "Jimmy started with $25 but spent $2 every hour on
   lollies" is "Start at 25, count down by 2s", and y = 25 − 2x. Each context says which way it goes,
   what x and y are, and what kind of numbers make sense for it. make() picks the numbers to suit the
   level, and refuses numbers the story could not have (a battery above 100%, money going below zero
   inside the table). */
(function(){
  'use strict';

  // ---------- the number tiers, by kind of quantity ----------
  // s = range for the start, d = the amounts it may change by each step
  var P = {
    money:   { sweet:{s:[2,20],  d:[2,3,4,5]}, mild:{s:[5,50], d:[2,3,4,5,6,8,10]}, medium:{s:[20,150], d:[5,6,8,12,15,20,25]}, spicy:{s:[5,60], d:[0.5,1.5,2.5,1.25,3.5,0.75]} },
    count:   { sweet:{s:[2,15],  d:[2,3,4,5]}, mild:{s:[5,40], d:[2,3,4,5,6,7,8,9,10]}, medium:{s:[20,150], d:[6,8,11,12,15,20,25]}, spicy:{s:[50,400], d:[12,15,24,35,45,60,75]} },
    measure: { sweet:{s:[2,15],  d:[2,3,4,5]}, mild:{s:[5,40], d:[2,3,4,5,6,8,10]}, medium:{s:[10,120], d:[5,6,8,12,15,20]}, spicy:{s:[2,40], d:[0.5,1.5,2.5,0.2,0.25,1.2]} },
    temp:    { sweet:{s:[0,12],  d:[1,2,3]},   mild:{s:[0,20], d:[1,2,3,4]}, medium:{s:[-10,15], d:[2,3,4,5]}, spicy:{s:[-12,12], d:[0.5,1.5,2.5]} },
    big:     { sweet:{s:[10,100],d:[10,20,50]}, mild:{s:[50,500], d:[20,25,50,100]}, medium:{s:[100,2000], d:[50,75,100,150,250]}, spicy:{s:[200,3000], d:[125,175,225,350]} },
    percent: { sweet:{s:[60,100],d:[2,3,4,5]}, mild:{s:[60,100], d:[2,3,4,5,6,8,10]}, medium:{s:[60,100], d:[3,4,5,6,8,10]}, spicy:{s:[60,100], d:[0.5,1.5,2.5,1.2]} }
  };

  // ---------- the stories ----------
  // {n} a name, {a} the start, {b} the change each step. x and y are what goes on the table and axes.
  var CONTEXTS = [
    // going up
    { id:'savings',    dir:'up',   kind:'money',   title:'Savings',            x:'weeks',      y:'savings ($)',          t:'{n} has {a} in the bank and saves {b} every week.' },
    { id:'phone',      dir:'up',   kind:'money',   title:'Phone plan',         x:'months',     y:'total cost ($)',       t:'A phone plan costs {a} to join, then {b} every month.' },
    { id:'taxi',       dir:'up',   kind:'money',   title:'Taxi fare',          x:'kilometres', y:'fare ($)',             t:'A taxi charges {a} to start the trip, then {b} for every kilometre.' },
    { id:'gym',        dir:'up',   kind:'money',   title:'Gym',                x:'visits',     y:'total cost ($)',       t:'A gym charges a {a} joining fee, then {b} for every visit.' },
    { id:'carhire',    dir:'up',   kind:'money',   title:'Car hire',           x:'days',       y:'cost ($)',             t:'A car hire company charges {a} up front, then {b} for every day.' },
    { id:'fundraiser', dir:'up',   kind:'money',   title:'Fun run',            x:'laps',       y:'money raised ($)',     t:'{n} has raised {a} so far and is sponsored {b} for every lap.' },
    { id:'giftcard',   dir:'up',   kind:'money',   title:'Gift card',          x:'weeks',      y:'money on the card ($)',t:'{n} has {a} on a gift card and adds {b} to it every week.' },
    { id:'seedling',   dir:'up',   kind:'measure', title:'Seedling',           x:'weeks',      y:'height (cm)',          t:'A seedling is {a} tall and grows {b} every week.', suf:' cm' },
    { id:'bucket',     dir:'up',   kind:'measure', title:'Filling a bucket',   x:'minutes',    y:'water (L)',            t:'A bucket already holds {a} of water, and a tap adds {b} every minute.', suf:' L' },
    { id:'train',      dir:'up',   kind:'big',     title:'Train',              x:'hours',      y:'distance (km)',        t:'A train is {a} from the station and travels {b} further every hour.', suf:' km' },
    { id:'snow',       dir:'up',   kind:'measure', title:'Snowfall',           x:'hours',      y:'snow depth (cm)',      t:'There is {a} of snow on the ground, and {b} more falls every hour.', suf:' cm' },
    { id:'stamps',     dir:'up',   kind:'count',   title:'Stamp collection',   x:'months',     y:'stamps',               t:'{n} has {a} stamps and collects {b} more every month.' },
    { id:'pages',      dir:'up',   kind:'count',   title:'Reading',            x:'nights',     y:'pages read',           t:'{n} has already read {a} pages and reads {b} more every night.' },
    { id:'queue',      dir:'up',   kind:'count',   title:'Queue',              x:'minutes',    y:'people',               t:'There are {a} people in a queue, and {b} more join every minute.' },
    { id:'tower',      dir:'up',   kind:'count',   title:'Block tower',        x:'turns',      y:'blocks',               t:'A tower has {a} blocks, and {n} adds {b} more every turn.', lv:{spicy:'medium'} },
    { id:'followers',  dir:'up',   kind:'big',     title:'Followers',          x:'days',       y:'followers',            t:'{n}’s channel has {a} followers and gains {b} new followers every day.' },
    { id:'plane',      dir:'up',   kind:'big',     title:'Plane climbing',     x:'minutes',    y:'height (m)',           t:'A plane is flying at {a} and climbs {b} every minute.', suf:' m' },
    { id:'sunrise',    dir:'up',   kind:'temp',    title:'Warming up',         x:'hours',      y:'temperature (°C)', t:'At sunrise it is {a}, and the temperature rises {b} every hour.', suf:'°C', neg:true },
    // going down
    { id:'lollies',    dir:'down', kind:'money',   title:'Lolly money',        x:'hours',      y:'money left ($)',       t:'{n} started with {a} but spent {b} every hour on lollies.' },
    { id:'loan',       dir:'down', kind:'money',   title:'Paying back a loan', x:'weeks',      y:'still owed ($)',       t:'{n} owes {a} and pays back {b} every week.' },
    { id:'buscard',    dir:'down', kind:'money',   title:'Bus card',           x:'trips',      y:'money left ($)',       t:'{n}’s bus card has {a} on it, and every trip costs {b}.' },
    { id:'candle',     dir:'down', kind:'measure', title:'Candle',             x:'hours',      y:'height (cm)',          t:'A candle is {a} tall and burns down {b} every hour.', suf:' cm', cap:50, lv:{mild:'sweet', medium:'sweet'} },
    { id:'tank',       dir:'down', kind:'measure', title:'Leaking tank',       x:'days',       y:'water (L)',            t:'A water tank holds {a} and leaks {b} every day.', suf:' L' },
    { id:'petrol',     dir:'down', kind:'measure', title:'Petrol',             x:'hours',      y:'petrol (L)',           t:'A car has {a} of petrol in the tank and uses {b} every hour.', suf:' L', cap:70, lv:{mild:'sweet', medium:'sweet'} },
    { id:'hike',       dir:'down', kind:'measure', title:'Hike to the hut',    x:'hours',      y:'distance to the hut (km)', t:'A hiker is {a} from the hut and walks {b} closer every hour.', suf:' km', lv:{mild:'sweet', medium:'mild'} },
    { id:'paint',      dir:'down', kind:'measure', title:'Paint',              x:'fence panels', y:'paint left (L)',     t:'A tin holds {a} of paint, and {b} is used for every fence panel.', suf:' L' },
    { id:'battery',    dir:'down', kind:'percent', title:'Phone battery',      x:'hours',      y:'battery (%)',          t:'A phone battery is at {a} and drops {b} every hour.', suf:'%', cap:100 },
    { id:'pizza',      dir:'down', kind:'count',   title:'Pizza party',        x:'minutes',    y:'slices left',          t:'A party starts with {a} slices of pizza, and {b} slices are eaten every minute.', lv:{medium:'mild', spicy:'mild'} },
    { id:'tickets',    dir:'down', kind:'count',   title:'Concert tickets',    x:'minutes',    y:'tickets left',         t:'A concert has {a} tickets left, and {b} are sold every minute.' },
    { id:'biscuits',   dir:'down', kind:'count',   title:'Biscuit jar',        x:'days',       y:'biscuits left',        t:'A jar holds {a} biscuits, and {b} are eaten every day.', lv:{medium:'mild', spicy:'mild'} },
    { id:'bookleft',   dir:'down', kind:'count',   title:'Pages to go',        x:'nights',     y:'pages left',           t:'{n} has {a} pages of a book left and reads {b} pages every night.' },
    { id:'balloon',    dir:'down', kind:'big',     title:'Hot-air balloon',    x:'minutes',    y:'height (m)',           t:'A hot-air balloon is {a} above the ground and comes down {b} every minute.', suf:' m' },
    { id:'midnight',   dir:'down', kind:'temp',    title:'Cooling down',       x:'hours',      y:'temperature (°C)', t:'At midnight it is {a}, and the temperature falls {b} every hour.', suf:'°C', neg:true }
  ];
  var BY = {}; CONTEXTS.forEach(function(c){ BY[c.id] = c; });
  var NAMES = ['Jimmy','Mia','Ari','Zoe','Leo','Priya','Sam','Ruby','Kai','Noah','Isla','Jack','Mei','Ava','Tane','Lucas','Amira','Ollie'];

  // ---------- numbers ----------
  function round(n){ return Math.round(n * 1e10) / 1e10; }
  function ri(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function fmtNum(n){
    n = round(n); if(Object.is(n, -0)) n = 0;
    return String(n).replace(/^-/, '−');
  }
  // how a value is written IN THE STORY: $2.50, 12 cm, −4°C, 40%
  function fmtVal(ctx, v){
    if(ctx.kind === 'money'){
      var s = Number.isInteger(round(v)) ? String(round(Math.abs(v))) : Math.abs(v).toFixed(2);
      return (v < 0 ? '−' : '') + '$' + s;
    }
    return fmtNum(v) + (ctx.suf || '');
  }

  // Numbers for one story. rows = how many terms (x = 0 .. rows−1) must still make sense:
  // a story that cannot go below zero stays at or above zero for all of them.
  function numbersFor(ctx, level, rows){
    // lv: a story whose numbers would stop being believable at a level borrows an easier tier
    var T = (P[ctx.kind] || P.count)[(ctx.lv && ctx.lv[level]) || level];
    for(var t = 0; t < 40; t++){
      var step = pick(T.d), start;
      var dec = !Number.isInteger(step);
      if(ctx.dir === 'down' && !ctx.neg){
        var lo = step * (rows - 1);
        var spare = Math.max(4, Math.round((T.s[1] - T.s[0]) / 2));
        start = lo + ri(0, spare) * (dec ? 0.5 : 1);
        if(ctx.cap != null){
          // a battery starts fairly full: anywhere from the bottom of its range up to the cap
          if(lo > ctx.cap) continue;
          start = ri(Math.max(Math.ceil(lo), T.s[0]), ctx.cap);
        }
      } else {
        start = ri(T.s[0], T.s[1]);
        if(dec && ctx.kind === 'money' && Math.random() < .4) start += 0.5;
        if(ctx.cap != null && start > ctx.cap) start = ctx.cap;
      }
      start = round(start);
      if(start === step) continue;
      if(start === 0 && ctx.kind !== 'temp') continue;        // "already holds 0 L" is not a start worth telling
      return {start:start, step:step, dir:ctx.dir};
    }
    return null;
  }

  // A whole worded problem: {id, name, rule:{start, step, dir}}.
  // dirMode 'up' | 'down' | 'either'; avoidId keeps "New story" from repeating itself.
  function make(level, dirMode, rows, avoidId, onlyId){
    var pool = CONTEXTS.filter(function(c){
      if(onlyId) return c.id === onlyId;
      if(dirMode !== 'either' && c.dir !== dirMode) return false;
      if(c.neg && (level === 'sweet' || level === 'mild') && c.dir === 'down') return false;   // no negatives below Medium
      return c.id !== avoidId;
    });
    if(!pool.length) pool = CONTEXTS.slice();
    for(var t = 0; t < 60; t++){
      var ctx = pick(pool);
      var r = numbersFor(ctx, level, rows);
      if(!r) continue;
      if(ctx.neg && (level === 'sweet' || level === 'mild')){
        // a story that may go below zero still doesn't, until Medium
        var ok = true; for(var x = 0; x < rows; x++) if(r.start + (r.dir === 'up' ? 1 : -1) * r.step * x < 0) ok = false;
        if(!ok) continue;
      }
      return {id:ctx.id, name:pick(NAMES), rule:r};
    }
    return null;
  }

  // The story as HTML. mark(kind, text) wraps the two numbers ('start' / 'step'); default: plain.
  function storyHTML(story, mark){
    var ctx = BY[story.id], r = story.rule;
    mark = mark || function(k, s){ return s; };
    var esc = function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
    return esc(ctx.t)
      .replace('{n}', esc(story.name))
      .replace('{a}', mark('start', fmtVal(ctx, r.start)))
      .replace('{b}', mark('step', fmtVal(ctx, r.step)));
  }
  function storyText(story){ return storyHTML(story).replace(/&amp;/g,'&').replace(/&lt;/g,'<'); }

  window.MMT_CL_CTX = {
    CONTEXTS:CONTEXTS, BY:BY, NAMES:NAMES, TIERS:P,
    make:make, numbersFor:numbersFor, storyHTML:storyHTML, storyText:storyText, fmtVal:fmtVal
  };
})();
