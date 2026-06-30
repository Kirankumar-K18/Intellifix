import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { notifAPI } from "../../services/api";
import logo from "../../assets/intellifix-logo.png";

const NAV_LINKS = {
  citizen: [
    { to: "/user", label: "Dashboard", icon: "🏠" },
    { to: "/user/submit", label: "Submit Complaint", icon: "➕" },
    { to: "/user/complaints", label: "My Complaints", icon: "📋" },
  ],

  department_admin: [
    { to: "/department", label: "Dashboard", icon: "🏠" },
    { to: "/department/complaints", label: "Complaints", icon: "📋" },
    { to: "/department/workers", label: "Workers", icon: "👷" },
    { to: "/department/map", label: "Map", icon: "🗺️" },
    { to: "/department/analytics", label: "Analytics", icon: "📈" },
  ],

  worker: [
    { to: "/department", label: "Dashboard", icon: "🏠" },
    { to: "/department/complaints", label: "Assigned", icon: "🛠️" },
    { to: "/worker/performance", label: "Performance", icon: "⭐" },
  ],

  admin: [
    { to: "/admin", label: "Dashboard", icon: "🏠" },
    { to: "/admin/users", label: "Users", icon: "👥" },
    { to: "/admin/departments", label: "Departments", icon: "🏢" },
    { to: "/admin/complaints", label: "Complaints", icon: "📋" },
    { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  ],
};

export function Sidebar() {

  const { user, logout } = useAuth();

  const { theme, toggleTheme } = useTheme();

  const location = useLocation();

  const navigate = useNavigate();

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadUnread = () => {
        notifAPI
        .unreadCount()
        .then((r) => setUnread(r.data.unread_count))
        .catch(() => {});
    };

    loadUnread();

    const interval = setInterval(loadUnread, 30000);

    return () => clearInterval(interval);
    }, [user]);

  const links = NAV_LINKS[user?.role] || [];

  return (

<aside
style={{
width:250,
background:"var(--bg-sidebar)",
color:"#fff",
display:"flex",
flexDirection:"column",
position:"fixed",
top:0,
left:0,
bottom:0,
borderRight:"1px solid rgba(255,255,255,.08)"
}}
>

<div
  style={{
    height: 85,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    padding: "10px 16px"
  }}
>
  <img
    src={logo}
    alt="IntelliFix"
    style={{
      width: "5000px",
      maxWidth: "140%",
      objectFit: "contain",
      display: "block"
    }}
  />
</div>
{/* Navigation */}

<nav
style={{
flex:1,
padding:"12px 10px",
overflowY:"auto"
}}
>

{links.map((link)=>{

const active=location.pathname===link.to;

return(

<Link
key={link.to}
to={link.to}
style={{

display:"flex",
alignItems:"center",
gap:12,

padding:"12px 14px",

marginBottom:6,

borderRadius:10,

textDecoration:"none",

fontWeight:600,

fontSize:14,

transition:".2s",

color:active
?"#fff"
:"rgba(255,255,255,.72)",

background:active
?"rgba(255,255,255,.12)"
:"transparent"

}}

onMouseEnter={(e)=>{

if(active)return;

e.currentTarget.style.background="rgba(255,255,255,.08)";

e.currentTarget.style.color="#fff";

}}

onMouseLeave={(e)=>{

if(active)return;

e.currentTarget.style.background="transparent";

e.currentTarget.style.color="rgba(255,255,255,.72)";

}}

>

<span
style={{
width:22,
textAlign:"center",
fontSize:18
}}
>
{link.icon}
</span>

<span
style={{
flex:1
}}
>
{link.label}
</span>

{link.label==="Dashboard" && unread>0 && (

<div
style={{
background:"#ef4444",
padding:"2px 7px",
borderRadius:20,
fontSize:10,
fontWeight:700,
color:"#fff"
}}
>

{unread}

</div>

)}

</Link>

)

})}

</nav>

{/* Footer */}

<div
style={{
padding:16,
borderTop:"1px solid rgba(255,255,255,.08)"
}}
>

<div
  onClick={() => navigate("/profile")}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    cursor: "pointer",
    padding: "10px",
    borderRadius: 12,
    transition: "0.2s",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "rgba(255,255,255,.08)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
  }}
>
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "linear-gradient(135deg,#0D6EFD,#5B5BD6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 16,
    }}
  >
    {user?.name?.[0]?.toUpperCase() || "U"}
  </div>

  <div>
    <div
      style={{
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {user?.name?.split(" ").slice(0, 2).join(" ")}
    </div>

    <div
      style={{
        fontSize: 11,
        opacity: 0.7,
        textTransform: "capitalize",
      }}
    >
      {user?.role?.replace("_", " ").toUpperCase()}
    </div>
  </div>
</div>


<button
  onClick={async () => {
    await logout();
    navigate("/login");
  }}
  style={{
    width: "100%",
    background: "transparent",
    border: "none",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer",
    color: "#EF4444",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.25s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "rgba(239,68,68,0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
  }}
>
  <RiLogoutBoxRLine size={20} />
  <span>Logout</span>
</button>

</div>

</aside>

);

}