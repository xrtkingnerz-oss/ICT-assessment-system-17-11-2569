/* eslint-disable react-hooks/set-state-in-effect */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./lib/api";
import type { User } from "./types";
import AppShell from "./components/AppShell";
import SuccessToastHost from "./components/SuccessToastHost";
import Dashboard from "./pages/Dashboard";
import AssessmentList from "./pages/AssessmentListPage";
import AssessmentEditor from "./pages/AssessmentEditorPage";
import UsersPage from "./pages/UsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/LoginPage";
import PublicForm from "./pages/PublicAssessmentPage";
import Success from "./pages/SuccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/assessment/:token" element={<PublicForm />} />
        <Route path="/success" element={<Success />} />
        <Route path="*" element={<Guard />} />
      </Routes>
      <SuccessToastHost />
    </BrowserRouter>
  );
}

function Guard() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("ict-token")) {
      setReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then((response) => setUser(response.data.data))
      .catch(() => sessionStorage.removeItem("ict-token"))
      .finally(() => setReady(true));
  }, []);
  if (!ready)
    return (
      <div className="loading">
        <span className="spinner" />
        กำลังเชื่อมต่อระบบ…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppShell
      user={user}
      onLogout={() => {
        sessionStorage.removeItem("ict-token");
        location.href = "/login";
      }}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assessments" element={<AssessmentList />} />
        <Route path="/assessments/new" element={<AssessmentEditor />} />
        <Route path="/assessments/:id" element={<AssessmentEditor />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/categories" element={<CategoriesPage user={user} />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
