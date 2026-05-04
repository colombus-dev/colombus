import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as w}from"./index-BlmOqGMO.js";import{S as t}from"./Sidebar-6XHIXzfg.js";import"./index-yBjzXJbu.js";import"./createLucideIcon-DQukpnj5.js";const A={title:"Layout/Sidebar",component:t,tags:["autodocs"],parameters:{layout:"centered"}},r={render:()=>{const[v,x]=w.useState("explorer");return e.jsx("div",{className:"w-[320px]",children:e.jsx(t,{projectName:"Reusable workspace",activeView:v,onNavigate:x})})}},a={render:()=>e.jsx("div",{className:"w-[320px]",children:e.jsx(t,{projectName:"Reusable workspace",activeView:"home"})})},s={render:()=>e.jsx("div",{className:"w-[320px]",children:e.jsx(t,{projectName:"Reusable workspace",activeView:"explorer"})})};var o,c,i;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => {
    const [activeView, setActiveView] = useState<'home' | 'explorer'>('explorer');
    return <div className="w-[320px]">\r
        <Sidebar projectName="Reusable workspace" activeView={activeView} onNavigate={setActiveView} />\r
      </div>;
  }
}`,...(i=(c=r.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var p,m,d;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="w-[320px]">\r
      <Sidebar projectName="Reusable workspace" activeView="home" />\r
    </div>
}`,...(d=(m=a.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};var n,l,u;s.parameters={...s.parameters,docs:{...(n=s.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <div className="w-[320px]">\r
      <Sidebar projectName="Reusable workspace" activeView="explorer" />\r
    </div>
}`,...(u=(l=s.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};const R=["Default","HomeActive","ExplorerActive"];export{r as Default,s as ExplorerActive,a as HomeActive,R as __namedExportsOrder,A as default};
