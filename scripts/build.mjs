import {revenueNightGuide} from './revenue-night-guide.mjs';
import {occupancyGuide} from './occupancy-guide.mjs';
import {breakEvenGuide} from './break-even-guide.mjs';
import {articleFingerprint} from './approve-articles.mjs';
import {renderDevelopedPage} from './case-article.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {calculate,format,auditSummary} from '../public/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const pub=path.join(root,'public');const config=JSON.parse(fs.readFileSync(path.join(root,'content/site.json'),'utf8'));const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/catalog.json'),'utf8'));const {topics,references}=catalog;const editorials=Object.fromEntries(topics.map(t=>[t.slug,JSON.parse(fs.readFileSync(path.join(root,'content/page-articles',t.slug+'.json'),'utf8'))]));const origin=process.env.SITE_ORIGIN||config.origin;
if(!/^https:\/\/[a-z0-9.-]+$/.test(origin))throw new Error('SITE_ORIGIN must be an HTTPS origin without a path.');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const clean=s=>String(s).replace(/,([A-Za-z])/g,', $1').replace(/;([A-Za-z])/g,'; $1');
const para=s=>'<p>'+esc(clean(s))+'</p>';const list=xs=>'<ul>'+xs.map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul>';const section=(h,b)=>'<section><h2>'+esc(h)+'</h2>'+b+'</section>';
const assets=['/style.css','/expansion.css','/engine.mjs','/expansion.js'];const versions=Object.fromEntries(assets.map(a=>[a,crypto.createHash('sha256').update(fs.readFileSync(pub+a)).digest('hex').slice(0,10)]));
let routes=[];function write(route,title,description,body,{noindex=false,category='Library',data=null,parent=null,modified=null}={}){const url=origin+route;const graph={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':url,name:title,description,url,isPartOf:{'@type':'WebSite',name:config.name,url:origin+'/'},publisher:{'@type':'Organization',name:'My BnB Accelerator, LLC',url:'https://www.bnbaccelerator.com/'},...(modified?{dateModified:modified}:{})},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:'Library',item:origin+'/library/'},...(route==='/library/'?[]:[{'@type':'ListItem',position:3,name:parent?parent.title:title,item:origin+(parent?parent.route:route)}]),...(parent?[{'@type':'ListItem',position:4,name:title,item:url}]:[])]}]};
const doc=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | ${esc(config.name)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${noindex?'noindex,follow':'index,follow'}"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta name="theme-color" content="#102a32"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css?v=${versions['/style.css']}"><link rel="stylesheet" href="/expansion.css?v=${versions['/expansion.css']}"><script type="module" src="/expansion.js?v=${versions['/expansion.js']}"></script><script type="application/ld+json">${JSON.stringify(graph).replace(/</g,'\\u003c')}</script></head><body style="--accent:${config.accent}"><a class="skip" href="#main">Skip to content</a><header><div class="wrap nav"><a class="brand" href="/"><b>BNB</b>${esc(config.short)}</a><nav aria-label="Main"><a href="/">Home</a><a href="/library/">${esc(config.library)}</a><a href="/about/">Publisher & privacy</a></nav></div></header><div class="hero small"><div class="wrap"><span class="eyebrow">${esc(category)} / BNB ACCELERATOR</span><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="badge">Published by My BnB Accelerator, LLC · Company-owned resource</div></div></div><main id="main"><div class="wrap"><div class="crumb"><a href="/">Home</a> / <a href="/library/">Library</a>${parent?' / <a href="'+parent.route+'">'+esc(parent.title)+'</a>':''} / ${esc(title)}</div>${body}${data?'<script id="workspace-data" type="application/json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>':''}</div></main><footer><div class="wrap foot"><div><strong>${esc(config.name)}</strong><p>Published by My BnB Accelerator, LLC. Company perspective; not an independent review outlet. Hypothetical workbooks do not describe customer results.</p><span>© 2026 My BnB Accelerator, LLC</span></div><nav aria-label="Footer"><a href="/about/">About & privacy</a><a href="/library/">Library</a><a href="https://www.bnbaccelerator.com/">BNB Accelerator</a></nav></div></footer></body></html>`;const dir=path.join(pub,route);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),doc);routes.push({route,title,noindex,parent:parent?.route||'/library/',category,...(modified?{modified}:{})});}
function valueSet(model,example){if(example>0)return editorials[model.slug][example-1].values;const j=example-1;const v={};model.fields.forEach((f,i)=>{let x=f.base;if(example>0){if(f.unit==='percent')x=f.base+(j%8-3)*(f.base>0?Math.max(.5,f.base*.04):.5);else if(['nights','stays','months','years'].includes(f.unit))x=f.base+(j%10-4)*Math.max(1,Math.round(f.base*.04))+(Math.floor(j/10)%4);else x=f.base*(.65+j*.025)+i*(j+1)*3;x=Math.min(f.max,Math.max(f.min,x));if(['nights','stays','months','years'].includes(f.unit))x=Math.round(x);else x=Math.round(x*100)/100}v[f.id]=x});if(model.slug==='booked-night-occupancy')v.nights=Math.min(v.nights,v.available);if(model.slug==='amenity-payback-illustration')v.extra=Math.max(v.extra,v.running+100);return v}
function modelForm(model,values,title,example){let answer;try{answer=format(calculate(model,values),model.unit)}catch(e){answer=e.message}const inputs=model.fields.map(f=>`<label for="in-${f.id}">${esc(f.label)}<span class="unit">${esc(f.unit)} · ${f.min} to ${f.max}</span><input id="in-${f.id}" name="${f.id}" type="number" required min="${f.min}" max="${f.max}" step="any" value="${values[f.id]}"></label>`).join('');return {html:`<div class="workspace"><form id="workspace-form"><div class="inputs">${inputs}</div><button type="submit">Recalculate</button><p id="workspace-error" class="error" role="alert"></p><div class="workspace-result"><span>Illustrative result · ${esc(model.unit)}</span><output id="workspace-result" aria-live="polite">${esc(answer)}</output></div><p id="live-formula" class="formula">${esc(model.formula)} = ${esc(answer)}</p><label for="worksheet-notes">Source notes (optional)</label><textarea name="notes" id="worksheet-notes" placeholder="Use non-sensitive references, not account details."></textarea></form>${buttons()}</div>`,data:{kind:'calculator',model,values,title,example,slug:model.slug}}}
function buttons(){return '<div class="workspace-actions"><button type="button" id="workspace-export">Export JSON</button><button type="button" id="workspace-print" class="secondary">Print worksheet</button><button type="button" id="workspace-save" class="secondary">Save on this browser</button><button type="button" id="workspace-load" class="secondary">Load saved entries</button><button type="button" id="workspace-reset" class="secondary">Reset & clear saved</button></div><p id="save-status" role="status"></p><p class="source-note">Inputs stay in your browser. Saving is optional and local to this device. Exported files contain your entries; review before sharing. Do not enter confidential records.</p>'}
const states=['reviewed','pending','missing','conflict'];
function evidenceCase(topic,i,j){if(j>0)return editorials[topic.slug][j-1].sample;const shift=(i+j)%4;const records=topic.documents.map((name,k)=>({name,status:states[(j+k+shift)%4]}));if(j%10===0)records.forEach(r=>r.status='reviewed');if(j%4===2)records[records.length-1].status='missing';if(j%4===3)records[0].status='conflict';if(j%4===1)records[0].status='pending';return {records,days:7+(j*3+i)%55,budget:1500+(i+1)*275+j*190,revision:1+(j%5),frame:[`The supplied records address this question: ${topic.question} No scope discrepancy is stated in this training packet.`,`The ${topic.documents[0]} and ${topic.documents[1]||topic.documents[0]} cover different dates or scope; the packet does not explain the difference.`,`The packet lists ${topic.documents.at(-1)} but the attachment is absent.`,`The summary treats ${topic.documents[0]} as sufficient, but the packet leaves this follow-up open: ${topic.flags[0]}`][j%4]}}
function auditForm(topic,sample,title,j){const summary=auditSummary(sample.records.map(r=>r.status));const records=sample.records.map((r,k)=>`<div class="record-row"><label for="record-${k}"><span>${esc(clean(r.name))}</span><select name="record-${k}" id="record-${k}" data-evidence>${states.map(s=>`<option value="${s}" ${s===r.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></label></div>`).join('');return{html:`<div class="workspace"><form id="workspace-form">${records}<label for="followup">Next request</label><textarea name="followup" id="followup">${esc(clean(topic.action))}</textarea><label for="worksheet-notes">Your non-sensitive notes</label><textarea name="notes" id="worksheet-notes" placeholder="Record a source reference and the open question."></textarea><button type="submit">Review status</button><p id="workspace-error" class="error" role="alert"></p><div class="workspace-result"><span>Evidence checklist status</span><output id="workspace-result" aria-live="polite">${esc(clean(summary.message))}</output></div><p id="live-formula" class="formula">${summary.counts.reviewed} of ${summary.total} records marked reviewed.</p></form>${buttons()}</div>`,data:{kind:config.kind,title,example:j,slug:topic.slug,sample}}}
const topicPath=t=>'/library/'+t.slug+'/';const examplePath=(t,j)=>'/workbooks/'+t.slug+'/example-'+String(j).padStart(2,'0')+'/';
const related=t=>'<div class="related"><h2>Related resources</h2>'+[topics[(topics.indexOf(t)+1)%topics.length],topics[(topics.indexOf(t)+7)%topics.length]].map(x=>`<a href="${topicPath(x)}">${esc(x.title)}</a>`).join('')+'<a href="/library/">Browse the full library</a></div>';
const sources=t=>{const map={'lender-comparison':['CFPB mortgage comparison resource','https://www.consumerfinance.gov/owning-a-home/compare/compare-loan-estimates/'],'moisture-follow-up':['EPA moisture and mold resource','https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home'],'company-ownership':['FTC guidance for review publishers','https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms'],'review-incentives':['FTC review-publisher guidance','https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms']};const s=map[t.slug];return s?section('Further reading',`<p><a href="${s[1]}">${s[0]}</a>. External background, not an endorsement of this site or a property-specific conclusion.</p>`):''};
for(const dir of ['library','workbooks'])fs.rmSync(path.join(pub,dir),{recursive:true,force:true});
for(const [i,t] of topics.entries()){
 const scenarioLinks=Array.from({length:40},(_,k)=>{const j=k+1;const values=config.kind==='calculator'?valueSet(t,j):evidenceCase(t,i,j);const preview=config.kind==='calculator'?t.fields.slice(0,2).map(f=>f.label+': '+format(values[f.id],f.unit)).join(' · '):values.frame;return `<a class="example-link" href="${examplePath(t,j)}"><strong>Example ${String(j).padStart(2,'0')}</strong>${esc(clean(preview))}</a>`}).join('');
 let intro,workspace,body,guide;
 if(config.kind==='calculator'){
 workspace=modelForm(t,valueSet(t,0),t.title+' calculator',0);
 if(t.slug==='break-even-booked-nights'){guide=breakEvenGuide(t);fs.mkdirSync(path.join(pub,'downloads'),{recursive:true});fs.writeFileSync(path.join(pub,'downloads/break-even-booked-nights-cases.csv'),guide.csv);}
 if(t.slug==='booked-night-occupancy'){guide=occupancyGuide(t);fs.mkdirSync(path.join(pub,'downloads'),{recursive:true});fs.writeFileSync(path.join(pub,'downloads/booked-night-occupancy-cases.csv'),guide.csv);}
 if(t.slug==='revenue-per-available-night'){guide=revenueNightGuide(t);fs.mkdirSync(path.join(pub,'downloads'),{recursive:true});fs.writeFileSync(path.join(pub,'downloads/revenue-per-available-night-cases.csv'),guide.csv);}
 intro=section(t.question,para(t.intro))+section('Formula and units',`<p class="formula">${esc(t.formula)}</p>`+list(t.fields.map(f=>f.label+' — '+f.unit+'.')))+section('Input review',para(t.action))+section('What this model leaves out',para(t.limit));
 body=`<div class="reading"><article>${guide?guide.before:intro}${guide?'<section id="calculator" aria-labelledby="calculator-heading"><h2 id="calculator-heading">'+esc(guide.calculatorHeading||'Try your own cost-coverage inputs')+'</h2>'+workspace.html+'</section>'+guide.after:workspace.html}${section('Forty applied calculation guides','<p>Hypothetical input sets for practicing this model. Each example remains editable and can be exported. These are not observed property or customer results.</p><div class="example-grid">'+scenarioLinks+'</div>')}</article><aside class="sidepanel"><h2>Use the model carefully</h2><p>Check definitions and source dates before calculating. A result validates arithmetic under the inputs; it does not authenticate the inputs.</p>${related(t)}</aside></div>`;
 }else{
 const sample=evidenceCase(t,i,0);sample.records.forEach(r=>r.status='pending');workspace=auditForm(t,sample,t.title+' worksheet',0);
 intro=section(t.question,para(config.kind==='planning'?'Use this playbook to organize the records and responsibilities behind a property-specific decision. The goal is a clear request and documented response rather than a broad assumption of readiness.':'Use this guide to separate the claim being discussed from the evidence actually available. A source may support part of a claim while leaving the overall conclusion unresolved.'))+section('Records to request',list(t.documents))+section('What deserves follow-up',list(t.flags))+section('Next action',para(t.action))+section('The boundary of the conclusion',para(t.limit))+section('Working method',para('Give each requested record a source reference, observation date, reporting period and responsible party. Mark a record reviewed only after examining whether it addresses this question: '+t.question)+para('Keep disagreement visible. If the scope or period differs, request the missing bridge rather than selecting a convenient figure. Preserve both the original record and the response so another reviewer can retrace the decision.'))+sources(t);
 body=`<div class="reading"><article>${intro}${section('Editable evidence checklist','<p>Use the statuses to track your own review. Reviewed means you marked the item reviewed; it is not independent verification or approval.</p>'+workspace.html)}${section('Forty applied evidence guides','<p>These synthetic examples vary record status, missing context and review conditions. They are not descriptions of real clients, properties or reviews.</p><div class="example-grid">'+scenarioLinks+'</div>')}</article><aside class="sidepanel"><h2>${esc(t.category)}</h2>${para(t.action)}${related(t)}</aside></div>`;
 }
 write(topicPath(t),guide?guide.title:config.kind==='calculator'?t.title+' calculator':t.title+' '+(config.kind==='planning'?'playbook':'evidence guide'),guide?guide.description:t.question,body,{category:t.category,data:workspace.data,...(guide?{modified:guide.modified}:{})});
 for(let j=1;j<=40;j++){
  const article=editorials[t.slug][j-1];if(!article||article.number!==j)throw new Error('Missing page editorial: '+t.slug+'/'+j);
  const title=article.title;const work=config.kind==='calculator'?modelForm(t,article.values,title,j):auditForm(t,article.sample,title,j);
  const body=renderDevelopedPage(article,{topic:t,parent:topicPath(t),workHtml:work.html,related:related(t),format,kind:config.kind});
  const eligible=article.eligibility?.status==='validated-for-publication';if(eligible&&article.eligibility.contentHash!==articleFingerprint(article))throw new Error('Article content changed after its eligibility review: '+t.slug+'/'+j);
  write(examplePath(t,j),title,article.description,body,{noindex:!eligible,category:config.kind==='calculator'?'Worked calculations':config.kind==='planning'?'Acquisition decisions':'Evidence audits',data:work.data,parent:{route:topicPath(t),title:t.title}});
 }
}

for(const [i,t] of references.entries()){
 const near=topics[i%topics.length];const body='<div class="reading"><article>'+section(t.question,para(t.intro))+section('Apply the method',para(t.action))+section('What the method does not establish',para(t.limit))+section('A review sequence',list(['Name the exact question and the unit or scope being compared.','Record the source and the reporting period before changing a value.','Retain unresolved differences rather than filling them with an assumed fact.','Save the input set and conclusion together so another reviewer can reproduce the reasoning.']))+section('Put this into practice',`<p><a href="${topicPath(near)}">Open the ${esc(near.title.toLowerCase())} ${config.kind==='calculator'?'calculator':'worksheet'}</a> and record which definitions or evidence gaps matter before relying on its output.</p>`)+section('Keep the result in context',para('This reference is an original workflow explanation from the BNB resource team. It does not independently verify a company claim, a customer experience or a property result. Use the relevant original records and qualified advisers for decisions that require professional judgment.'))+'</article><aside class="sidepanel"><h2>Related practice</h2><a href="'+topicPath(near)+'">'+esc(near.title)+'</a><p><a href="/library/">Browse all topics</a></p></aside></div>';
 write('/library/'+t.slug+'/',t.title+' reference',t.question,body,{category:t.category});
}
const decisionGuides = [
  [
    "annual-occupancy-to-seasonal-revenue",
    "Check a seasonal revenue forecast against booked nights",
    "Reconcile annual occupancy with seasonal room rates before using a forecast.",
    "A 90-night season with 54 booked nights at $180 contributes $9,720. A 275-night season with 110 booked nights at $110 contributes $12,100. The combined 164 booked nights give 44.9% calendar occupancy and $21,820 of room revenue.",
    "Start with booked nights and room revenue by month. Group months only after checking their rate and demand patterns. Reconcile the annual totals to the inputs and document closures separately.",
    [
      "two-season-room-revenue",
      "booked-night-occupancy",
      "revenue-per-available-night"
    ]
  ],
  [
    "reconcile-cash-flow-to-cash-needed",
    "Reconcile rental cash flow with cash needed at purchase",
    "Use separate calculations for annual cash performance and the money needed to start operating.",
    "A hypothetical property needs $60,000 at closing, $18,000 for setup, and $12,000 for its opening reserve. The entry cash is $90,000. If the model shows $9,000 of annual cash flow after modeled debt payments, the illustrative cash-on-cash result is 10%.",
    "Give each entry cost an amount and expected payment date. Keep a separate annual operating schedule and check that one-time setup costs do not appear twice. Run a second result with a higher setup budget and compare how much cash remains available for delays.",
    [
      "total-entry-cash",
      "cash-on-cash-percentage",
      "setup-cost-overrun"
    ]
  ],
  [
    "test-rate-and-occupancy-together",
    "Stress-test nightly rate and occupancy together",
    "Test how a simultaneous rate and booking decline affects modeled room revenue.",
    "A 30-night month with 18 booked nights at $160 produces $2,880 of room revenue. At 15 nights and $145, it produces $2,175, a $705 decline. The revenue change flows into cash only after you account for changes in variable costs and fixed commitments.",
    "Save the baseline inputs, then run separate rate-only and occupancy-only cases before the combined case. Trace the assumptions to comparable periods. Compare results under the same treatment of cleaning receipts, channel fees and other costs.",
    [
      "nightly-rate-sensitivity",
      "room-revenue-downside",
      "combined-operating-stress"
    ]
  ],
  [
    "translate-booked-night-target-to-calendar",
    "Translate a break-even target into a booking calendar",
    "Check whether a monthly booked-night target fits your sellable nights and planned closures.",
    "Monthly fixed costs of $2,100 and per-night contribution of $105 imply 20 booked nights to break even. With 24 sellable nights after planned blocks, the property needs 83.3% occupancy on sellable nights. The same 20 bookings would be 66.7% on a 30-night calendar.",
    "List fixed costs and calculate contribution after modeled variable costs. Round the required night count up if the result is fractional. Compare the target against the sellable calendar and a representative low-demand month.",
    [
      "break-even-booked-nights",
      "per-night-contribution",
      "booked-night-occupancy"
    ]
  ]
];
const decisionRoute = slug => '/library/' + slug + '/';
const decisionLinks = guides => '<ul>' + guides.map(([slug, title]) =>
  '<li><a href="' + decisionRoute(slug) + '">' + esc(title) + '</a></li>'
).join('') + '</ul>';
for (const [slug, title, description, example, process, modelSlugs] of decisionGuides) {
  const models = modelSlugs.map(modelSlug => {
    const model = topics.find(topic => topic.slug === modelSlug);
    if (!model) throw new Error('Unknown decision guide model: ' + modelSlug);
    return '<li><a href="' + topicPath(model) + '">' + esc(model.title) + '</a></li>';
  }).join('');
  const body = '<div class="reading"><article>'
    + section('Worked example', para(example))
    + section('Run the check with your own inputs', para(process))
    + section('Calculators for this check', '<ul>' + models + '</ul>')
    + section('Related buyer decision guides', decisionLinks(decisionGuides.filter(guide => guide[0] !== slug)))
    + '<p><a href="/library/">Back to the calculator library</a></p></article></div>';
  write(decisionRoute(slug), title, description, body, {
    category: 'Buyer decision guides',
    parent: {title: config.library, route: '/library/'},
    modified: '2026-11-28',
  });
}
const all=[...topics,...references];const categories=[...new Set(all.map(t=>t.category))];const cards=all.map(t=>`<a class="card" data-library-item data-category="${esc(t.category)}" data-search="${esc((t.title+' '+t.question+' '+t.category).toLowerCase())}" href="/library/${t.slug}/"><span class="eyebrow">${esc(t.category)}</span><h2>${esc(t.title)}</h2><p>${esc(t.question)}</p><span class="textlink">${topics.includes(t)?(config.kind==='calculator'?'Use calculator and 40 worked analyses':'Read guide and 40 applied cases'):'Read reference'}</span></a>`).join('');
write('/library/',config.library,'Browse '+all.length+' focused topics and 1,600 editable '+(config.kind==='calculator'?'worked calculations':'training workspaces')+' in the '+config.name+'.','<div class="library-intro"><div>'+para(config.intro)+'</div><div class="callout"><strong>'+all.length+' main topics · 1,600 practice workspaces</strong><p>Every example is hypothetical and editable. Original input sets remain visible for comparison.</p></div></div>'+section('Buyer decision guides',decisionLinks(decisionGuides))+'<div class="library-controls"><label for="library-search">Search topics<input id="library-search" type="search" placeholder="'+esc(config.search)+'"></label><label for="library-category">Category<select id="library-category"><option value="">All categories</option>'+categories.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></label></div><p class="library-status" id="library-status" role="status">'+all.length+' topics</p><div class="topic-grid">'+cards+'</div>',{category:config.library});
const indexable=[...config.baseRoutes,...routes.filter(r=>!r.noindex).map(r=>r.route)];const core=[...config.baseRoutes,...routes.filter(r=>!r.route.startsWith('/workbooks/')).map(r=>r.route)];fs.writeFileSync(path.join(pub,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+indexable.map(r=>'<url><loc>'+origin+r+'</loc>'+(routes.find(x=>x.route===r)?.modified?'<lastmod>'+routes.find(x=>x.route===r).modified+'</lastmod>':'')+'</url>').join('')+'</urlset>');
const coreIndexable=indexable.filter(route=>!route.startsWith('/workbooks/'));
fs.writeFileSync(path.join(pub,'sitemap-core.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+coreIndexable.map(route=>'<url><loc>'+origin+route+'</loc></url>').join('')+'</urlset>');
fs.writeFileSync(path.join(pub,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
fs.writeFileSync(path.join(root,'build-report.json'),JSON.stringify({project:config.project,corePages:core.length,examplePages:1600,indexablePages:indexable.length,noindexPages:routes.filter(r=>r.noindex).length,totalPages:core.length+1600,origin,routes},null,2));
console.log(config.project+': '+(core.length+1600)+' pages; '+indexable.length+' index-eligible, '+routes.filter(r=>r.noindex).length+' awaiting eligibility');
