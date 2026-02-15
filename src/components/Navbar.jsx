import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import logo from "../assets/leo logo blue.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const dashboardPath = user?.role === "student" ? "/student" : user?.role === "coordinator" ? "/coordinator" : user?.role === "admin" ? "/admin" : null;

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  return (
    <nav className="nav-container">
      <div className="nav-left">
        <img src={logo} alt="Leo Logo" className="logo" />
        <span className="brand-text">Leo Club of CEG</span>
      </div>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <NavLink to="/" onClick={closeMenu} end>Home</NavLink>
        <NavLink to="/events" onClick={closeMenu}>Events & Activities</NavLink>
        <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
        {user ? (
          <>
            {dashboardPath && (
              <NavLink to={dashboardPath} onClick={closeMenu}>Dashboard</NavLink>
            )}
            <button type="button" className="nav-logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
        )}
      </div>

      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  );
};

export default Navbar;
