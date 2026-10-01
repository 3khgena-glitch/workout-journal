(() => {
  "use strict";

  const KEY = "workoutJournal.v1";
  const DAYS = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];

  const seedExercises = [
    ["Приседания с гирей","Гоблет-присед с гирей.","Контролировать глубину и темп."],
    ["Махи гирей","Махи гирей двумя руками.","Спина нейтральная, движение от таза."],
    ["Жим гири","Жим гири одной рукой стоя.","Не переразгибать поясницу."],
    ["Тяга гири в наклоне","Тяга гири одной рукой в опоре.","Локоть движется назад."],
    ["Трастер с гирей","Фронтальный присед с жимом.","Движение непрерывное."],
    ["Отжимания","Отжимания от пола.","Корпус держать одной линией."],
    ["Разведение с эспандером","Разведение рук с резиновым эспандером.","Контролировать возврат."],
    ["Face pull","Тяга эспандера к лицу.","Лопатки сводить без рывка."]
  ];

  let state = loadState();
  let selectedWeekOffset = 0;

  function uid(prefix="id"){ return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function loadState(){
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){}
    return {
      exercises: seedExercises.map(([name,description,note]) => ({id:uid("ex"),name,description,note})),
      workouts: [],
      history: []
    };
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function esc(s=""){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
  function fmtDate(d){ return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d); }
  function fmtDateTime(s){ return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(s)); }
  function dayIndexMonday(d){
    const n=d.getDay();
    return n === 0 ? 6 : n-1;
  }
  function startOfWeek(d){
    const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-dayIndexMonday(x)); return x;
  }
  function weekDates(offset=0){
    const start=startOfWeek(new Date());
    start.setDate(start.getDate()+offset*7);
    return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d;});
  }
  function workoutDoneOnDate(workoutId, date){
    const day = date.toISOString().slice(0,10);
    return state.history.some(h=>h.workoutId===workoutId && h.date.slice(0,10)===day);
  }
  function showToast(msg){
    const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show");
    clearTimeout(showToast.t); showToast.t=setTimeout(()=>el.classList.remove("show"),1800);
  }
  function setView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    if(name==="week") renderWeek();
    if(name==="workouts") renderWorkouts();
    if(name==="exercises") renderExercises();
    if(name==="history") renderHistory();
  }

  function renderWeek(){
    const dates=weekDates(selectedWeekOffset);
    document.getElementById("weekRange").textContent=`${fmtDate(dates[0])} — ${fmtDate(dates[6])}`;
    const list=document.getElementById("weekList");
    list.innerHTML=dates.map((d,di)=>{
      const ws=state.workouts.filter(w=>w.day===di);
      const isToday=d.toDateString()===new Date().toDateString();
      return `<div class="card day-card">
        <div class="day-head"><div><div class="day-name">${DAYS[di]}${isToday?" · сегодня":""}</div><div class="date">${fmtDate(d)}</div></div></div>
        ${ws.length?ws.map(w=>{
          const done=workoutDoneOnDate(w.id,d);
          return `<div class="workout-row">
            <div class="workout-info"><div class="workout-title">${esc(w.name)}</div><div class="meta">${w.exerciseIds.length} упражн.</div></div>
            <span class="status ${done?"done":"planned"}">${done?"Выполнено":"Запланировано"}</span>
            ${done?"":"<button class=\"primary small\" data-action=\"complete\" data-id=\""+w.id+"\" data-date=\""+d.toISOString()+"\">Выполнить</button>"}
          </div>`;
        }).join(""):"<div class=\"empty\">Тренировок нет</div>"}
      </div>`;
    }).join("");
  }

  function renderWorkouts(){
    const list=document.getElementById("workoutList");
    if(!state.workouts.length){list.innerHTML='<div class="empty">Нет тренировок. Создайте первую.</div>';return;}
    list.innerHTML=state.workouts.map(w=>{
      const names=w.exerciseIds.map(id=>state.exercises.find(e=>e.id===id)?.name).filter(Boolean);
      return `<div class="card">
        <div class="row" style="justify-content:space-between;gap:10px">
          <div><h3>${esc(w.name)}</h3><div class="meta">${DAYS[w.day]} · ${names.length} упражн.</div></div>
          <div class="actions" style="margin:0"><button class="secondary small" data-action="edit-workout" data-id="${w.id}">Изменить</button><button class="danger small" data-action="delete-workout" data-id="${w.id}">Удалить</button></div>
        </div>
        <div class="meta" style="margin-top:9px">${names.map(esc).join(" · ")||"Упражнения не выбраны"}</div>
      </div>`;
    }).join("");
  }

  function renderExercises(){
    const q=document.getElementById("exerciseSearch").value.trim().toLowerCase();
    const arr=state.exercises.filter(e=>(e.name+" "+e.description+" "+e.note).toLowerCase().includes(q));
    const list=document.getElementById("exerciseList");
    if(!arr.length){list.innerHTML='<div class="empty">Ничего не найдено.</div>';return;}
    list.innerHTML=arr.map(e=>`<div class="card">
      <h3>${esc(e.name)}</h3>
      <div class="meta">${esc(e.description||"")}</div>
      ${e.note?`<div class="meta">${esc(e.note)}</div>`:""}
      <div class="actions"><button class="secondary small" data-action="edit-exercise" data-id="${e.id}">Изменить</button><button class="danger small" data-action="delete-exercise" data-id="${e.id}">Удалить</button></div>
    </div>`).join("");
  }

  function renderHistory(){
    const list=document.getElementById("historyList");
    const arr=[...state.history].sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!arr.length){list.innerHTML='<div class="empty">История пока пустая.</div>';return;}
    list.innerHTML=arr.map(h=>`<div class="card history-item">
      <div class="history-date">${fmtDateTime(h.date)}</div>
      <div style="flex:1"><h3>${esc(h.name)}</h3>${h.note?`<div class="meta">${esc(h.note)}</div>`:""}<button class="secondary small" style="margin-top:8px" data-action="history-detail" data-id="${h.id}">Подробнее</button></div>
    </div>`).join("");
  }

  function openModal(title,body,onSave){
    const root=document.getElementById("modalRoot");
    root.innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal">
      <div class="modal-head"><h2>${title}</h2><button class="modal-close" id="modalClose">×</button></div>
      ${body}<div class="modal-actions"><button class="secondary" id="modalCancel">Отмена</button><button class="primary" id="modalSave">Сохранить</button></div>
    </div></div>`;
    const close=()=>root.innerHTML="";
    document.getElementById("modalClose").onclick=close;
    document.getElementById("modalCancel").onclick=close;
    document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")close()});
    document.getElementById("modalSave").onclick=()=>{ if(onSave()!==false) close(); };
  }

  function workoutForm(w=null){
    let orderedIds=[...(w?.exerciseIds||[])];
    const available=state.exercises.map(e=>`<label class="checkrow"><input type="checkbox" value="${e.id}" ${orderedIds.includes(e.id)?"checked":""}> <span>${esc(e.name)}</span></label>`).join("");
    const selectedHtml=()=>orderedIds.map((id,i)=>{const e=state.exercises.find(x=>x.id===id);return e?`<div class="exercise-chip"><span>${i+1}. ${esc(e.name)}</span><span class="order-buttons"><button type="button" data-order="up" data-id="${id}">↑</button><button type="button" data-order="down" data-id="${id}">↓</button></span></div>`:""}).join("");
    openModal(w?"Изменить тренировку":"Новая тренировка",`
      <div class="field"><label>Название</label><input id="fName" class="input" value="${esc(w?.name||"")}"></div>
      <div class="field"><label>День недели</label><select id="fDay" class="select">${DAYS.map((d,i)=>`<option value="${i}" ${i===(w?.day??dayIndexMonday(new Date()))?"selected":""}>${d}</option>`).join("")}</select></div>
      <div class="field"><label>Добавить упражнения</label><div id="exercisePicker" class="list-select">${available||'<div class="empty">Сначала добавьте упражнения.</div>'}</div></div>
      <div class="field"><label>Порядок выполнения</label><div id="selectedExercises" class="stack">${selectedHtml()||'<div class="empty">Выберите упражнения выше.</div>'}</div></div>
    `,()=>{
      const name=document.getElementById("fName").value.trim();
      const day=Number(document.getElementById("fDay").value);
      if(!name){showToast("Введите название");return false;}
      if(!orderedIds.length){showToast("Выберите хотя бы одно упражнение");return false;}
      if(w){Object.assign(w,{name,day,exerciseIds:orderedIds});}
      else state.workouts.push({id:uid("wo"),name,day,exerciseIds:orderedIds});
      save();renderWorkouts();renderWeek();showToast("Сохранено");
    });
    const picker=document.getElementById("exercisePicker");
    const selected=document.getElementById("selectedExercises");
    const refreshSelected=()=>{selected.innerHTML=selectedHtml()||'<div class="empty">Выберите упражнения выше.</div>';};
    picker?.addEventListener("change",e=>{
      const id=e.target.value;
      if(e.target.checked){if(!orderedIds.includes(id)) orderedIds.push(id);}
      else orderedIds=orderedIds.filter(x=>x!==id);
      refreshSelected();
    });
    selected?.addEventListener("click",e=>{
      const b=e.target.closest("[data-order]"); if(!b)return;
      const i=orderedIds.indexOf(b.dataset.id); if(i<0)return;
      if(b.dataset.order==="up" && i>0)[orderedIds[i-1],orderedIds[i]]=[orderedIds[i],orderedIds[i-1]];
      if(b.dataset.order==="down" && i<orderedIds.length-1)[orderedIds[i+1],orderedIds[i]]=[orderedIds[i],orderedIds[i+1]];
      refreshSelected();
    });
  }

  function exerciseForm(e=null){
    openModal(e?"Изменить упражнение":"Новое упражнение",`
      <div class="field"><label>Название</label><input id="eName" class="input" value="${esc(e?.name||"")}"></div>
      <div class="field"><label>Описание</label><textarea id="eDesc" class="textarea">${esc(e?.description||"")}</textarea></div>
      <div class="field"><label>Примечание</label><textarea id="eNote" class="textarea">${esc(e?.note||"")}</textarea></div>
    `,()=>{
      const name=document.getElementById("eName").value.trim();
      if(!name){showToast("Введите название");return false;}
      if(e) Object.assign(e,{name,description:document.getElementById("eDesc").value.trim(),note:document.getElementById("eNote").value.trim()});
      else state.exercises.push({id:uid("ex"),name,description:document.getElementById("eDesc").value.trim(),note:document.getElementById("eNote").value.trim()});
      save();renderExercises();showToast("Сохранено");
    });
  }

  function completeWorkout(id, iso){
    const w=state.workouts.find(x=>x.id===id); if(!w)return;
    const existing=state.history.find(h=>h.workoutId===id && h.date.slice(0,10)===new Date(iso).toISOString().slice(0,10));
    if(existing){showToast("Уже выполнено");return;}
    openModal("Выполнить тренировку",`
      <div class="card" style="background:#f8f9fa"><h3>${esc(w.name)}</h3><div class="meta">${DAYS[w.day]}</div></div>
      <div class="field" style="margin-top:12px"><label>Примечание</label><textarea id="doneNote" class="textarea" placeholder="Как прошла тренировка?"></textarea></div>
    `,()=>{
      const now=new Date().toISOString();
      state.history.push({
        id:uid("hist"),workoutId:w.id,date:now,name:w.name,
        exerciseIds:[...w.exerciseIds],note:document.getElementById("doneNote").value.trim()
      });
      save();renderWeek();renderHistory();showToast("Тренировка отмечена");
    });
  }

  function showHistoryDetail(id){
    const h=state.history.find(x=>x.id===id); if(!h)return;
    const names=h.exerciseIds.map(x=>state.exercises.find(e=>e.id===x)?.name).filter(Boolean);
    openModal("Детали",`
      <div class="card"><h3>${esc(h.name)}</h3><div class="meta">${fmtDateTime(h.date)}</div></div>
      <div class="field" style="margin-top:12px"><label>Упражнения</label><div class="stack">${names.map(n=>`<div class="exercise-chip">${esc(n)}</div>`).join("")}</div></div>
      <div class="field"><label>Примечание</label><textarea id="historyNote" class="textarea">${esc(h.note||"")}</textarea></div>
    `,()=>{
      h.note=document.getElementById("historyNote").value.trim();save();renderHistory();showToast("Изменено");
    });
  }

  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-action]"); if(!b)return;
    const a=b.dataset.action,id=b.dataset.id;
    if(a==="complete")completeWorkout(id,b.dataset.date);
    if(a==="edit-workout"){const w=state.workouts.find(x=>x.id===id);if(w)workoutForm(w)}
    if(a==="delete-workout"){if(confirm("Удалить тренировку? История выполнений останется.")){state.workouts=state.workouts.filter(x=>x.id!==id);save();renderWorkouts();renderWeek();}}
    if(a==="edit-exercise"){const x=state.exercises.find(e=>e.id===id);if(x)exerciseForm(x)}
    if(a==="delete-exercise"){
      const used=state.workouts.some(w=>w.exerciseIds.includes(id));
      if(used){showToast("Упражнение используется в тренировке");return;}
      if(confirm("Удалить упражнение?")){state.exercises=state.exercises.filter(x=>x.id!==id);save();renderExercises();}
    }
    if(a==="history-detail")showHistoryDetail(id);
  });

  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  document.getElementById("addWorkoutBtn").onclick=()=>workoutForm();
  document.getElementById("addExerciseBtn").onclick=()=>exerciseForm();
  document.getElementById("exerciseSearch").addEventListener("input",renderExercises);
  document.getElementById("prevWeek").onclick=()=>{selectedWeekOffset--;renderWeek()};
  document.getElementById("nextWeek").onclick=()=>{selectedWeekOffset++;renderWeek()};
  document.getElementById("todayWeek").onclick=()=>{selectedWeekOffset=0;renderWeek()};
  document.getElementById("clearHistoryBtn").onclick=()=>{
    if(confirm("Удалить всю историю?")){state.history=[];save();renderHistory();showToast("История очищена")}
  };
  document.getElementById("installHintBtn").onclick=()=>{
    alert("На iPhone: откройте приложение в Safari → Поделиться → «На экран Домой». Для установки сайт должен быть открыт по HTTPS.");
  };

  if("serviceWorker" in navigator && location.protocol==="https:"){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }

  renderWeek();
})();