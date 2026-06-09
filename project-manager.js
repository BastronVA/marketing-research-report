const DEFAULT_REPORT_ID='crp-2026-06-09';
const REPORT_INDEX_PATH='reports/index.json';
const LOCAL_PROJECTS_KEY='marketingResearchReport.localProjects.v1';


const $=s=>document.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const hasText=v=>String(v??'').trim().length>0;
const hasItems=items=>Array.isArray(items)&&items.some(x=>hasText(x));
const hasData=v=>Array.isArray(v)?v.length>0:v&&typeof v==='object'?Object.values(v).some(hasData):hasText(v);
const compact=(title,html,open=false)=>hasData(html)?`<details class="details"${open?' open':''}><summary>${esc(title)}</summary>${html}</details>`:'';
const list=(items=[])=>hasItems(items)?`<ul class="list">${items.filter(hasText).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<div class="empty">Нет данных</div>';
const tags=(items=[])=>hasItems(items)?items.filter(hasText).map(x=>`<span class="tag">${esc(x)}</span>`).join(''):'—';
const sourceTags=(items=[])=>hasItems(items)?`<div class="source-ids"><span>Источники:</span> ${tags(items)}</div>`:'';
const section=(id,title,html)=>hasData(html)?`<section class="section" id="${id}"><h2>${esc(title)}</h2>${html}</section>`:'';
const fmt=(v,c='RUB')=>typeof v==='number'?new Intl.NumberFormat('ru-RU',{style:'currency',currency:c,maximumFractionDigits:0}).format(v):esc(v??'—');
const priorityClass=p=>p==='high'?'priority-high':p==='medium'?'priority-medium':'priority-low';
const priorityLabel=p=>({high:'Высокий',medium:'Средний',low:'Низкий'}[p]||p||'Не указан');
const trendClass=d=>d==='up'?'trend-up':d==='down'?'trend-down':'trend-stable';
const trendLabel=d=>({up:'Рост',stable:'Стабильно',down:'Снижение'}[d]||d||'Не указано');
const confidence=v=>({high:'Высокая уверенность',medium:'Средняя уверенность',low:'Низкая уверенность',mixed:'Смешанная уверенность'}[v]||'Уверенность не указана');
const isExternalUrl=url=>/^https?:\/\//i.test(String(url||''));
const linkOrText=(url,text,opts={})=>{
 const label=esc(text||url||'—');
 if(!hasText(url))return label;
 if(!isExternalUrl(url))return `<span class="internal-source">${label}</span>`;
 return `<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener"${opts.download?' download':''}>${label}</a>`;
};
const fileButton=(href,label,download=false)=>hasText(href)?`<a class="material-button" href="${esc(href)}"${download?' download':''}>${esc(label)}</a>`:'';

let currentManifest=null;
let currentReportData=null;
let reportIndex={default_report:DEFAULT_REPORT_ID,reports:[]};
let localProjects=[];
let currentReportId=DEFAULT_REPORT_ID;
let currentReportSource='static';
let materialObjectUrls=[];

function setStatus(message,type='info'){
 const el=$('#statusMessage');
 if(!el)return;
 el.textContent=message||'';
 el.className=message?`status status-${type}`:'status';
}

function slugify(value){
 return String(value||'project').toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,70)||'project';
}
function readLocalProjects(){
 try{
  const parsed=JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY)||'[]');
  return Array.isArray(parsed)?parsed:[];
 }catch(error){
  console.warn('Не удалось прочитать локальные проекты',error);
  return [];
 }
}
function writeLocalProjects(projects){
 localStorage.setItem(LOCAL_PROJECTS_KEY,JSON.stringify(projects));
}
function makeObjectUrl(content,type='text/plain'){
 const url=URL.createObjectURL(new Blob([content||''],{type}));
 materialObjectUrls.push(url);
 return url;
}
function revokeMaterialUrls(){
 materialObjectUrls.forEach(url=>URL.revokeObjectURL(url));
 materialObjectUrls=[];
}
function localManifest(project){
 return {
  id:project.id,
  project_name:project.project_name,
  research_date:project.research_date,
  geography:project.geography,
  is_local:true,
  files:{
   report_data:makeObjectUrl(project.files.report_data,'application/json'),
   research_report:makeObjectUrl(project.files.research_report,'text/markdown'),
   assumptions_and_gaps:makeObjectUrl(project.files.assumptions_and_gaps,'text/markdown'),
   sources_csv:makeObjectUrl(project.files.sources_csv,'text/csv')
  }
 };
}
function reportOptionLabel(entry,source){
 const prefix=source==='local'?'Локальный':'Встроенный';
 const date=entry.research_date?` · ${entry.research_date}`:'';
 return `${prefix}: ${entry.project_name||entry.id}${date}`;
}
function updateProjectPicker(){
 const select=$('#projectSelect');
 if(!select)return;
 const staticOptions=(reportIndex.reports||[]).map(r=>`<option value="static:${esc(r.id)}">${esc(reportOptionLabel(r,'static'))}</option>`).join('');
 const localOptions=localProjects.map(p=>`<option value="local:${esc(p.id)}">${esc(reportOptionLabel(p,'local'))}</option>`).join('');
 select.innerHTML=`${staticOptions}${localOptions}`;
 select.value=`${currentReportSource}:${currentReportId}`;
 const deleteBtn=$('#deleteProjectBtn');
 if(deleteBtn)deleteBtn.hidden=currentReportSource!=='local';
}
function setReportUrl(id){
 const url=new URL(window.location.href);
 url.searchParams.set('report',id);
 window.history.replaceState({},'',url);
}
async function readFileText(input,label){
 const file=input?.files?.[0];
 if(!file)throw new Error(`Добавьте файл ${label}.`);
 return await file.text();
}
async function createLocalProject(event){
 event.preventDefault();
 try{
  const reportText=await readFileText($('#newReportDataFile'),'report-data.json');
  const data=JSON.parse(reportText);
  validateReportShape(data);
  const researchText=await readFileText($('#newResearchReportFile'),'research-report.md');
  const assumptionsText=await readFileText($('#newAssumptionsFile'),'assumptions-and-gaps.md');
  const sourcesText=await readFileText($('#newSourcesFile'),'sources.csv');
  const projectName=$('#newProjectName').value.trim()||data.meta?.project_name||'Новый проект';
  const researchDate=$('#newResearchDate').value||data.meta?.research_date||new Date().toISOString().slice(0,10);
  const geography=$('#newGeography').value.trim()||data.meta?.geography||'';
  const requestedId=$('#newProjectId').value.trim()||`${slugify(projectName)}-${researchDate}`;
  const id=slugify(requestedId);
  if((reportIndex.reports||[]).some(r=>r.id===id))throw new Error(`ID «${id}» уже занят встроенным отчётом.`);
  const existingIndex=localProjects.findIndex(p=>p.id===id);
  const project={
   id,
   project_name:projectName,
   research_date:researchDate,
   geography,
   created_at:new Date().toISOString(),
   files:{
    report_data:JSON.stringify(data,null,2),
    research_report:researchText,
    assumptions_and_gaps:assumptionsText,
    sources_csv:sourcesText
   }
  };
  if(existingIndex>=0){
   if(!confirm(`Локальный проект «${id}» уже есть. Заменить его?`))return;
   localProjects[existingIndex]=project;
  }else{
   localProjects.push(project);
  }
  writeLocalProjects(localProjects);
  $('#projectForm').reset();
  $('#projectDialog').close();
  await openLocalProject(id);
  setReportUrl(id);
  setStatus(`Локальный проект создан: ${id}`,'success');
 }catch(error){
  setStatus(`Не удалось создать проект: ${error.message}`,'error');
 }
}
async function openLocalProject(id){
 const project=localProjects.find(p=>p.id===id);
 if(!project)throw new Error(`Локальный проект «${id}» не найден в этом браузере.`);
 revokeMaterialUrls();
 currentReportId=id;
 currentReportSource='local';
 currentManifest=localManifest(project);
 const data=JSON.parse(project.files.report_data);
 validateReportShape(data);
 render(data,currentManifest);
 updateProjectPicker();
}
async function openStaticProject(id){
 const entry=(reportIndex.reports||[]).find(r=>r.id===id);
 if(!entry)throw new Error(`Исследование «${id}» не найдено в ${REPORT_INDEX_PATH}.`);
 revokeMaterialUrls();
 currentReportId=id;
 currentReportSource='static';
 currentManifest=await fetchJson(entry.manifest,`manifest ${id}`);
 const reportPath=currentManifest.files?.report_data;
 if(!reportPath)throw new Error(`В manifest для «${id}» не указан путь files.report_data.`);
 const data=await fetchJson(reportPath,`report-data для ${id}`);
 validateReportShape(data);
 render(data,currentManifest);
 updateProjectPicker();
}
async function openReportById(id){
 if(localProjects.some(p=>p.id===id))return openLocalProject(id);
 return openStaticProject(id);
}
function deleteCurrentLocalProject(){
 if(currentReportSource!=='local')return;
 const id=currentReportId;
 if(!confirm(`Удалить локальный проект «${id}» из этого браузера? Встроенные отчёты не изменятся.`))return;
 localProjects=localProjects.filter(p=>p.id!==id);
 writeLocalProjects(localProjects);
 const fallback=reportIndex.default_report||DEFAULT_REPORT_ID;
 setReportUrl(fallback);
 loadReport();
}

function metrics(items=[]){
 return items.length?`<div class="grid grid-4">${items.map(m=>`<div class="card"><div class="muted">${esc(m.label)}</div><div class="metric-value">${esc(m.value)}</div>${hasText(m.note)?`<div class="muted">${esc(m.note)}</div>`:''}</div>`).join('')}</div>`:'';
}

function materials(manifest,data){
 const f=manifest?.files||{};
 const jsonHref=f.report_data||manifest?.report_data_path||'';
 const buttons=[
  fileButton(f.research_report,'Полный отчёт'),
  fileButton(f.assumptions_and_gaps,'Допущения и ограничения'),
  fileButton(f.sources_csv,'Реестр источников CSV'),
  fileButton(jsonHref,'Скачать JSON',true)
 ].filter(Boolean).join('');
 const meta=[manifest?.project_name||data?.meta?.project_name,manifest?.research_date||data?.meta?.research_date,manifest?.geography||data?.meta?.geography].filter(Boolean).join(' · ');
 return buttons?`<p class="section-intro">${esc(meta)}</p><div class="materials">${buttons}</div>`:'';
}

function marketLevel(level,key,currency){
 if(!level)return '';
 const warning=(hasItems(level.assumptions)||hasText(level.formula))?'<div class="warning">Сценарная оценка: значение зависит от формулы, допущений и качества исходных источников.</div>':'';
 return `<div class="card market-level"><div class="eyebrow">${key.toUpperCase()}</div><div class="metric-value">${fmt(level.value,currency)}</div>${hasText(level.label)?`<strong>${esc(level.label)}</strong>`:''}${hasText(level.formula)?`<p><strong>Формула:</strong> ${esc(level.formula)}</p>`:''}${compact('Допущения',list(level.assumptions||[]),true)}${sourceTags(level.source_ids||[])}${warning}</div>`;
}
function marketSize(ms={}){
 const levels=['tam','sam','som'].map(k=>marketLevel(ms[k],k,ms.currency)).join('');
 const period=hasText(ms.period)?`<div class="note"><strong>Период оценки:</strong> ${esc(ms.period)}</div>`:'';
 const scenarios=ms.scenarios?.length?`<h3>Сценарии</h3><div class="table-wrap"><table><thead><tr><th>Сценарий</th><th>TAM</th><th>SAM</th><th>SOM</th><th>Допущения</th></tr></thead><tbody>${ms.scenarios.map(s=>`<tr><td>${esc(s.name)}</td><td>${fmt(s.tam,ms.currency)}</td><td>${fmt(s.sam,ms.currency)}</td><td>${fmt(s.som,ms.currency)}</td><td>${tags(s.assumptions)}</td></tr>`).join('')}</tbody></table></div>`:'';
 return `${period}<div class="grid grid-3">${levels}</div>${scenarios}`;
}
function labeledList(title,items=[]){
 return items?.length?`<h3>${esc(title)}</h3><div class="grid grid-2">${items.map(x=>`<div class="card"><h4>${esc(x.label||'Фактор')}</h4>${list(x.items||[])}</div>`).join('')}</div>`:'';
}
function competitors(c={}){
 if(!c.items?.length)return '<div class="empty">Нет данных</div>';
 return `${hasText(c.summary)?`<p class="section-intro">${esc(c.summary)}</p>`:''}<div class="table-wrap"><table><thead><tr><th>Игрок</th><th>Сайт</th><th>Продукт</th><th>Цена</th><th>Оффер</th><th>Позиционирование</th><th>Сильные</th><th>Слабые</th><th>Каналы</th><th>Источники</th></tr></thead><tbody>${c.items.map(x=>`<tr><td><strong>${esc(x.name)}</strong><br><span class="muted">${esc(x.type)}</span></td><td>${linkOrText(x.website,x.website)}</td><td>${esc(x.product)}</td><td>${esc(x.price)}</td><td>${esc(x.offer)}</td><td>${esc(x.positioning)}</td><td>${tags(x.strengths)}</td><td>${tags(x.weaknesses)}</td><td>${tags(x.channels)}</td><td>${tags(x.source_ids)}</td></tr>`).join('')}</tbody></table></div>${hasItems(c.white_spaces)?`<h3>Незанятые возможности</h3>${list(c.white_spaces)}`:''}`;
}
function audiences(items=[]){
 return items.length?`<div class="grid grid-2">${items.map(a=>`<div class="card ${priorityClass(a.priority)}"><div class="priority-pill">${esc(priorityLabel(a.priority))} приоритет</div><h3>${esc(a.name)}</h3><p>${esc(a.description||'')}</p>${hasText(a.situation)?`<p><strong>Ситуация:</strong> ${esc(a.situation)}</p>`:''}${hasText(a.jtbd)?`<p><strong>JTBD:</strong> ${esc(a.jtbd)}</p>`:''}<div class="grid mini-grid"><div><h4>Боли</h4>${list(a.pains)}</div><div><h4>Мотивы</h4>${list(a.motives)}</div></div>${compact('Триггеры',list(a.triggers||[]))}${compact('Участники принятия решения',list(a.decision_roles||[]))}${compact('Барьеры',list(a.barriers||[]))}${compact('Критерии',list(a.criteria||[]))}<h4>Каналы</h4>${tags(a.channels)}</div>`).join('')}</div>`:'<div class="empty">Нет данных</div>';
}
function cjm(items=[]){
 return items.length?`<div class="cjm">${items.map(s=>`<div class="card"><div class="eyebrow">Этап</div><h3>${esc(s.stage)}</h3><h4>Действия</h4>${list(s.actions)}${compact('Вопросы',list(s.questions||[]))}${compact('Барьеры',list(s.barriers||[]))}<h4>Точки контакта</h4>${tags(s.touchpoints)}<h4>Возможности</h4>${list(s.opportunities)}</div>`).join('')}</div>`:'<div class="empty">Нет данных</div>';
}
function valueProposition(v={}){
 const col=(title,groups)=>`<div class="card"><h3>${title}</h3>${groups.map(([h,x])=>hasData(x)?`<h4>${h}</h4>${list(x||[])}`:'').join('')}</div>`;
 return `<div class="canvas-two">${col('Профиль клиента',[['Задачи',v.customer_jobs],['Боли',v.pains],['Выгоды',v.gains]])}${col('Карта ценности',[['Продукты и услуги',v.products_services],['Устранители боли',v.pain_relievers],['Создатели выгоды',v.gain_creators]])}</div>`;
}
function swot(s={}){
 return `<div class="swot"><div class="card"><h3>Сильные стороны</h3>${list(s.strengths)}</div><div class="card"><h3>Слабые стороны</h3>${list(s.weaknesses)}</div><div class="card"><h3>Возможности</h3>${list(s.opportunities)}</div><div class="card"><h3>Угрозы</h3>${list(s.threats)}</div></div>${s.strategies?`<h3>Стратегические комбинации</h3><div class="grid grid-4"><div class="card"><strong>SO</strong>${list(s.strategies.so)}</div><div class="card"><strong>WO</strong>${list(s.strategies.wo)}</div><div class="card"><strong>ST</strong>${list(s.strategies.st)}</div><div class="card"><strong>WT</strong>${list(s.strategies.wt)}</div></div>`:''}`;
}
function bmc(b={}){
 const fields=[['bmc-partners','Ключевые партнёры','key_partners'],['bmc-activities','Ключевые активности','key_activities'],['bmc-resources','Ключевые ресурсы','key_resources'],['bmc-value','Ценностные предложения','value_propositions'],['bmc-relationships','Отношения с клиентами','customer_relationships'],['bmc-channels','Каналы','channels'],['bmc-segments','Сегменты клиентов','customer_segments'],['bmc-cost','Структура затрат','cost_structure'],['bmc-revenue','Потоки доходов','revenue_streams']];
 return `<div class="bmc">${fields.map(([cls,title,key])=>`<div class="card ${cls}"><h3>${title}</h3>${list(b[key]||[])}</div>`).join('')}</div>`;
}
function marketing(m={}){
 const channelTable=m.channels?.length?`<h3>Каналы</h3><div class="table-wrap"><table><thead><tr><th>Канал</th><th>Сегмент</th><th>Приоритет</th><th>Скорость</th><th>Стоимость</th><th>Качество лида</th><th>Обоснование</th></tr></thead><tbody>${m.channels.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.segment)}</td><td><span class="priority-pill ${priorityClass(c.priority)}">${esc(priorityLabel(c.priority))}</span></td><td>${esc(c.speed)}</td><td>${esc(c.cost)}</td><td>${esc(c.lead_quality)}</td><td>${esc(c.rationale)}</td></tr>`).join('')}</tbody></table></div>`:'';
 const hypotheses=m.hypotheses?.length?`<h3>Гипотезы</h3><div class="grid grid-2">${m.hypotheses.map(h=>`<div class="card ${priorityClass(h.priority)}"><div class="priority-pill">${esc(priorityLabel(h.priority))} приоритет</div><strong>${esc(h.hypothesis)}</strong><p>${esc(h.basis)}</p><p><strong>Тест:</strong> ${esc(h.test)}</p><p><strong>Метрика:</strong> ${esc(h.metric)}</p><p><strong>Критерий:</strong> ${esc(h.success_criterion)}</p></div>`).join('')}</div>`:'';
 return `${channelTable}${hasItems(m.offers)?`<h3>Офферы</h3>${list(m.offers)}`:''}${hasItems(m.content_directions)?`<h3>Контент</h3>${list(m.content_directions)}`:''}${hypotheses}`;
}
function roadmap(r={}){
 const block=(title,items=[])=>`<div class="card"><h3>${title}</h3>${items.length?items.map(a=>`<div class="note ${priorityClass(a.priority)}"><div class="priority-pill">${esc(priorityLabel(a.priority))} приоритет</div><strong>${esc(a.action)}</strong>${hasText(a.reason)?`<p>${esc(a.reason)}</p>`:''}<div class="roadmap-meta">${hasText(a.owner)?`<span><strong>Владелец:</strong> ${esc(a.owner)}</span>`:''}${hasText(a.resources)?`<span><strong>Ресурсы:</strong> ${esc(a.resources)}</span>`:''}${hasText(a.metric)?`<span><strong>Метрика:</strong> ${esc(a.metric)}</span>`:''}</div></div>`).join(''):'<div class="empty">Нет данных</div>'}</div>`;
 return `<div class="roadmap">${block('Первые 30 дней',r.days_30)}${block('31–60 дней',r.days_60)}${block('61–90 дней',r.days_90)}</div>`;
}
function sources(items=[]){
 if(!items.length)return '<div class="empty">Нет источников</div>';
 return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Источник</th><th>Организация</th><th>Дата</th><th>География</th><th>Подтверждает</th><th>Надёжность</th></tr></thead><tbody>${items.map(s=>`<tr><td>${esc(s.id)}</td><td>${linkOrText(s.url,s.title)}</td><td>${esc(s.organization||'')}</td><td>${esc(s.published_at||'—')}</td><td>${esc(s.geography||'')}</td><td>${tags(s.supports)}</td><td>${esc(priorityLabel(s.reliability))}</td></tr>`).join('')}</tbody></table></div>`;
}
function render(data,manifest=currentManifest){
 currentReportData=data;
 $('#projectName').textContent=data.meta?.project_name||manifest?.project_name||'Без названия';
 $('#projectMeta').textContent=[data.meta?.subtitle,manifest?.research_date||data.meta?.research_date,manifest?.geography||data.meta?.geography,data.meta?.business_type].filter(Boolean).join(' · ');
 $('#confidenceBadge').innerHTML=`<span class="badge">${confidence(data.meta?.data_confidence)}</span>`;
 const es=data.executive_summary||{}, market=data.market||{}, p=data.positioning||{}, ag=data.assumptions_gaps||{};
 const blocks=[
  ['materials','Материалы исследования',materials(manifest,data)],
  ['summary','Резюме',`${hasText(es.overview)?`<p class="section-intro">${esc(es.overview)}</p>`:''}${metrics(es.metrics||[])}<div class="grid grid-2"><div class="card"><h3>Ключевые выводы</h3>${list(es.key_findings||[])}</div><div class="card"><h3>Приоритетные действия</h3>${list(es.priority_actions||[])}</div></div>`],
  ['methodology','Методология',`<p>${esc(data.methodology?.scope||'')}</p><div class="grid grid-3"><div class="card"><h3>Методы</h3>${list(data.methodology?.methods||[])}</div><div class="card"><h3>Ограничения</h3>${list(data.methodology?.limitations||[])}</div><div class="card"><h3>Уверенность</h3><p>${esc(data.methodology?.confidence_note||'')}</p></div></div>`],
  ['market','Рынок',`${hasText(market.definition)?`<p class="section-intro">${esc(market.definition)}</p>`:''}<div class="grid grid-3"><div class="card"><h3>Структура</h3>${list(market.structure||[])}</div><div class="card"><h3>Драйверы</h3>${list(market.drivers||[])}</div><div class="card"><h3>Барьеры</h3>${list(market.barriers||[])}</div></div>${hasText(market.seasonality)?`<div class="note"><strong>Сезонность:</strong> ${esc(market.seasonality)}</div>`:''}<h3>Ёмкость рынка</h3>${marketSize(market.market_size||{})}${labeledList('PESTEL',market.pestel||[])}${labeledList('Пять сил Портера',market.porter||[])}`],
  ['trends','Тренды',data.trends?.length?`<div class="grid grid-3">${data.trends.map(t=>`<div class="card ${trendClass(t.direction)}"><div class="eyebrow">${esc(trendLabel(t.direction))}</div><h3>${esc(t.name)}</h3><p>${esc(t.description||'')}</p>${hasText(t.impact)?`<p><strong>Влияние:</strong> ${esc(t.impact)}</p>`:''}<div class="muted">${esc(t.horizon||'')}</div>${sourceTags(t.source_ids||[])}</div>`).join('')}</div>`:''],
  ['competitors','Конкуренты',competitors(data.competitors||{})],
  ['audiences','Целевая аудитория',audiences(data.audiences||[])],
  ['cjm','Customer Journey Map',cjm(data.cjm||[])],
  ['value','Value Proposition Canvas',valueProposition(data.value_proposition||{})],
  ['positioning','Позиционирование',`<div class="card"><p class="section-intro"><strong>${esc(p.statement||'')}</strong></p><div class="grid grid-2"><div><h3>Категория</h3><p>${esc(p.category||'')}</p><h3>Целевой сегмент</h3><p>${esc(p.target_segment||'')}</p><h3>Ключевая ценность</h3><p>${esc(p.core_value||'')}</p></div><div><h3>Отличие</h3><p>${esc(p.differentiation||'')}</p><h3>Доказательства</h3>${list(p.proof||[])}<h3>Сообщения</h3>${list(p.messages||[])}</div></div></div>`],
  ['swot','SWOT-анализ',swot(data.swot||{})],
  ['bmc','Business Model Canvas',bmc(data.business_model_canvas||{})],
  ['marketing','Маркетинг и продажи',marketing(data.marketing_sales||{})],
  ['roadmap','План 30 / 60 / 90',roadmap(data.roadmap||{})],
  ['gaps','Риски, допущения и пробелы',`<div class="grid grid-2"><div class="card"><h3>Допущения</h3>${list(ag.assumptions||[])}</div><div class="card"><h3>Противоречия</h3>${list(ag.contradictions||[])}</div><div class="card"><h3>Недостающие данные</h3>${list(ag.missing_data||[])}</div><div class="card"><h3>Риски</h3>${list(ag.risks||[])}</div></div>`],
  ['sources','Источники',sources(data.sources||[])]
 ];
 const visible=blocks.filter(([, ,h])=>hasData(h));
 $('#content').innerHTML=visible.map(([id,t,h])=>section(id,t,h)).join('');
 $('#nav').innerHTML=visible.map(([id,t])=>`<a href="#${id}">${esc(t)}</a>`).join('');
}

async function fetchJson(path,label='JSON'){
 const response=await fetch(path,{cache:'no-store'});
 if(!response.ok)throw new Error(`${label} не найден или недоступен: ${path} (HTTP ${response.status})`);
 try{return await response.json();}
 catch(error){throw new Error(`${label} содержит некорректный JSON: ${error.message}`);}
}
function validateReportShape(data){
 if(!data||typeof data!=='object')throw new Error('Файл отчёта должен быть JSON-объектом.');
 if(!data.meta||!data.executive_summary)throw new Error('В JSON отсутствуют обязательные разделы meta или executive_summary.');
}
async function loadReport(){
 const params=new URLSearchParams(window.location.search);
 try{
  setStatus('Загружаю список исследований…');
  reportIndex=await fetchJson(REPORT_INDEX_PATH,'reports/index.json');
  localProjects=readLocalProjects();
  const requestedId=params.get('report')||reportIndex.default_report||DEFAULT_REPORT_ID;
  await openReportById(requestedId);
  setStatus(`Открыт отчёт: ${requestedId}`,'success');
 }catch(error){
  updateProjectPicker();
  setStatus(error.message,'error');
  $('#content').innerHTML=`<section class="section"><h2>Не удалось открыть отчёт</h2><div class="empty">${esc(error.message)}</div><p class="muted">Проверьте путь, параметр ?report=..., выберите проект в списке или загрузите локальный JSON через левую панель.</p></section>`;
  $('#nav').innerHTML='';
 }
}
$('#projectSelect').addEventListener('change',async event=>{
 const [source,id]=event.target.value.split(':');
 try{
  if(source==='local')await openLocalProject(id);
  else await openStaticProject(id);
  setReportUrl(id);
  setStatus(`Открыт отчёт: ${id}`,'success');
 }catch(error){
  setStatus(error.message,'error');
 }
});
$('#addProjectBtn').addEventListener('click',()=>$('#projectDialog').showModal());
$('#addProjectHeroBtn').addEventListener('click',()=>$('#projectDialog').showModal());
$('#cancelProjectBtn').addEventListener('click',()=>$('#projectDialog').close());
$('#projectForm').addEventListener('submit',createLocalProject);
$('#deleteProjectBtn').addEventListener('click',deleteCurrentLocalProject);

$('#fileInput').addEventListener('change',async event=>{
 const file=event.target.files?.[0];
 if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  validateReportShape(data);
  currentManifest={project_name:data.meta?.project_name,files:{report_data:''}};
  render(data,currentManifest);
  setStatus(`Локальный JSON загружен: ${file.name}`,'success');
 }catch(error){
  setStatus(`Не удалось прочитать JSON: ${error.message}`,'error');
 }
});
$('#printBtn').addEventListener('click',()=>window.print());
loadReport();
