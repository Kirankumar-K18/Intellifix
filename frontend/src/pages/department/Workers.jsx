import { useState, useEffect, useCallback } from 'react'
import { authAPI, analyticsAPI } from '../../services/api'
import toast from 'react-hot-toast'

import {
  Layout,
  Card,
  Table,
  Spinner,
  Badge,
  Button,
  Input,
  Modal
} from '../../components/common/UI'

import { T } from '../../styles/theme'

export default function Workers() {

  const [users, setUsers] = useState([])
  const [loading, setL] = useState(true)

  const [modal, setModal] = useState(false)
  const [editUser, setEdit] = useState(null)

  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  const [saving, setSaving] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)

  const [stats, setStats] = useState({
    totalWorkers: 0,
    avgRating: '0.0',
    bestWorker: 'N/A',
    totalAssigned: 0
  })


  // =========================================================
  // LOAD WORKERS
  // =========================================================

  const load = useCallback(() => {

    setL(true)

    authAPI
      .getUsers('role=worker')

      .then(res => {

        const workerData = res.data.results || res.data

        setUsers(workerData)

        // -----------------------------------------
        // Total workers
        // -----------------------------------------

        const totalWorkers = workerData.length


        // -----------------------------------------
        // Average rating
        // -----------------------------------------

        const ratedWorkers = workerData.filter(
          w => Number(w.avg_rating || 0) > 0
        )

        const avgRating =
          ratedWorkers.length > 0
            ? (
                ratedWorkers.reduce(
                  (sum, w) =>
                    sum + Number(w.avg_rating || 0),
                  0
                ) / ratedWorkers.length
              ).toFixed(1)
            : '0.0'


        // -----------------------------------------
        // Best worker
        // -----------------------------------------

        const bestWorker =
          workerData.length > 0
            ? [...workerData].sort(
                (a, b) =>
                  Number(b.avg_rating || 0) -
                  Number(a.avg_rating || 0)
              )[0]
            : null


        // -----------------------------------------
        // Total assigned complaints
        // -----------------------------------------

        const totalAssigned = workerData.reduce(
          (sum, w) =>
            sum + Number(w.assigned_count || 0),
          0
        )


        setStats({
          totalWorkers,
          avgRating,
          bestWorker: bestWorker?.name || 'N/A',
          totalAssigned
        })

      })

      .catch(err => {

        console.error(err)

        toast.error('Failed to load workers')

      })

      .finally(() => {

        setL(false)

      })

  }, [])


  useEffect(() => {

    load()

  }, [load])


  // =========================================================
  // CREATE WORKER
  // =========================================================

  const openCreate = () => {

    setEdit(null)

    setForm({
      name: '',
      email: '',
      phone: '',
      password: ''
    })

    setModal(true)

  }


  // =========================================================
  // EDIT WORKER
  // =========================================================

  const openEdit = (user) => {

    setEdit(user)

    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: ''
    })

    setModal(true)

  }


  // =========================================================
  // SAVE WORKER
  // =========================================================

  const handleSave = async () => {

    // Basic validation

    if (!form.name.trim()) {

      toast.error('Name is required')

      return

    }


    if (!form.email.trim()) {

      toast.error('Email is required')

      return

    }


    // Password is required for new workers

    if (!editUser && !form.password) {

      toast.error('Password is required')

      return

    }


    setSaving(true)


    try {

      // -----------------------------------------------------
      // EDIT EXISTING WORKER
      // -----------------------------------------------------

      if (editUser) {

        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone
        }


        // Only send password when user entered a new one

        if (form.password) {

          payload.password = form.password

        }


        // IMPORTANT:
        // Keep the role as worker during edit

        payload.role = 'worker'


        await authAPI.updateUser(
          editUser.id,
          payload
        )


        toast.success('Worker updated successfully')

      }

      // -----------------------------------------------------
      // CREATE NEW WORKER
      // -----------------------------------------------------

      else {

        const payload = {

          name: form.name,
          email: form.email,
          phone: form.phone,

          // IMPORTANT FIX
          // Without this Django uses the default role
          // which is citizen.

          role: 'worker',

          password: form.password

        }


        console.log(
          'Creating worker:',
          payload
        )


        await authAPI.createUser(payload)


        toast.success(
          'Worker created successfully'
        )

      }


      // Close modal

      setModal(false)

      setEdit(null)

      setForm({
        name: '',
        email: '',
        phone: '',
        password: ''
      })


      // Reload workers

      load()

    }

    catch (err) {

      console.error(
        'Worker save error:',
        err
      )


      const data = err.response?.data


      if (typeof data === 'string') {

        toast.error(data)

      }

      else if (data) {

        const firstError =
          Object.values(data)[0]

        if (Array.isArray(firstError)) {

          toast.error(
            firstError[0]
          )

        }

        else {

          toast.error(
            String(firstError)
          )

        }

      }

      else {

        toast.error(
          'Failed to save worker'
        )

      }

    }

    finally {

      setSaving(false)

    }

  }


  // =========================================================
  // DISABLE / ENABLE WORKER
  // =========================================================

  const toggleActive = async (worker) => {

    const action =
      worker.is_active
        ? 'deactivate'
        : 'enable'


    if (
      !confirm(
        `Are you sure you want to ${action} ${worker.name}?`
      )
    ) {

      return

    }


    try {

      await authAPI.updateUser(
        worker.id,
        {
          is_active:
            !worker.is_active
        }
      )


      toast.success(
        worker.is_active
          ? 'Worker deactivated'
          : 'Worker enabled'
      )


      load()

    }

    catch (err) {

      console.error(err)

      toast.error(
        'Failed to update worker'
      )

    }

  }


  // =========================================================
  // DELETE WORKER
  // =========================================================

  const handleDelete = async (worker) => {

    if (
      !confirm(
        `Permanently delete ${worker.name}?`
      )
    ) {

      return

    }


    try {

      await authAPI.deleteUser(
        worker.id
      )


      toast.success(
        'Worker deleted'
      )


      load()

    }

    catch (err) {

      console.error(err)

      toast.error(
        'Delete failed'
      )

    }

  }


  // =========================================================
  // SEARCH
  // =========================================================

  const filtered = users.filter(
    user => {

      const searchText =
        search.toLowerCase()

      return (
        !searchText ||
        user.name
          ?.toLowerCase()
          .includes(searchText) ||
        user.email
          ?.toLowerCase()
          .includes(searchText) ||
        user.department_name
          ?.toLowerCase()
          .includes(searchText)
      )

    }
  )


  // =========================================================
  // TABLE COLUMNS
  // =========================================================

  const columns = [

    {
      key: 'name',

      label: 'Name',

      render: (value, row) => (

        <div>

          <div
            style={{
              fontWeight: 600
            }}
          >
            {value}
          </div>

          <div
            style={{
              fontSize: 10,
              color: T.tx3
            }}
          >
            {row.email}
          </div>

        </div>

      )
    },


    {
      key: 'role',

      label: 'Role',

      render: value => (

        <Badge type={value} />

      )
    },


    {
      key: 'department_name',

      label: 'Department',

      render: value =>
        value || '—'
    },


    {
      key: 'assigned_count',

      label: 'Assigned',

      render: value =>
        value || 0
    },


    {
      key: 'in_progress_count',

      label: 'In Progress',

      render: value =>
        value || 0
    },


    {
      key: 'resolved_count',

      label: 'Resolved',

      render: value =>
        value || 0
    },


    {
      key: 'avg_rating',

      label: 'Rating',

      render: value =>
        `⭐ ${value || 0}`
    },


    {
      key: 'phone',

      label: 'Phone',

      render: value =>
        value || '—'
    },


    {
      key: 'is_active',

      label: 'Status',

      render: value => (

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: value
              ? T.ok
              : T.err
          }}
        >
          {value
            ? 'Active'
            : 'Inactive'}
        </span>

      )
    },


    {
      key: 'id',

      label: 'Actions',

      render: (_, row) => (

        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap'
          }}
        >

          {/* EDIT */}

          <Button
            size="sm"
            variant="outline"
            onClick={e => {

              e.stopPropagation()

              openEdit(row)

            }}
          >
            Edit
          </Button>


          {/* ENABLE / DISABLE */}

          <Button
            size="sm"
            variant={
              row.is_active
                ? 'danger'
                : 'success'
            }

            onClick={e => {

              e.stopPropagation()

              toggleActive(row)

            }}
          >
            {row.is_active
              ? 'Disable'
              : 'Enable'}
          </Button>


          {/* DELETE */}

          <Button
            size="sm"
            variant="danger"
            onClick={e => {

              e.stopPropagation()

              handleDelete(row)

            }}
          >
            Delete
          </Button>

        </div>

      )
    }

  ]


  // =========================================================
  // UI
  // =========================================================

  return (

    <Layout

      title="Worker Management"

      action={

        <div
          style={{
            display: 'flex',
            gap: 10
          }}
        >

          {/* EXPORT PDF */}

          <Button
            variant="outline"

            onClick={async () => {

              try {

                const response =
                  await analyticsAPI
                    .exportWorkersPDF()


                const url =
                  window.URL.createObjectURL(
                    new Blob(
                      [response.data]
                    )
                  )


                const link =
                  document.createElement(
                    'a'
                  )


                link.href = url

                link.download =
                  'workers_report.pdf'


                document.body.appendChild(
                  link
                )

                link.click()

                link.remove()


                window.URL.revokeObjectURL(
                  url
                )


                toast.success(
                  'PDF downloaded'
                )

              }

              catch (err) {

                console.error(err)

                toast.error(
                  'Failed to download report'
                )

              }

            }}
          >
            📄 Export PDF
          </Button>


          {/* ADD WORKER */}

          <Button
            onClick={openCreate}
          >
            + Add Worker
          </Button>

        </div>

      }
    >

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 20
        }}
      >

        <Card>

          <div
            style={{
              fontSize: 24
            }}
          >
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700
            }}
          >
            {stats.totalWorkers}
          </div>

          <div
            style={{
              color: T.tx2,
              fontSize: 12
            }}
          >
            Total Workers
          </div>

        </Card>


        <Card>

          <div
            style={{
              fontSize: 24
            }}
          >
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700
            }}
          >
            {stats.avgRating} ★
          </div>

          <div
            style={{
              color: T.tx2,
              fontSize: 12
            }}
          >
            Average Rating
          </div>

        </Card>


        <Card>

          <div
            style={{
              fontSize: 24
            }}
          >
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700
            }}
          >
            {stats.bestWorker}
          </div>

          <div
            style={{
              color: T.tx2,
              fontSize: 12
            }}
          >
            Best Worker
          </div>

        </Card>


        <Card>

          <div
            style={{
              fontSize: 24
            }}
          >
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700
            }}
          >
            {stats.totalAssigned}
          </div>

          <div
            style={{
              color: T.tx2,
              fontSize: 12
            }}
          >
            Assigned Complaints
          </div>

        </Card>

      </div>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div
        style={{
          marginBottom: 14
        }}
      >

        <input

          value={search}

          onChange={e =>
            setSearch(e.target.value)
          }

          placeholder="🔍 Search workers..."

          style={{
            background: T.bg3,
            border:
              `1px solid ${T.brd}`,
            borderRadius: 9,
            padding:
              '8px 12px',
            color: T.tx,
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            width: '100%',
            maxWidth: 300
          }}

        />

      </div>


      {/* =====================================================
          WORKER TABLE
      ====================================================== */}

      <Card
        style={{
          padding: 0
        }}
      >

        {loading ? (

          <Spinner />

        ) : (

          <Table

            columns={columns}

            data={filtered}

            onRowClick={row =>
              setSelectedWorker(row)
            }

            emptyIcon="👥"

            emptyTitle="No workers found"

          />

        )}

      </Card>


      {/* =====================================================
          CREATE / EDIT WORKER MODAL
      ====================================================== */}

      <Modal

        open={modal}

        onClose={() =>
          setModal(false)
        }

        title={
          editUser
            ? 'Edit Worker'
            : 'Create Worker'
        }

      >

        <Input
          label="Full Name *"

          value={form.name}

          onChange={e =>
            setForm(f => ({
              ...f,
              name: e.target.value
            }))
          }

        />


        <Input
          label="Email *"

          type="email"

          value={form.email}

          onChange={e =>
            setForm(f => ({
              ...f,
              email: e.target.value
            }))
          }

        />


        <Input
          label="Phone"

          value={form.phone}

          onChange={e =>
            setForm(f => ({
              ...f,
              phone: e.target.value
            }))
          }

        />


        <Input

          label={
            editUser
              ? 'New Password (leave blank to keep)'
              : 'Password *'
          }

          type="password"

          value={form.password}

          onChange={e =>
            setForm(f => ({
              ...f,
              password: e.target.value
            }))
          }

        />


        {/* IMPORTANT INFORMATION */}

        {!editUser && (

          <div
            style={{
              background: T.bg3,
              border:
                `1px solid ${T.brd}`,
              borderRadius: 8,
              padding: 10,
              marginBottom: 14,
              fontSize: 12,
              color: T.tx2
            }}
          >
            This account will be created with
            the <strong>Worker</strong> role.
          </div>

        )}


        {/* BUTTONS */}

        <div
          style={{
            display: 'flex',
            gap: 10
          }}
        >

          <Button
            variant="outline"
            onClick={() =>
              setModal(false)
            }
          >
            Cancel
          </Button>


          <Button

            loading={saving}

            onClick={handleSave}

            style={{
              flex: 1,
              justifyContent: 'center'
            }}

          >
            {editUser
              ? 'Save Changes'
              : 'Create Worker'}
          </Button>

        </div>

      </Modal>


      {/* =====================================================
          WORKER DETAILS MODAL
      ====================================================== */}

      <Modal

        open={!!selectedWorker}

        onClose={() =>
          setSelectedWorker(null)
        }

        title="Worker Details"

      >

        {selectedWorker && (

          <div>

            <h3>
              {selectedWorker.name}
            </h3>


            <p>
              <strong>Email:</strong>{' '}
              {selectedWorker.email}
            </p>


            <p>
              <strong>Phone:</strong>{' '}
              {selectedWorker.phone || 'N/A'}
            </p>


            <p>
              <strong>Department:</strong>{' '}
              {selectedWorker.department_name ||
                'N/A'}
            </p>


            <hr />


            <p>
              <strong>Assigned:</strong>{' '}
              {selectedWorker.assigned_count || 0}
            </p>


            <p>
              <strong>Resolved:</strong>{' '}
              {selectedWorker.resolved_count || 0}
            </p>


            <p>
              <strong>In Progress:</strong>{' '}
              {selectedWorker.in_progress_count || 0}
            </p>


            <p>
              <strong>Average Rating:</strong>{' '}
              ⭐ {selectedWorker.avg_rating || 0}
            </p>


            <p>
              <strong>Status:</strong>{' '}

              {selectedWorker.is_active
                ? 'Active'
                : 'Inactive'}

            </p>

          </div>

        )}

      </Modal>

    </Layout>

  )
}