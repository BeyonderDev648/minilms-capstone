import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/RouteGuards';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BrowseCourses from './pages/BrowseCourses';
import CreateCourse from './pages/CreateCourse';
import TeacherCourseDetail from './pages/TeacherCourseDetail';
import UploadLesson from './pages/UploadLesson';
import StudentCourseDetail from './pages/StudentCourseDetail';
import AdminUsers from './pages/AdminUsers';

function HomeRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="shell">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* student-only */}
            <Route path="/carear" element={<RoleRoute role="student"><Carear></Carear></RoleRoute>} />
            <Route path="/courses" element={<RoleRoute role="student"><BrowseCourses /></RoleRoute>} />
            <Route path="/student/courses/:id" element={<RoleRoute role="student"><StudentCourseDetail /></RoleRoute>} />

            {/* teacher-only */}
            <Route path="/teacher/courses/new" element={<RoleRoute role="teacher"><CreateCourse /></RoleRoute>} />
            <Route path="/teacher/courses/:id" element={<RoleRoute role="teacher"><TeacherCourseDetail /></RoleRoute>} />
            <Route path="/teacher/courses/:id/lessons/new" element={<RoleRoute role="teacher"><UploadLesson /></RoleRoute>} />

            {/* admin-only */}
            <Route path="/admin/users" element={<RoleRoute role="admin"><AdminUsers /></RoleRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <footer className="app-footer"><p>Your journey into technology starts with a simple lesson.</p>&copy;MiniLMS — capstone project</footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
