import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import NotFoundPage   from './pages/NotFoundPage'
import Profile from "./pages/Profile";
// User pages
import UserDashboard  from './pages/user/Dashboard'
import SubmitComplaint from './pages/user/SubmitComplaint'
import MyComplaints   from './pages/user/MyComplaints'
import ComplaintDetail from './pages/user/ComplaintDetail'

// Department pages
import DeptDashboard  from './pages/department/Dashboard'
import DeptComplaints from './pages/department/Complaints'
import DeptComplaintDetail from './pages/department/ComplaintDetail'
import DeptAnalytics  from './pages/department/Analytics'
import Workers from './pages/department/Workers'
import MapPage from './pages/department/MapPage'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers     from './pages/admin/Users'
import AdminDepartments from './pages/admin/Departments'
import AdminComplaints  from './pages/admin/Complaints'
import AdminAnalytics   from './pages/admin/Analytics'
import WorkerPerformance from './pages/worker/Performance'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#94a3b8' }}>Loading…</div>
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleHome() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'admin')
    return <Navigate to="/admin" replace />

  if (user.role === 'department_admin')
    return <Navigate to="/department" replace />

  if (user.role === 'worker')
    return <Navigate to="/department" replace />

  return <Navigate to="/user" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/"         element={<RoleHome />} />
        <Route
            path="/profile"
            element={
                <PrivateRoute>
                    <Profile/>
                </PrivateRoute>
            }
        />

        {/* Citizen */}
        <Route path="/user" element={<PrivateRoute roles={['citizen']}><UserDashboard /></PrivateRoute>} />
        <Route path="/user/submit"              element={<PrivateRoute roles={['citizen']}><SubmitComplaint /></PrivateRoute>} />
        <Route path="/user/complaints"          element={<PrivateRoute roles={['citizen']}><MyComplaints /></PrivateRoute>} />
        <Route path="/user/complaints/:id"      element={<PrivateRoute roles={['citizen']}><ComplaintDetail /></PrivateRoute>} />

        {/* Department */}
        <Route path="/department"               element={<PrivateRoute roles={['department_admin', 'worker']}><DeptDashboard /></PrivateRoute>} />
        <Route path="/department/complaints"    element={<PrivateRoute roles={['department_admin', 'worker']}><DeptComplaints /></PrivateRoute>} />
        <Route path="/department/complaints/:id" element={<PrivateRoute roles={['department_admin', 'worker']}><DeptComplaintDetail /></PrivateRoute>} />
        <Route path="/department/analytics"     element={<PrivateRoute roles={['department_admin']}><DeptAnalytics /></PrivateRoute>} />
        <Route
          path="/department/workers"
          element={
            <PrivateRoute roles={['department_admin']}>
              <Workers />
            </PrivateRoute>
          }
        />
        <Route
          path="/worker/performance"
          element={
            <PrivateRoute roles={['worker']}>
              <WorkerPerformance />
            </PrivateRoute>
          }
        />
        <Route
          path="/department/map"
          element={
            <PrivateRoute roles={['department_admin']}>
              <MapPage />
            </PrivateRoute>
          }
        />

        {/* Admin */}
        <Route path="/admin"                    element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users"              element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/departments"        element={<PrivateRoute roles={['admin']}><AdminDepartments /></PrivateRoute>} />
        <Route path="/admin/complaints"         element={<PrivateRoute roles={['admin']}><AdminComplaints /></PrivateRoute>} />
        <Route path="/admin/analytics"          element={<PrivateRoute roles={['admin']}><AdminAnalytics /></PrivateRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
