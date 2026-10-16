
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  Bell,
  UserRound,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "./DoctorLayout.css";

function DoctorLayout() {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const doctorName = user?.fullName || "Doctor";
  const doctorInitial = doctorName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProfileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="doctor-layout">
      {/* SIDEBAR */}
      <aside className="doctor-sidebar">
        <div className="doctor-brand">
          <div className="doctor-brand-icon">
            <HeartPulse size={22} />
          </div>
          <div>
            <strong>LifePredict</strong>
            <span>CLINICAL WORKSPACE</span>
          </div>
        </div>

        <nav className="doctor-navigation">
          <div className="doctor-nav-section">
            <span className="doctor-nav-label">OVERVIEW</span>
            <NavLink
              to="/doctor/dashboard"
              className={({ isActive }) =>
                `doctor-nav-item ${isActive ? "active" : ""}`
              }
            >
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </NavLink>
          </div>

          <div className="doctor-nav-section">
            <span className="doctor-nav-label">PATIENT CARE</span>
            <NavLink
              to="/doctor/patients"
              className={({ isActive }) =>
                `doctor-nav-item ${isActive ? "active" : ""}`
              }
            >
              <UsersRound size={19} />
              <span>My Patients</span>
            </NavLink>

            <NavLink
              to="/doctor/consultations"
              className={({ isActive }) =>
                `doctor-nav-item ${isActive ? "active" : ""}`
              }
            >
              <CalendarDays size={19} />
              <span>Consultations</span>
            </NavLink>

            <NavLink
              to="/doctor/alerts"
              className={({ isActive }) =>
                `doctor-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Bell size={19} />
              <span>Alerts</span>
              <span className="doctor-alert-dot"></span>
            </NavLink>
          </div>

          <div className="doctor-nav-section">
            <span className="doctor-nav-label">ACCOUNT</span>
            <NavLink
              to="/doctor/profile"
              className={({ isActive }) =>
                `doctor-nav-item ${isActive ? "active" : ""}`
              }
            >
              <UserRound size={19} />
              <span>Profile</span>
            </NavLink>
          </div>
        </nav>

        {/* SIDEBAR USER AND LOGOUT */}
        <div className="doctor-sidebar-bottom">
          <div className="doctor-sidebar-user">
            <div className="doctor-avatar">{doctorInitial}</div>
            <div className="doctor-user-info">
              <strong>Dr. {doctorName}</strong>
              <span>Doctor</span>
            </div>
          </div>

          <button
            type="button"
            className="doctor-sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="doctor-main">
        <header className="doctor-topbar">
          <div className="doctor-topbar-title">CLINICAL WORKSPACE</div>

          {/* CLICKABLE DOCTOR PROFILE */}
          <div
            className="doctor-profile-menu-wrapper"
            ref={profileMenuRef}
          >
            <button
  type="button"
  className="doctor-topbar-profile"
  onClick={() => setProfileMenuOpen((previous) => !previous)}
  aria-expanded={profileMenuOpen}
  aria-haspopup="menu"
  aria-label="Open doctor profile menu"
>
  <div className="doctor-topbar-avatar">{doctorInitial}</div>
  {profileMenuOpen ? (
    <ChevronUp size={16} />
  ) : (
    <ChevronDown size={16} />
  )}
</button>

            {profileMenuOpen && (
              <div className="doctor-profile-dropdown" role="menu">
                <div className="doctor-dropdown-user">
  <div className="doctor-topbar-avatar">
    {doctorInitial}
  </div>
  <div>
    <strong>Dr. {doctorName}</strong>
    <span>Doctor</span>
  </div>
</div>

                <div className="doctor-dropdown-divider"></div>

                <button
                  type="button"
                  className="doctor-dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/doctor/profile");
                  }}
                >
                  <UserRound size={17} />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="doctor-dropdown-item doctor-dropdown-logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="doctor-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DoctorLayout;
