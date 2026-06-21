import { useState, useEffect, useCallback } from 'react'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Layout,
  Card,
  Table,
  Spinner,
  Badge,
  Button,
  Input,
  Modal,
  Select
} from '../../components/common/UI'
const T = {
  tx:'#e2e8f0',
  tx2:'#94a3b8',
  tx3:'#64748b',
  bg3:'#0f172a',
  brd:'#2a3a5c',
  ok:'#10b981',
  err:'#ef4444'
}

export default function Workers() {
  const [users,   setUsers]  = useState([])
  const [loading, setL]      = useState(true)
  const [modal,   setModal]  = useState(false)
  const [editUser, setEdit]  = useState(null)
  const [search,  setSearch] = useState('')
  const [form, setForm] = useState({name:'',email:'',phone:'',password:''})  
  const [saving,  setSaving] = useState(false)
  const load = useCallback(() => {
    setL(true)

    authAPI.getUsers('role=worker')
        .then(res => {
        setUsers(res.data.results || res.data)
        })
        .catch(err => {
        console.error(err)
        toast.error('Failed to load workers')
        })
        .finally(() => setL(false))
    }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEdit(null); setForm({ name:'', email:'', phone:'', password:'' }); setModal(true) }
  const openEdit   = (u) => { setEdit(u); setForm({ name:u.name, email:u.email, phone:u.phone||'', password:'' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (!payload.department) delete payload.department
      if (editUser) await authAPI.updateUser(editUser.id, payload)
      else await authAPI.createUser(payload)
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
    <Layout title="Worker Management" action={<Button onClick={openCreate}>+ Add Worker</Button>}>
      <div style={{ marginBottom:14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..."
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', width:'100%', maxWidth:300 }} />
      </div>
      <Card style={{ padding:0 }}>
        {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyIcon="👥" emptyTitle="No users found" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editUser ? 'Edit Worker' : 'Create Worker'}>
        <Input label="Full Name *"  value={form.name}  onChange={e => setForm(f=>({...f,name:e.target.value}))} />
        <Input label="Email *"      type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
        <Input label="Phone"        value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
        <Input label={editUser ? 'New Password (leave blank to keep)' : 'Password *'} type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave} style={{ flex:1, justifyContent:'center' }}>{editUser ? 'Save Changes' : 'Create Worker'}</Button>
        </div>
      </Modal>
    </Layout>
  )
}
