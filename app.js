const $=s=>document.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const list=(items=[])=>items?.length?`<ul class="list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<div class="empty">Нет данных</div>';
const tags=(items=[])=>items?.length?items.map(x=>`<span class="tag">${esc(x)}</span>`).join(''):'—';
const section=(id,title,html)=>html?`<section class="section" id="${id}"><h2>${esc(title)}</h2>${html}</section>`:'';
const fmt=(v,c='RUB')=>typeof v==='number'?new Intl.NumberFormat('ru-RU',{style:'currency',currency:c,maximumFractionDigits:0}).format(v):esc(v??'—');
const priorityClass=p=>p==='high'?'priority-high':p==='medium'?'priority-medium':'priority-low';
const trendClass=d=>d==='up'?'trend-up':d==='down'?'trend-down':'trend-stable';
const confidence=v=>({high:'Высокая уверенность',medium:'Средняя уверенность',low:'Низкая уверенность',mixed:'Смешанная уверенность'}[v]||'Уверенность не указана');

function metrics(items=[]){
 return items.length?`<div class="grid grid-4">${items.map(m=>`<div class="card"><div class="muted">${esc(m.label)}</div><div class="metric-value">${esc(m.value)}</div><div class="muted">${esc(m.note||'')}</div></div>`).join('')}</div>`:'';
}
function marketSize(ms={}){
 const levels=['tam','sam','som'].map(k=>ms[k]?`<div class="card"><div class="eyebrow">${k.toUpperCase()}</div><div class="metric-value">${fmt(ms[k].value,ms.currency)}</div><strong>${esc(ms[k].label||'')}</strong><p class="muted">${esc(ms[k].formula||'')}</p>${list(ms[k].assumptions||[])}</div>`:'').join('');
 const scenarios=ms.scenarios?.length?`<h3>Сценарии</h3><div class="table-wrap"><table><thead><tr><th>Сценарий</th><th>TAM</th><th>SAM</th><th>SOM</th><th>Допущения</th></tr></thead><tbody>${ms.scenarios.map(s=>`<tr><td>${esc(s.name)}</td><td>${fmt(s.tam,ms.currency)}</td><td>${fmt(s.sam,ms.currency)}</td><td>${fmt(s.som,ms.currency)}</td><td>${tags(s.assumptions)}</td></tr>`).join('')}</tbody></table></div>`:'';
 return `<div class="grid grid-3">${levels}</div>${scenarios}`;
}
function competitors(c={}){
 if(!c.items?.length)return '<div class="empty">Нет данных</div>';
 return `<p class="section-intro">${esc(c.summary||'')}</p><div class="table-wrap"><table><thead><tr><th>Игрок</th><th>Продукт</th><th>Цена</th><th>Оффер</th><th>Позиционирование</th><th>Сильные</th><th>Слабые</th><th>Каналы</th></tr></thead><tbody>${c.items.map(x=>`<tr><td><strong>${esc(x.name)}</strong><br><span class="muted">${esc(x.type)}</span></td><td>${esc(x.product)}</td><td>${esc(x.price)}</td><td>${esc(x.offer)}</td><td>${esc(x.positioning)}</td><td>${tags(x.strengths)}</td><td>${tags(x.weaknesses)}</td><td>${tags(x.channels)}</td></tr>`).join('')}</tbody></table></div><h3>Незанятые возможности</h3>${list(c.white_spaces||[])}`;
}
function audiences(items=[]){
 return items.length?`<div class="grid grid-2">${items.map(a=>`<div class="card ${priorityClass(a.priority)}"><div class="eyebrow">Приоритет: ${esc(a.priority)}</div><h3>${esc(a.name)}</h3><p>${esc(a.description||'')}</p><p><strong>Ситуация:</strong> ${esc(a.situation||'')}</p><p><strong>JTBD:</strong> ${esc(a.jtbd||'')}</p><h4>Боли</h4>${list(a.pains)}<h4>Мотивы</h4>${list(a.motives)}<h4>Барьеры</h4>${list(a.barriers)}<h4>Критерии</h4>${list(a.criteria)}<h4>Каналы</h4>${tags(a.channels)}</div>`).join('')}</div>`:'<div class="empty">Нет данных</div>';
}
function cjm(items=[]){
 return items.length?`<div class="cjm">${items.map(s=>`<div class="card"><div class="eyebrow">Этап</div><h3>${esc(s.stage)}</h3><h4>Действия</h4>${list(s.actions)}<h4>Вопросы</h4>${list(s.questions)}<h4>Барьеры</h4>${list(s.barriers)}<h4>Точки контакта</h4>${tags(s.touchpoints)}<h4>Возможности</h4>${list(s.opportunities)}</div>`).join('')}</div>`:'<div class="empty">Нет данных</div>';
}
function valueProposition(v={}){
 const col=(title,groups)=>`<div class="card"><h3>${title}</h3>${groups.map(([h,x])=>`<h4>${h}</h4>${list(x||[])}`).join('')}</div>`;
 return `<div class="canvas-two">${col('Профиль клиента',[['Задачи',v.customer_jobs],['Боли',v.pains],['Выгоды',v.gains]])}${col('Карта ценности',[['Продукты и услуги',v.products_services],['Устранители боли',v.pain_relievers],['Создатели выгоды',v.gain_creators]])}</div>`;
}
function swot(s={}){
 return `<div class="swot"><div class="card"><h3>Сильные стороны</h3>${list(s.strengths)}</div><div class="card"><h3>Слабые стороны</h3>${list(s.weaknesses)}</div><div class="card"><h3>Возможности</h3>${list(s.opportunities)}</div><div class="card"><h3>Угрозы</h3>${list(s.threats)}</div></div>${s.strategies?`<h3>Стратегические комбинации</h3><div class="grid grid-4"><div class="card"><strong>SO</strong>${list(s.strategies.so)}</div><div class="card"><strong>WO</strong>${list(s.strategies.wo)}</div><div class="card"><strong>ST</strong>${list(s.strategies.st)}</div><div class="card"><strong>WT</strong>${list(s.strategies.wt)}</div></div>`:''}`;
}
function bmc(b={}){
 const fields=[['bmc-partners','Ключевые партнёры','key_partners'],['bmc-activities','Ключевые активности','key_activities'],['bmc-resources','Ключевые ресурсы','key_resources'],['bmc-value','Ценностные предложения','value_propositions'],['bmc-relationships','Отношения с клиентами','customer_relationships'],['bmc-channels','Каналы','channels'],['bmc-segments','Сегменты клиентов','customer_segments'],['bmc-cost','Структура затрат','cost_structure'],['bmc-revenue','Потоки доходов','revenue_streams']];
 return `<div class="bmc">${fields.map(([cl,t,k])=>`<div class="card ${cl}"><h3>${t}</h3>${list(b[k]||[])}</div>`).join('')}</div>`;
}
function marketing(m={}){
 const channelTable=m.channels?.length?`<h3>Приоритетные каналы</h3><div class="table-wrap"><table><thead><tr><th>Канал</th><th>Сегмент</th><th>Приоритет</th><th>Скорость</th><th>Стоимость</th><th>Качество лида</th><th>Обоснование</th></tr></thead><tbody>${m.channels.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.segment)}</td><td>${esc(c.priority)}</td><td>${esc(c.speed)}</td><td>${esc(c.cost)}</td><td>${esc(c.lead_quality)}</td><td>${esc(c.rationale)}</td></tr>`).join('')}</tbody></table></div>`:'';
 const hypotheses=m.hypotheses?.length?`<h3>Гипотезы</h3><div class="grid grid-2">${m.hypotheses.map(h=>`<div class="card ${priorityClass(h.priority)}"><strong>${esc(h.hypothesis)}</strong><p>${esc(h.basis)}</p><p><strong>Тест:</strong> ${esc(h.test)}</p><p><strong>Метрика:</strong> ${esc(h.metric)}</p><p><strong>Критерий:</strong> ${esc(h.success_criterion)}</p></div>`).join('')}</div>`:'';
 return `${channelTable}<h3>Офферы</h3>${list(m.offers||[])}<h3>Контент</h3>${list(m.content_directions||[])}${hypotheses}`;
}
function roadmap(r={}){
 const block=(title,items=[])=>`<div class="card"><h3>${title}</h3>${items.length?items.map(a=>`<div class="note"><strong>${esc(a.action)}</strong><p>${esc(a.reason||'')}</p><div class="muted">${esc(a.metric||'')}</div></div>`).join(''):'<div class="empty">Нет данных</div>'}</div>`;
 return `<div class="roadmap">${block('Первые 30 дней',r.days_30)}${block('31–60 дней',r.days_60)}${block('61–90 дней',r.days_90)}</div>`;
}
function sources(items=[]){
 if(!items.length)return '<div class="empty">Нет источников</div>';
 return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Источник</th><th>Организация</th><th>Дата</th><th>География</th><th>Подтверждает</th><th>Надёжность</th></tr></thead><tbody>${items.map(s=>`<tr><td>${esc(s.id)}</td><td><a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></td><td>${esc(s.organization||'')}</td><td>${esc(s.published_at||'—')}</td><td>${esc(s.geography||'')}</td><td>${tags(s.supports)}</td><td>${esc(s.reliability)}</td></tr>`).join('')}</tbody></table></div>`;
}
function render(data){
 $('#projectName').textContent=data.meta?.project_name||'Без названия';
 $('#projectMeta').textContent=[data.meta?.subtitle,data.meta?.research_date,data.meta?.geography,data.meta?.business_type].filter(Boolean).join(' · ');
 $('#confidenceBadge').innerHTML=`<span class="badge">${confidence(data.meta?.data_confidence)}</span>`;
 const es=data.executive_summary||{}, market=data.market||{}, p=data.positioning||{}, ag=data.assumptions_gaps||{};
 const blocks=[
  ['summary','Резюме',`<p class="section-intro">${esc(es.overview||'')}</p>${metrics(es.metrics||[])}<div class="grid grid-2"><div class="card"><h3>Ключевые выводы</h3>${list(es.key_findings||[])}</div><div class="card"><h3>Приоритетные действия</h3>${list(es.priority_actions||[])}</div></div>`],
  ['methodology','Методология',`<p>${esc(data.methodology?.scope||'')}</p><div class="grid grid-3"><div class="card"><h3>Методы</h3>${list(data.methodology?.methods||[])}</div><div class="card"><h3>Ограничения</h3>${list(data.methodology?.limitations||[])}</div><div class="card"><h3>Уверенность</h3><p>${esc(data.methodology?.confidence_note||'')}</p></div></div>`],
  ['market','Рынок',`<p class="section-intro">${esc(market.definition||'')}</p><div class="grid grid-3"><div class="card"><h3>Структура</h3>${list(market.structure||[])}</div><div class="card"><h3>Драйверы</h3>${list(market.drivers||[])}</div><div class="card"><h3>Барьеры</h3>${list(market.barriers||[])}</div></div><h3>Ёмкость рынка</h3>${marketSize(market.market_size||{})}`],
  ['trends','Тренды',data.trends?.length?`<div class="grid grid-3">${data.trends.map(t=>`<div class="card ${trendClass(t.direction)}"><div class="eyebrow">${esc(t.direction)}</div><h3>${esc(t.name)}</h3><p>${esc(t.description||'')}</p><p><strong>Влияние:</strong> ${esc(t.impact||'')}</p><div class="muted">${esc(t.horizon||'')}</div></div>`).join('')}</div>`:''],
  ['competitors','Конкуренты',competitors(data.competitors||{})],
  ['audiences','Целевая аудитория',audiences(data.audiences||[])],
  ['cjm','Customer Journey Map',cjm(data.cjm||[])],
  ['value','Value Proposition Canvas',valueProposition(data.value_proposition||{})],
  ['positioning','Позиционирование',`<div class="card"><p class="section-intro"><strong>${esc(p.statement||'')}</strong></p><div class="grid grid-2"><div><h3>Категория</h3><p>${esc(p.category||'')}</p><h3>Целевой сегмент</h3><p>${esc(p.target_segment||'')}</p><h3>Ключевая ценность</h3><p>${esc(p.core_value||'')}</p></div><div><h3>Отличие</h3><p>${esc(p.differentiation||'')}</p><h3>Доказательства</h3>${list(p.proof||[])}<h3>Сообщения</h3>${list(p.messages||[])}</div></div></div>`],
  ['swot','SWOT-анализ',swot(data.swot||{})],
  ['bmc','Business Model Canvas',bmc(data.business_model_canvas||{})],
  ['marketing','Маркетинг и продажи',marketing(data.marketing_sales||{})],
  ['roadmap','План 30 / 60 / 90',roadmap(data.roadmap||{})],
  ['gaps','Допущения и пробелы',`<div class="grid grid-2"><div class="card"><h3>Допущения</h3>${list(ag.assumptions||[])}</div><div class="card"><h3>Противоречия</h3>${list(ag.contradictions||[])}</div><div class="card"><h3>Недостающие данные</h3>${list(ag.missing_data||[])}</div><div class="card"><h3>Риски</h3>${list(ag.risks||[])}</div></div>`],
  ['sources','Источники',sources(data.sources||[])]
 ];
 $('#content').innerHTML=blocks.map(([id,t,h])=>section(id,t,h)).join('');
 $('#nav').innerHTML=blocks.filter(([, ,h])=>h).map(([id,t])=>`<a href="#${id}">${esc(t)}</a>`).join('');
}
async function loadSample(){
 try{
  const response=await fetch('sample-report-data.json');
  if(response.ok)render(await response.json());
 }catch(error){}
}
$('#fileInput').addEventListener('change',async event=>{
 const file=event.target.files?.[0];
 if(!file)return;
 try{render(JSON.parse(await file.text()))}
 catch(error){alert('Не удалось прочитать JSON: '+error.message)}
});
$('#printBtn').addEventListener('click',()=>window.print());
loadSample();
