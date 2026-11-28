const apps={};
export function initializeApp(cfg,name){name=name||'[DEFAULT]';return apps[name]||(apps[name]={name,options:cfg})}
export function getApp(name){return apps[name||'[DEFAULT]']}
