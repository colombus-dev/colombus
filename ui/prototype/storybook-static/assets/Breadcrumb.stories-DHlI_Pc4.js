import{j as r}from"./jsx-runtime-Cf8x2fCZ.js";import{S as B}from"./index-BX1nfw1R.js";import{c as s}from"./utils-DjqsqOe8.js";import{C as h}from"./chevron-right-Dve6Cy0_.js";import{c as j}from"./createLucideIcon-DQukpnj5.js";import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],I=j("ellipsis",g);function i({...e}){return r.jsx("nav",{"aria-label":"breadcrumb","data-slot":"breadcrumb",...e})}function p({className:e,...a}){return r.jsx("ol",{"data-slot":"breadcrumb-list",className:s("text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",e),...a})}function t({className:e,...a}){return r.jsx("li",{"data-slot":"breadcrumb-item",className:s("inline-flex items-center gap-1.5",e),...a})}function o({asChild:e,className:a,...d}){const f=e?B:"a";return r.jsx(f,{"data-slot":"breadcrumb-link",className:s("hover:text-foreground transition-colors",a),...d})}function b({className:e,...a}){return r.jsx("span",{"data-slot":"breadcrumb-page",role:"link","aria-disabled":"true","aria-current":"page",className:s("text-foreground font-normal",e),...a})}function n({children:e,className:a,...d}){return r.jsx("li",{"data-slot":"breadcrumb-separator",role:"presentation","aria-hidden":"true",className:s("[&>svg]:size-3.5",a),...d,children:e??r.jsx(h,{})})}function x({className:e,...a}){return r.jsxs("span",{"data-slot":"breadcrumb-ellipsis",role:"presentation","aria-hidden":"true",className:s("flex size-9 items-center justify-center",e),...a,children:[r.jsx(I,{className:"size-4"}),r.jsx("span",{className:"sr-only",children:"More"})]})}i.__docgenInfo={description:"",methods:[],displayName:"Breadcrumb"};p.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbList"};t.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbItem"};o.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbLink",props:{asChild:{required:!1,tsType:{name:"boolean"},description:""}}};b.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbPage"};n.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbSeparator"};x.__docgenInfo={description:"",methods:[],displayName:"BreadcrumbEllipsis"};const P={title:"UI/Breadcrumb",component:i,tags:["autodocs"]},c={render:()=>r.jsx(i,{children:r.jsxs(p,{children:[r.jsx(t,{children:r.jsx(o,{href:"#",children:"Project"})}),r.jsx(n,{}),r.jsx(t,{children:r.jsx(o,{href:"#",children:"Exploration"})}),r.jsx(n,{}),r.jsx(t,{children:r.jsx(x,{})}),r.jsx(n,{}),r.jsx(t,{children:r.jsx(b,{children:"Dashboard"})})]})})};var m,l,u;c.parameters={...c.parameters,docs:{...(m=c.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <Breadcrumb>\r
      <BreadcrumbList>\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="#">Project</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbLink href="#">Exploration</BreadcrumbLink>\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbEllipsis />\r
        </BreadcrumbItem>\r
        <BreadcrumbSeparator />\r
        <BreadcrumbItem>\r
          <BreadcrumbPage>Dashboard</BreadcrumbPage>\r
        </BreadcrumbItem>\r
      </BreadcrumbList>\r
    </Breadcrumb>
}`,...(u=(l=c.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};const v=["Default"];export{c as Default,v as __namedExportsOrder,P as default};
