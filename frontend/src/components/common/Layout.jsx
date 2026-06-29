import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import { Sidebar } from "./Sidebar";
import { useTheme } from "../../context/ThemeContext";

export function Layout({
  title,
  children,
  action,
  showBack = false,
}) {

  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  return (

<div
style={{
display:"flex",
minHeight:"100vh",
background:"var(--bg-body)"
}}
>

<Sidebar/>

<main
style={{

flex:1,

marginLeft:250,

display:"flex",

flexDirection:"column",

minHeight:"100vh"

}}
>

<div

style={{

height:64,

background:"var(--bg-header)",

borderBottom:"1px solid var(--border)",

display:"flex",

alignItems:"center",

justifyContent:"space-between",

padding:"0 26px",

position:"sticky",

top:0,

zIndex:20

}}

>

<div

style={{

display:"flex",

alignItems:"center",

gap:14

}}

>

{showBack && (

<button

onClick={()=>navigate(-1)}

style={{

border:"none",

background:"transparent",

color:"#fff",

cursor:"pointer",

display:"flex",

alignItems:"center",

gap:6,

fontSize:15,

fontWeight:600

}}

>

<FiArrowLeft/>

Back

</button>

)}

<h2

style={{

margin:0,

fontSize:22,

fontWeight:700,

color:"#fff"

}}

>

{title}

</h2>

</div>

<div

style={{

display:"flex",

alignItems:"center",

gap:12

}}

>

{action}

<button

onClick={toggleTheme}

style={{

border:"none",

background:"rgba(255,255,255,.12)",

padding:"8px 14px",

borderRadius:10,

cursor:"pointer",

color:"#fff",

fontWeight:600

}}

>

{theme==="dark"

?"☀ Light"

:"🌙 Dark"

}

</button>

</div>

</div>
{/* Page Content */}

<div
  style={{
    flex: 1,
    padding: 24,
    background: "var(--bg-body)",
    overflow: "auto",
  }}
>
  {children}
</div>

</main>

</div>

);

}