import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate} from '../public/engine.mjs';
import {revenueNightCases,revenueNightGuide} from './revenue-night-guide.mjs';
const model=JSON.parse(fs.readFileSync('content/catalog.json')).topics.find(t=>t.slug==='revenue-per-available-night');
const rows=revenueNightCases(model);
const expected=[[120,200,60],[7200/73,200,3600/73],[120,300,40],[0,null,0],[240,300,80]];
assert.equal(rows.length,5);
for(let i=0;i<rows.length;i++){
 const r=rows[i],[ratio,rate,share]=expected[i];
 assert.ok(Math.abs(r.result-ratio)<1e-10);
 assert.equal(r.adr,rate);assert.ok(Math.abs(r.bookedShare-share)<1e-10);
 if(rate!==null)assert.ok(Math.abs(rate*share/100-ratio)<1e-10);
}
assert.equal((38000-2000+2400-4800),33600);
assert.equal(calculate(model,{revenue:33600,available:300}),112);
assert.equal((36000+24000)/(300+100),150);
assert.equal((120+240)/2,180);
assert.throws(()=>calculate(model,{revenue:60000,available:400}));
assert.throws(()=>calculate(model,{revenue:36000,available:0}));
const guide=revenueNightGuide(model);const lines=guide.csv.trim().split('\n');assert.equal(lines.length,6);
for(let i=0;i<5;i++){const c=lines[i+1].split(',');assert.equal(Number(c[7]),Number(expected[i][0].toFixed(2)));assert.equal(c[5],expected[i][1]===null?'undefined':expected[i][1].toFixed(2));}
const html=fs.readFileSync('public/library/revenue-per-available-night/index.html','utf8');
assert.equal(fs.readFileSync('public/downloads/revenue-per-available-night-cases.csv','utf8'),guide.csv);
assert.equal((html.match(/scope="row"/g)||[]).length,5);
assert.equal((html.match(/href="\/workbooks\/revenue-per-available-night\/example-/g)||[]).length,40);
for(const text of ['Not defined','a payout ratio','same wrong numerator','single-property annual model','value="50000"','value="365"','tabindex="0"'])assert.ok(html.includes(text),text);
console.log('Five independent revenue fixtures, zero-booking treatment, payout bridge, denominator weighting, invalid controls, CSV and rendered guide passed.');
