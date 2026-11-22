import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {calculate} from '../public/engine.mjs';
import {breakEvenCases,breakEvenCsv} from './break-even-guide.mjs';
const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8'));
const model=catalog.topics.find(t=>t.slug==='break-even-booked-nights');
const cases=breakEvenCases(model),expected=[[200,180,75,0],[160,225,93.75,0],[200,210,87.5,0],[200,180,112.5,4000],[156,231,96.25,0]];
assert.deepEqual(cases.map(c=>[c.contribution,c.required,c.requiredShare,c.shortfall]),expected);
for(const c of cases){assert(c.required*c.contribution>=c.fixed);assert((c.required-1)*c.contribution<c.fixed)}
assert.equal(cases[4].required*cases[4].contribution,36036);assert.equal((cases[4].required-1)*cases[4].contribution,35880);
assert.equal(calculate(model,{rate:250,share:20,fixed:0}),0);
assert.throws(()=>calculate(model,{rate:0,share:20,fixed:36000}));
assert.throws(()=>calculate(model,{rate:250,share:100,fixed:36000}));
const guide='public/library/break-even-booked-nights/index.html',html=fs.readFileSync(guide,'utf8');
assert(html.includes('112.5%')&&html.includes('$4,000 uncovered')&&html.includes('about 230.77 nights'));
assert(html.includes('role="region" tabindex="0" aria-label="Fictional break-even case comparison"'));
assert.equal((html.match(/scope="row"/g)||[]).length,5);
assert.equal((html.match(/href="\/workbooks\/break-even-booked-nights\/example-/g)||[]).length,40);
for(const id of ['calculator','case-comparison','availability-check','input-buckets','formula-units','model-boundaries'])assert(html.includes('id="'+id+'"'));
assert.equal(fs.readFileSync('public/downloads/break-even-booked-nights-cases.csv','utf8'),breakEvenCsv(model));
const workspace=h=>JSON.parse(h.match(/<script id="workspace-data" type="application\/json">([^]*?)<\/script>/)[1]);
const sitemap=fs.readFileSync('public/sitemap.xml','utf8');assert.equal((sitemap.match(/<lastmod>/g)||[]).length,1);assert(sitemap.includes('/library/break-even-booked-nights/</loc><lastmod>2026-11-21</lastmod>'));
let unchanged=null;
if(process.argv[2]){
 const base=process.argv[2];const old=fs.readFileSync(path.join(base,guide),'utf8');assert.deepEqual(workspace(html),workspace(old));
 let count=0;
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]);
 for(const before of walk(path.join(base,'public'))){
  const relative=path.relative(base,before);if(relative===guide||relative==='public/sitemap.xml')continue;
  assert.equal(fs.readFileSync(relative).compare(fs.readFileSync(before)),0,relative);if(relative.endsWith('/index.html'))count++;
 }
 unchanged=count;assert.equal(unchanged,1665);
}
console.log(JSON.stringify({cases:cases.length,knownArithmeticResults:expected,roundingMinimalityChecks:5,invalidInputControls:2,zeroFixedCostCheck:true,retainedPracticeLinks:40,unchangedOtherHTML:unchanged}));
