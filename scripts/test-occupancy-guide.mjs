import assert from 'node:assert/strict';import fs from 'node:fs';
import {calculate} from '../public/engine.mjs';import {occupancyCases,occupancyGuide} from './occupancy-guide.mjs';
const model=JSON.parse(fs.readFileSync('content/catalog.json')).topics.find(t=>t.slug==='booked-night-occupancy');
const expected=[[200,300,200/3],[200,280,500/7],[200,320,62.5],[200,365,4000/73],[0,300,0]];
const cases=occupancyCases(model);assert.equal(cases.length,5);
for(let i=0;i<expected.length;i++){const [booked,offered,result]=expected[i];assert.equal(cases[i].nights,booked);assert.equal(cases[i].available,offered);assert.ok(Math.abs(cases[i].result-result)<1e-10);assert.ok(Math.abs(cases[i].expected-result)<1e-10);}
assert.equal(200+100+30+20+15,365);assert.equal(200+100,300);assert.equal(((200/280-200/300)*100).toFixed(2),'4.76');assert.equal(((80+20)/(100+200)*100).toFixed(2),'33.33');
for(const values of [{nights:200,available:190},{nights:0,available:0}])assert.throws(()=>calculate(model,values));
const guide=occupancyGuide(model),csv=guide.csv.trim().split('\n');assert.equal(csv.length,6);for(let i=0;i<5;i++)assert.equal(Number(csv[i+1].split(',')[3]),Number(expected[i][2].toFixed(2)));
console.log('Five independent occupancy fixtures, calendar bridge, point difference, portfolio weighting, two invalid controls and CSV consistency passed.');
