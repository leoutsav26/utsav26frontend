import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import Contact from "./pages/Contact.jsx";
import Home from "./pages/home.jsx";
import Events from "./pages/Events.jsx";
import Login from "./pages/Login.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import CoordinatorDashboard from "./pages/CoordinatorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import FreeFlowParticles from "./pages/ParticleBackground.jsx";
import { AppDataProvider } from "./context/AppData";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DataHydrator from "./components/DataHydrator";

import "./App.css";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

const App = () => {
  useEffect(() => {
    document.title = "Leo Club Of CEG";
  }, []);

  return (
    <AppDataProvider>
      <AuthProvider>
        <DataHydrator />
        <Router>
          <div className="app-wrapper">
            <div className="global-particle-bg" aria-hidden>
              <FreeFlowParticles />
            </div>
            <Navbar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<><Home /></>} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
                <Route path="/coordinator/*" element={<ProtectedRoute role="coordinator"><CoordinatorDashboard /></ProtectedRoute>} />
                <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </AppDataProvider>
  );
};

export default App;
