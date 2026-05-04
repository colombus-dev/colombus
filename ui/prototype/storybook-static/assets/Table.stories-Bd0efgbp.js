import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{c as l}from"./utils-DjqsqOe8.js";import"./index-yBjzXJbu.js";function n({className:a,...r}){return e.jsx("div",{"data-slot":"table-container",className:"relative w-full overflow-x-auto",children:e.jsx("table",{"data-slot":"table",className:l("w-full caption-bottom text-sm",a),...r})})}function m({className:a,...r}){return e.jsx("thead",{"data-slot":"table-header",className:l("[&_tr]:border-b",a),...r})}function p({className:a,...r}){return e.jsx("tbody",{"data-slot":"table-body",className:l("[&_tr:last-child]:border-0",a),...r})}function d({className:a,...r}){return e.jsx("tr",{"data-slot":"table-row",className:l("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",a),...r})}function o({className:a,...r}){return e.jsx("th",{"data-slot":"table-head",className:l("text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",a),...r})}function s({className:a,...r}){return e.jsx("td",{"data-slot":"table-cell",className:l("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",a),...r})}n.__docgenInfo={description:"",methods:[],displayName:"Table"};m.__docgenInfo={description:"",methods:[],displayName:"TableHeader"};p.__docgenInfo={description:"",methods:[],displayName:"TableBody"};o.__docgenInfo={description:"",methods:[],displayName:"TableHead"};d.__docgenInfo={description:"",methods:[],displayName:"TableRow"};s.__docgenInfo={description:"",methods:[],displayName:"TableCell"};const f={title:"UI/Table",component:n,tags:["autodocs"]},t={render:()=>e.jsx("div",{className:"w-[520px] rounded-xl border p-2",children:e.jsxs(n,{children:[e.jsx(m,{children:e.jsxs(d,{children:[e.jsx(o,{children:"Notebook"}),e.jsx(o,{children:"Type"}),e.jsx(o,{className:"text-right",children:"Score"})]})}),e.jsx(p,{children:[["load_data.ipynb","Preparation","94%"],["prepare_features.ipynb","Transformation","82%"],["train_model.ipynb","Training","76%"]].map(([a,r,x])=>e.jsxs(d,{children:[e.jsx(s,{className:"font-medium",children:a}),e.jsx(s,{children:r}),e.jsx(s,{className:"text-right",children:x})]},a))})]})})};var i,c,b;t.parameters={...t.parameters,docs:{...(i=t.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <div className="w-[520px] rounded-xl border p-2">\r
      <Table>\r
        <TableHeader>\r
          <TableRow>\r
            <TableHead>Notebook</TableHead>\r
            <TableHead>Type</TableHead>\r
            <TableHead className="text-right">Score</TableHead>\r
          </TableRow>\r
        </TableHeader>\r
        <TableBody>\r
          {[['load_data.ipynb', 'Preparation', '94%'], ['prepare_features.ipynb', 'Transformation', '82%'], ['train_model.ipynb', 'Training', '76%']].map(([name, type, score]) => <TableRow key={name}>\r
              <TableCell className="font-medium">{name}</TableCell>\r
              <TableCell>{type}</TableCell>\r
              <TableCell className="text-right">{score}</TableCell>\r
            </TableRow>)}\r
        </TableBody>\r
      </Table>\r
    </div>
}`,...(b=(c=t.parameters)==null?void 0:c.docs)==null?void 0:b.source}}};const y=["Default"];export{t as Default,y as __namedExportsOrder,f as default};
