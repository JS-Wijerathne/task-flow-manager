import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProjectsList } from './features/projects/ProjectsList';
import { ProjectDashboard } from './features/projects/ProjectDashboard';
import { TaskDetailPage } from './features/tasks/TaskDetailPage';
import { MembersListPage } from './features/users/pages/MembersListPage';

import { ToastContainer } from './shared/components/ToastContainer';

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/projects" replace />} />
                        <Route path="projects" element={<ProjectsList />} />
                        <Route path="projects/:projectId" element={<ProjectDashboard />} />
                        <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
                        <Route path="members" element={<MembersListPage />} />
                    </Route>
                </Routes>
            </Router>
            <ToastContainer />
        </>
    );
}

export default App;
