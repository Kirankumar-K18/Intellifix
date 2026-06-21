import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authAPI, deptAPI, complaintAPI, analyticsAPI } from '../../services/api'
import { Layout, StatCard, Card, Badge, PriorityBadge, Button, Spinner, EmptyState, Modal, Input, Select, Table } from '../../components/common/UI'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts'
import toast from 'react-hot-toast'

const T = { pri:'#3b82f6', ok:'#10b981', warn:'#f59e0b', err:'#ef4444', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b', brd:'#2a3a5c', bg3:'#141d35', surf:'#1a2540', acc2:'#8b5cf6' }
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════ */
export function AdminDashboard() {
  const [data, setData]    = useState(null)
  const [loading, setL]    = useState(true)

  useEffect(() => {
    analyticsAPI.overview()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setL(false))
  }, [])

  if (loading) return <Layout title="Admin Dashboard"><Spinner /></Layout>

  const statusData = (data?.by_status || []).map(d => ({ name: d.status.replace('_',' '), value: d.count }))
  const deptData   = (data?.by_department || []).slice(0, 8).map(d => ({ name: (d.department__name || 'Unknown').split('&')[0].trim(), Complaints: d.count }))

  return (
    <Layout title="Admin Dashboard">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <StatCard label="Total Complaints" value={data?.summary?.total       ?? 0} icon="📋" color={T.pri} />
        <StatCard label="Resolved"         value={data?.summary?.resolved    ?? 0} icon="✅" color={T.ok} sub={`${data?.summary?.resolution_rate ?? 0}% rate`} />
        <StatCard label="Pending"          value={data?.summary?.pending     ?? 0} icon="⏳" color={T.warn} />
        <StatCard label="Total Users"      value={data?.total_users          ?? 0} icon="👥" color={T.acc2} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>📊 Complaints by Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => percent > 0.06 ? `${(percent*100).toFixed(0)}%` : ''}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#1a2540', border:'1px solid #2a3a5c', borderRadius:8, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {statusData.map((d, i) => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length] }}/>
                <span style={{ color:T.tx2 }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>🏢 Complaints by Department</div>
          <Card>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>
              Complaints by Department
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', padding:'10px' }}>Rank</th>
                  <th style={{ textAlign:'left', padding:'10px' }}>Department</th>
                  <th style={{ textAlign:'center', padding:'10px' }}>Complaints</th>
                </tr>
              </thead>

              <tbody>
                {[...deptData]
                  .sort((a,b) => b.Complaints - a.Complaints)
                  .map((dept,index) => (
                    <tr key={index}>
                      <td style={{ padding:'10px' }}>{index + 1}</td>
                      <td style={{ padding:'10px' }}>{dept.name}</td>
                      <td style={{ padding:'10px', textAlign:'center', fontWeight:'bold' }}>
                        {dept.Complaints}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Card>
      </div>

      {/* Monthly trend */}
      {(data?.monthly_trend?.length || 0) > 0 && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>📈 Monthly Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthly_trend.map(d => ({ month: d.month, Complaints: d.count }))} margin={{ top:5, right:20, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" />
              <XAxis dataKey="month" tick={{ fill:T.tx3, fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:T.tx3, fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#1a2540', border:'1px solid #2a3a5c', borderRadius:8, fontSize:12 }} />
              <Line type="monotone" dataKey="Complaints" stroke={T.pri} strokeWidth={2} dot={{ fill:T.pri, r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </Layout>
  )
}

/* ═══════════════════════════════════════════════════════
   ADMIN USERS
═══════════════════════════════════════════════════════ */
export function AdminUsers() {
  const [users,   setUsers]  = useState([])
  const [loading, setL]      = useState(true)
  const [modal,   setModal]  = useState(false)
  const [editUser, setEdit]  = useState(null)
  const [depts,   setDepts]  = useState([])
  const [search,  setSearch] = useState('')
  const [form,    setForm]   = useState({ name:'', email:'', phone:'', role:'citizen', department:'', password:'' })
  const [saving,  setSaving] = useState(false)

  const load = useCallback(() => {
    setL(true)
    Promise.all([authAPI.getUsers(), deptAPI.getAll()])
      .then(([ur, dr]) => { setUsers(ur.data.results || ur.data); setDepts(dr.data.results || dr.data) })
      .catch(() => {})
      .finally(() => setL(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEdit(null); setForm({ name:'', email:'', phone:'', role:'citizen', department:'', password:'' }); setModal(true) }
  const openEdit   = (u) => { setEdit(u); setForm({ name:u.name, email:u.email, phone:u.phone||'', role:u.role, department:u.department||'', password:'' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (!payload.department) delete payload.department
      if (editUser) await authAPI.updateUser(editUser.id, payload)
      else await authAPI.register({ ...payload, password2: payload.password })
      toast.success(editUser ? 'User updated' : 'User created')
      setModal(false); load()
    } catch (err) {
      const data = err.response?.data
      toast.error(typeof data === 'string' ? data : Object.values(data || {})[0]?.[0] || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return
    try { await authAPI.updateUser(id, { is_active: false }); toast.success('User deactivated'); load() }
    catch { toast.error('Failed') }
  }

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const columns = [
    { key:'name',  label:'Name',       render:(v,r) => <div><div style={{ fontWeight:600 }}>{v}</div><div style={{ fontSize:10, color:T.tx3 }}>{r.email}</div></div> },
    { key:'role',  label:'Role',       render:v  => <Badge type={v} /> },
    { key:'department_name', label:'Department', render:v => v || '—' },
    { key:'phone', label:'Phone',      render:v => v || '—' },
    { key:'is_active', label:'Status', render:v => <span style={{ fontSize:11, fontWeight:700, color: v?T.ok:T.err }}>{v?'Active':'Inactive'}</span> },
    { key:'id',    label:'Actions',    render:(_,r) => (
      <div style={{ display:'flex', gap:6 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={e => {
            e.stopPropagation()
            openEdit(r)
          }}
        >
          Edit
        </Button>

        {r.is_active ? (
          <Button
            size="sm"
            variant="danger"
            onClick={async e => {
              e.stopPropagation()
              if (!confirm('Deactivate this user?')) return
              try {
                await authAPI.updateUser(r.id, { is_active: false })
                toast.success('User deactivated')
                load()
              } catch {
                toast.error('Failed')
              }
            }}
          >
            Disable
          </Button>
        ) : (
          <Button
            size="sm"
            variant="success"
            onClick={async e => {
              e.stopPropagation()
              if (!confirm('Enable this user?')) return
              try {
                await authAPI.updateUser(r.id, { is_active: true })
                toast.success('User enabled')
                load()
              } catch {
                toast.error('Failed')
              }
            }}
          >
            Enable
          </Button>
        )}

        <Button
          size="sm"
          variant="danger"
          onClick={async e => {
            e.stopPropagation()

            if (!confirm(`Permanently delete ${r.name}?`)) return

            try {
              await authAPI.deleteUser(r.id)
              toast.success('User deleted')
              load()
            } catch (err) {
              console.error(err)
              toast.error('Delete failed')
            }
          }}
        >
          Delete
        </Button>
      </div>
    )},
  ]

  return (
    <Layout title="User Management" action={<Button onClick={openCreate}>+ Add User</Button>}>
      <div style={{ marginBottom:14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..."
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', width:'100%', maxWidth:300 }} />
      </div>
      <Card style={{ padding:0 }}>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyIcon="👥" emptyTitle="No users found" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editUser ? 'Edit User' : 'Create User'}>
        <Input label="Full Name *"  value={form.name}  onChange={e => setForm(f=>({...f,name:e.target.value}))} />
        <Input label="Email *"      type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
        <Input label="Phone"        value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
        <Input label={editUser ? 'New Password (leave blank to keep)' : 'Password *'} type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
        <Select label="Role" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
          <option value="citizen">Citizen</option>
          <option value="department">Department Official</option>
          <option value="admin">Admin</option>
        </Select>
        {form.role === 'department' && (
          <Select label="Department" value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}>
            <option value="">Select Department</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
          </Select>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave} style={{ flex:1, justifyContent:'center' }}>{editUser ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </Modal>
    </Layout>
  )
}

/* ═══════════════════════════════════════════════════════
   ADMIN DEPARTMENTS
═══════════════════════════════════════════════════════ */
export function AdminDepartments() {
  const [depts,  setDepts]  = useState([])
  const [loading, setL]     = useState(true)
  const [modal,  setModal]  = useState(false)
  const [edit,   setEdit]   = useState(null)
  const [form,   setForm]   = useState({ name:'', description:'', email:'', phone:'', icon:'🏢' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    deptAPI.getAll().then(r => setDepts(r.data.results || r.data)).catch(() => {}).finally(() => setL(false))
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => { setEdit(null); setForm({ name:'', description:'', email:'', phone:'', icon:'🏢' }); setModal(true) }
  const openEdit   = (d) => { setEdit(d); setForm({ name:d.name, description:d.description, email:d.email, phone:d.phone, icon:d.icon }); setModal(true) }

  const handleSave = async () => {
    if (!form.name) { toast.error('Department name required'); return }
    setSaving(true)
    try {
      if (edit) await deptAPI.update(edit.id, form)
      else await deptAPI.create(form)
      toast.success(edit ? 'Department updated' : 'Department created')
      setModal(false); load()
    } catch { toast.error('Save failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this department?')) return
    try { await deptAPI.delete(id); toast.success('Deactivated'); load() } catch { toast.error('Failed') }
  }

  return (
    <Layout title="Department Management" action={<Button onClick={openCreate}>+ Add Department</Button>}>
      {loading ? <Spinner /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {depts.length === 0 ? <EmptyState icon="🏢" title="No departments" /> : depts.map(d => (
            <Card key={d.id} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:28 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{d.name}</div>
                    <div style={{ fontSize:11, color:T.tx3 }}>{d.official_count} officials</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Button size="sm" variant="outline" onClick={() => openEdit(d)}>Edit</Button>
                  <Button size="sm" variant="danger"  onClick={() => handleDelete(d.id)}>×</Button>
                </div>
              </div>
              {d.description && <div style={{ fontSize:12, color:T.tx2 }}>{d.description}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, paddingTop:8, borderTop:`1px solid ${T.brd}` }}>
                {[['📋', d.complaint_count, 'Total'], ['⏳', d.pending_count, 'Pending'], ['✅', d.resolved_count, 'Resolved']].map(([ic,v,l]) => (
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:16 }}>{ic}</div>
                    <div style={{ fontSize:18, fontWeight:800 }}>{v}</div>
                    <div style={{ fontSize:9, color:T.tx3, textTransform:'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
              {d.avg_rating > 0 && <div style={{ fontSize:12, color:'#fbbf24' }}>{'★'.repeat(Math.round(d.avg_rating))} {d.avg_rating.toFixed(1)} avg rating</div>}
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={edit ? 'Edit Department' : 'Add Department'}>
        <Input label="Name *"        value={form.name}        onChange={e => setForm(f=>({...f,name:e.target.value}))} />
        <Input label="Icon Emoji"    value={form.icon}        onChange={e => setForm(f=>({...f,icon:e.target.value}))} />
        <Input label="Email"         type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
        <Input label="Phone"         value={form.phone}       onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
            style={{ width:'100%', background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'9px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:70 }} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave} style={{ flex:1, justifyContent:'center' }}>{edit ? 'Save' : 'Create'}</Button>
        </div>
      </Modal>
    </Layout>
  )
}

/* ═══════════════════════════════════════════════════════
   ADMIN COMPLAINTS
═══════════════════════════════════════════════════════ */
export function AdminComplaints() {
  const [complaints, setC]  = useState([])
  const [loading,    setL]  = useState(true)
  const [search,     setS]  = useState('')
  const [statusF,    setSF] = useState('')
  const [priF,       setPF] = useState('')
  const [deptF,      setDF] = useState('')
  const [depts,      setDepts] = useState([])

  const load = useCallback(() => {
    setL(true)
    const params = new URLSearchParams({ ordering:'-priority_score,-created_at' })
    if (statusF) params.set('status', statusF)
    if (priF)    params.set('priority', priF)
    if (deptF)   params.set('department', deptF)
    Promise.all([complaintAPI.getAll(params.toString()), deptAPI.getAll()])
      .then(([cr, dr]) => { setC(cr.data.results || cr.data); setDepts(dr.data.results || dr.data) })
      .catch(() => {})
      .finally(() => setL(false))
  }, [statusF, priF, deptF])

  useEffect(() => { load() }, [load])

  const filtered = complaints.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="All Complaints">
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setS(e.target.value)} placeholder="🔍 Search..."
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', flex:1, minWidth:160 }} />
        {[
          [statusF, setSF, [['','All Status'],['pending','Pending'],['in_progress','In Progress'],['resolved','Resolved'],['closed','Closed'],['rejected','Rejected']]],
          [priF, setPF, [['','All Priority'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']]],
        ].map(([val, set, opts], i) => (
          <select key={i} value={val} onChange={e => set(e.target.value)}
            style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
            {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <select value={deptF} onChange={e => setDF(e.target.value)}
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <Card style={{ padding:0 }}>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key:'id',          label:'#',          style:{ width:50, fontFamily:'monospace', color:T.tx3 } },
              { key:'title',       label:'Title',      render:(v,r) => <div><div style={{ fontWeight:600, fontSize:12 }}>{v}</div><div style={{ fontSize:10, color:T.tx3 }}>👤 {r.is_anonymous?'Anonymous':r.user_name}</div></div> },
              { key:'department_name', label:'Dept',   render:v => <span style={{ fontSize:11 }}>{v || '—'}</span> },
              { key:'priority',    label:'Priority',   render:v => <PriorityBadge priority={v} /> },
              { key:'priority_score', label:'Score',   render:v => <span style={{ fontSize:12, fontWeight:700, color:T.pri }}>{v?.toFixed(0) || 0}</span> },
              { key:'status',      label:'Status',     render:v => <Badge type={v} /> },
              { key:'location',    label:'Location',   render:v => <span style={{ fontSize:11, color:T.tx3 }}>📍 {v}</span>, style:{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
              { key:'created_at',  label:'Date',       render:v => <span style={{ fontSize:11, color:T.tx3 }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
            ]}
            data={filtered}
            emptyIcon="📋"
            emptyTitle="No complaints found"
          />
        )}
      </Card>
    </Layout>
  )
}

/* ═══════════════════════════════════════════════════════
   ADMIN ANALYTICS
═══════════════════════════════════════════════════════ */
export function AdminAnalytics() {
  const [data,    setData]  = useState(null)
  const [loading, setL]     = useState(true)

  useEffect(() => {
    analyticsAPI.overview().then(r => setData(r.data)).catch(() => {}).finally(() => setL(false))
  }, [])

  if (loading) return <Layout title="Analytics"><Spinner /></Layout>
  if (!data)   return <Layout title="Analytics"><div style={{ color:T.tx3, textAlign:'center', padding:40 }}>No data</div></Layout>

  const statusData  = (data.by_status   || []).map(d => ({ name: d.status.replace('_',' '),    value: d.count }))
  const priorityData = (data.by_priority || []).map(d => ({ name: d.priority, value: d.count }))
  const deptData    = (data.by_department || []).slice(0,6).map(d => ({ name:(d.department__name||'').split('&')[0].trim(), Complaints:d.count }))
  const monthly     = (data.monthly_trend || []).map(d => ({ month: d.month, Complaints: d.count }))
  const ratingDist  = (data.feedback?.distribution || []).map(d => ({ stars: `${d.rating}★`, Count: d.count }))

  const PRI_COLORS = { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' }

  return (
    <Layout title="Analytics Dashboard">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <StatCard label="Total"          value={data.summary?.total            ?? 0} icon="📋" color={T.pri} />
        <StatCard label="Resolved"       value={data.summary?.resolved         ?? 0} icon="✅" color={T.ok} sub={`${data.summary?.resolution_rate}% rate`} />
        <StatCard label="Avg Rating"     value={`${(data.feedback?.avg_rating??0).toFixed(1)}★`} icon="⭐" color='#fbbf24' />
        <StatCard label="Departments"    value={data.total_departments          ?? 0} icon="🏢" color={T.acc2} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>📊 By Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({name,percent}) => percent>0.05?`${(percent*100).toFixed(0)}%`:''} labelLine={false}>
                {statusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#1a2540', border:'1px solid #2a3a5c', borderRadius:8, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {statusData.map((d,i) => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length] }}/>
                <span style={{ color:T.tx2 }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>⚡ By Priority</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({name,percent}) => percent>0.05?`${(percent*100).toFixed(0)}%`:''} labelLine={false}>
                {priorityData.map((d,i) => <Cell key={i} fill={PRI_COLORS[d.name] || COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#1a2540', border:'1px solid #2a3a5c', borderRadius:8, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {priorityData.map(d => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:PRI_COLORS[d.name]||T.pri }}/>
                <span style={{ color:T.tx2 }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>📈 Monthly Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly} margin={{ top:5, right:20, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" />
              <XAxis dataKey="month" tick={{ fill:T.tx3, fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:T.tx3, fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#1a2540', border:'1px solid #2a3a5c', borderRadius:8, fontSize:12 }} />
              <Line type="monotone" dataKey="Complaints" stroke={T.pri} strokeWidth={2} dot={{ fill:T.pri, r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {ratingDist.length > 0 && (
          <Card>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>⭐ Rating Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingDist} layout="vertical" margin={{ top:0, right:10, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" horizontal={false} />
                <XAxis type="number" tick={{ fill:T.tx3, fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stars" tick={{ fill:T.tx3, fontSize:11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background:'#1a2540', border:'1px solid #2a3a5c', borderRadius:8, fontSize:12 }} />
                <Bar dataKey="Count" fill="#fbbf24" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign:'center', marginTop:10 }}>
              <div style={{ fontSize:28, fontWeight:800, color:'#fbbf24' }}>{(data.feedback?.avg_rating||0).toFixed(1)}</div>
              <div style={{ fontSize:12, color:T.tx3 }}>Average Rating ({data.feedback?.total || 0} reviews)</div>
            </div>
          </Card>
        )}
      </div>

      {deptData.length > 0 && (
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>🏢 Complaints by Department</div>
          <Card>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>
              Complaints by Department
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', padding:'10px' }}>Rank</th>
                  <th style={{ textAlign:'left', padding:'10px' }}>Department</th>
                  <th style={{ textAlign:'center', padding:'10px' }}>Complaints</th>
                </tr>
              </thead>

              <tbody>
                {[...deptData]
                  .sort((a,b) => b.Complaints - a.Complaints)
                  .map((dept,index) => (
                    <tr key={index}>
                      <td style={{ padding:'10px' }}>{index + 1}</td>
                      <td style={{ padding:'10px' }}>{dept.name}</td>
                      <td style={{ padding:'10px', textAlign:'center', fontWeight:'bold' }}>
                        {dept.Complaints}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Card>
      )}
    </Layout>
  )
}
export default AdminDashboard