import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as m}from"./index-BlmOqGMO.js";import{N as R}from"./NodeGraph-BzffTThM.js";import{a as z,s as E,b as i}from"./storybookData-DJEYIHwQ.js";import"./index-yBjzXJbu.js";import"./NotebookScoresPanel-vkTnezTD.js";import"./stepLegend-DjgZYxVm.js";const M={title:"Dashboard/NodeGraph/Explorer",component:R,tags:["autodocs"],parameters:{layout:"fullscreen"}},G={selectedNodeId:null,onNodeSelect:()=>{},visibleNotebookIds:i.map(o=>o.id),visibleNotebooks:i,heatmapPatternName:E,heatmapFocusRange:z},a={args:G},l={render:()=>{const o=i.map(r=>r.id);function S(){const[r,c]=m.useState(o),_=m.useMemo(()=>new Set(r),[r]),x=r.length===o.length,I=()=>{c(x?[]:o)},O=s=>{c(t=>t.includes(s)?t.filter(C=>C!==s):[...t,s])};return e.jsx("div",{className:"p-5",children:e.jsxs("div",{className:"w-[260px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",children:[e.jsxs("div",{className:"mb-3 flex items-center justify-between gap-2",children:[e.jsx("span",{className:"text-sm font-semibold text-slate-900",children:"Résultats"}),e.jsxs("span",{className:"rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-900",children:[r.length," notebooks"]})]}),e.jsx("div",{className:"mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-2"}),e.jsxs("button",{type:"button",onClick:I,className:"mb-2 flex w-full items-center gap-2 rounded-md border-b border-slate-100 pb-2 text-left",children:[e.jsx("div",{className:"flex h-4 w-4 items-center justify-center rounded-[3px] border border-slate-300 bg-slate-900 text-[9px] font-bold text-white",children:x?"✓":""}),e.jsx("span",{className:"text-sm font-semibold text-slate-900",children:"Cochez tout"})]}),e.jsx("div",{className:"space-y-1.5",children:i.map(s=>{const t=_.has(s.id);return e.jsxs("button",{type:"button",onClick:()=>O(s.id),className:"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50",children:[e.jsx("div",{className:"flex h-4 w-4 items-center justify-center rounded-[3px] border text-[9px] font-bold",style:{background:t?"#111827":"#fff",borderColor:t?"#111827":"#cbd5e1",color:t?"#fff":"transparent"},children:"✓"}),e.jsx("div",{className:"h-2.5 w-2.5 shrink-0 rounded-full bg-red-400"}),e.jsx("span",{className:"min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700",children:s.name}),e.jsx("span",{className:"shrink-0 text-[10px] font-bold text-slate-900",children:s.score})]},s.id)})})]})})}return e.jsx(S,{})}},d={render:()=>e.jsx("div",{className:"p-5",children:e.jsxs("div",{className:"w-[240px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",children:[e.jsx("div",{className:"mb-3 text-sm font-semibold text-slate-900",children:"Displayed levels:"}),e.jsx("div",{className:"mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-2"}),e.jsx("div",{className:"mb-2 text-sm font-semibold text-slate-900",children:"Customization:"}),e.jsxs("div",{className:"space-y-2 text-[12px] text-slate-500",children:[e.jsx("div",{children:"Use weighted nodes"}),e.jsx("div",{children:"Show all nodes"}),e.jsx("div",{children:"Show fixed nodes"}),e.jsx("div",{children:"Show variable nodes"})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2",children:[e.jsx("span",{className:"text-[11px] text-slate-500",children:"Library Loading"}),e.jsx("span",{className:"text-[11px] text-slate-500",children:"Visualization"}),e.jsx("span",{className:"text-[11px] text-slate-500",children:"Others"})]})]})})},n={render:()=>e.jsx("div",{className:"p-5",children:e.jsx("div",{className:"rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",children:e.jsxs("div",{className:"mx-auto flex min-h-[340px] max-w-[920px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white",children:[e.jsx("div",{className:"text-sm font-semibold text-slate-900",children:"NodeGraph Explorer"}),e.jsx("div",{className:"mt-2 text-xs text-slate-500",children:"Use the full Overview story for the live graph."})]})})})};var p,b,u;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: sharedArgs
}`,...(u=(b=a.parameters)==null?void 0:b.docs)==null?void 0:u.source}}};var h,N,v;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => {
    const initialNotebookIds = sampleVisibleNotebooks.map(item => item.id);
    function ResultsOnlyPanel() {
      const [selectedNotebookIds, setSelectedNotebookIds] = useState<string[]>(initialNotebookIds);
      const selectedNotebookSet = useMemo(() => new Set(selectedNotebookIds), [selectedNotebookIds]);
      const allSelected = selectedNotebookIds.length === initialNotebookIds.length;
      const toggleAll = () => {
        setSelectedNotebookIds(allSelected ? [] : initialNotebookIds);
      };
      const toggleNotebook = (notebookId: string) => {
        setSelectedNotebookIds(previous => previous.includes(notebookId) ? previous.filter(id => id !== notebookId) : [...previous, notebookId]);
      };
      return <div className="p-5">\r
          <div className="w-[260px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">\r
            <div className="mb-3 flex items-center justify-between gap-2">\r
              <span className="text-sm font-semibold text-slate-900">Résultats</span>\r
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-900">\r
                {selectedNotebookIds.length} notebooks\r
              </span>\r
            </div>\r
\r
            <div className="mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-2" />\r
\r
            <button type="button" onClick={toggleAll} className="mb-2 flex w-full items-center gap-2 rounded-md border-b border-slate-100 pb-2 text-left">\r
              <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-slate-300 bg-slate-900 text-[9px] font-bold text-white">\r
                {allSelected ? '✓' : ''}\r
              </div>\r
              <span className="text-sm font-semibold text-slate-900">Cochez tout</span>\r
            </button>\r
\r
            <div className="space-y-1.5">\r
              {sampleVisibleNotebooks.map(item => {
              const isSelected = selectedNotebookSet.has(item.id);
              return <button key={item.id} type="button" onClick={() => toggleNotebook(item.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50">\r
                    <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border text-[9px] font-bold" style={{
                  background: isSelected ? '#111827' : '#fff',
                  borderColor: isSelected ? '#111827' : '#cbd5e1',
                  color: isSelected ? '#fff' : 'transparent'
                }}>\r
                      ✓\r
                    </div>\r
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400" />\r
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">\r
                      {item.name}\r
                    </span>\r
                    <span className="shrink-0 text-[10px] font-bold text-slate-900">{item.score}</span>\r
                  </button>;
            })}\r
            </div>\r
          </div>\r
        </div>;
    }
    return <ResultsOnlyPanel />;
  }
}`,...(v=(N=l.parameters)==null?void 0:N.docs)==null?void 0:v.source}}};var f,g,w;d.parameters={...d.parameters,docs:{...(f=d.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div className="p-5">\r
      <div className="w-[240px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">\r
        <div className="mb-3 text-sm font-semibold text-slate-900">Displayed levels:</div>\r
        <div className="mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-2" />\r
        <div className="mb-2 text-sm font-semibold text-slate-900">Customization:</div>\r
        <div className="space-y-2 text-[12px] text-slate-500">\r
          <div>Use weighted nodes</div>\r
          <div>Show all nodes</div>\r
          <div>Show fixed nodes</div>\r
          <div>Show variable nodes</div>\r
        </div>\r
        <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2">\r
          <span className="text-[11px] text-slate-500">Library Loading</span>\r
          <span className="text-[11px] text-slate-500">Visualization</span>\r
          <span className="text-[11px] text-slate-500">Others</span>\r
        </div>\r
      </div>\r
    </div>
}`,...(w=(g=d.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var j,k,y;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="p-5">\r
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">\r
        <div className="mx-auto flex min-h-[340px] max-w-[920px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">\r
          <div className="text-sm font-semibold text-slate-900">NodeGraph Explorer</div>\r
          <div className="mt-2 text-xs text-slate-500">Use the full Overview story for the live graph.</div>\r
        </div>\r
      </div>\r
    </div>
}`,...(y=(k=n.parameters)==null?void 0:k.docs)==null?void 0:y.source}}};const q=["Overview","ResultsOnly","ControlsOnly","GraphOnly"];export{d as ControlsOnly,n as GraphOnly,a as Overview,l as ResultsOnly,q as __namedExportsOrder,M as default};
