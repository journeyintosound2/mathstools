window.__TOKENS={'tok:s:ABC123':{role:'student',studentCode:'ABC123',teacherCode:'MILLS1',className:'7A'},'tok:s:XYZ789':{role:'student',studentCode:'XYZ789',teacherCode:'MILLS1',className:'7A'},'tok:t:MILLS1':{role:'teacher',teacherCode:'MILLS1'}};
const PROF={ABC123:{studentCode:'ABC123',name:'Ava Brown',firstName:'Ava',surname:'Brown',className:'7A',teacherCode:'MILLS1',teacherName:'Mr Mills',school:'Test HS'},XYZ789:{studentCode:'XYZ789',name:'Ben Lee',firstName:'Ben',surname:'Lee',className:'7A',teacherCode:'MILLS1'}};
window.__FS={students:{ABC123:{name:'Ava Brown'},XYZ789:{name:'Ben Lee'}}};
window.__FNS={
  exchangeStudentCode:async d=>{const p=PROF[d.studentCode];if(!p)throw Object.assign(new Error('Student code not found.'),{code:'functions/not-found'});return {token:'tok:s:'+d.studentCode,profile:p}},
  exchangeTeacherCode:async d=>{if(d.teacherCode!=='MILLS1')throw Object.assign(new Error('Teacher code not found.'),{code:'functions/not-found'});return {token:'tok:t:MILLS1',profile:{teacherCode:'MILLS1',teacherName:'Mr Mills',name:'Mr Mills'}}},
  recordBinTossThrows:async (data,tok,err)=>{const c=window.BTCORE,ST=window.__FS;if(!tok||tok.role!=='student')throw err('permission-denied','sign in');
    let clean;try{clean=c.validate(data)}catch(e){throw err('invalid-argument','bad')}
    const now=Math.floor(Date.now()/1000),info={studentCode:tok.studentCode,teacherCode:tok.teacherCode,className:tok.className};
    for(const k of ['binTossStudents','binTossStats','binTossThrows'])ST[k]=ST[k]||{};
    const sDoc=ST.binTossStudents[info.studentCode]||null;const r=c.rate(sDoc,clean.throws.length,now);if(!r.ok)throw err('resource-exhausted','slow');
    info.name=(sDoc&&sDoc.name)||ST.students[info.studentCode].name;
    const cid=c.classDocId(info.teacherCode,info.className),gid='global_s'+Math.floor(Math.random()*10);
    ST.binTossStudents[info.studentCode]=c.applyStudent(sDoc,clean,info,now,r.rate);
    ST.binTossStats[cid]=c.applyClass(ST.binTossStats[cid]||null,clean,sDoc,info,now);
    ST.binTossStats[gid]=c.applyGlobal(ST.binTossStats[gid]||null,clean,now);
    ST.binTossThrows['r'+Math.random()]=c.rawBatch(clean,info,now);return {ok:true,saved:clean.throws.length}}
};
