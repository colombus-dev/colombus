import{j as r}from"./jsx-runtime-Cf8x2fCZ.js";import{r as o}from"./index-BlmOqGMO.js";import{C as p}from"./CreatePatternPanel-wUWjhKT3.js";import{s as c}from"./storybookData-DJEYIHwQ.js";import"./index-yBjzXJbu.js";import"./stepLegend-DjgZYxVm.js";import"./circle-play-BKbW7Q_I.js";import"./createLucideIcon-DQukpnj5.js";const x={title:"Editor/CreatePatternPanel",component:p,tags:["autodocs"],parameters:{layout:"fullscreen"}},e={render:()=>{const[d,t]=o.useState(c),[P,a]=o.useState("");return r.jsx("div",{className:"p-5",children:r.jsx(p,{patternName:d,pythonCode:P,onPatternNameChange:t,onPythonCodeChange:a,onExecutePattern:()=>{t(""),a("")},onSavePattern:()=>{}})})}};var n,s,m;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => {
    const [patternName, setPatternName] = useState(samplePatternName);
    const [pythonCode, setPythonCode] = useState('');
    return <div className="p-5">\r
        <CreatePatternPanel patternName={patternName} pythonCode={pythonCode} onPatternNameChange={setPatternName} onPythonCodeChange={setPythonCode} onExecutePattern={() => {
        setPatternName('');
        setPythonCode('');
      }} onSavePattern={() => undefined} />\r
      </div>;
  }
}`,...(m=(s=e.parameters)==null?void 0:s.docs)==null?void 0:m.source}}};const S=["Default"];export{e as Default,S as __namedExportsOrder,x as default};
