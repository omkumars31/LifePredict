import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  Activity,
  TrendingUp,
  History,
  Lightbulb,
  Utensils,
  Bell,
  UserRound,
  LogOut,
} from "lucide-react";
import "./PatientLayout.css";

// Patient header account dropdown
import PatientHeaderMenu from "../pages/Patient/PatientHeaderMenu";

function PatientLayout() {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <div className="patient-layout">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside className="patient-sidebar">

        {/* Logo */}
        <div className="patient-sidebar-logo">
          <div className="patient-logo-icon">
            <HeartPulse size={21} />
          </div>

          <span>LifePredict</span>
        </div>


        {/* Navigation */}
        <nav className="patient-navigation">

          {/* Overview */}
          <span className="patient-nav-label">
            OVERVIEW
          </span>

          <NavLink
            to="/patient/dashboard"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>


          {/* Health */}
          <span className="patient-nav-label">
            HEALTH
          </span>

          <NavLink
            to="/patient/health-data"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Activity size={18} />
            <span>Health Data</span>
          </NavLink>


          <NavLink
            to="/patient/predictions"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <TrendingUp size={18} />
            <span>Predictions</span>
          </NavLink>


          <NavLink
            to="/patient/prediction-history"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <History size={18} />
            <span>Prediction History</span>
          </NavLink>


          <NavLink
            to="/patient/what-if"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Lightbulb size={18} />
            <span>What-if Simulation</span>
          </NavLink>


          {/* Nutrition */}
          <NavLink
            to="/patient/nutrition"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Utensils size={18} />
            <span>Nutrition</span>
          </NavLink>


          {/* Account */}
          <span className="patient-nav-label">
            ACCOUNT
          </span>

          <NavLink
            to="/patient/alerts"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Bell size={18} />
            <span>Alerts & Insights</span>
          </NavLink>


          <NavLink
            to="/patient/profile"
            className={({ isActive }) =>
              `patient-nav-link ${isActive ? "active" : ""}`
            }
          >
            <UserRound size={18} />
            <span>Profile</span>
          </NavLink>

        </nav>


        {/* =====================================================
            SIDEBAR USER / LOGOUT
        ====================================================== */}
        <div className="patient-sidebar-bottom">

          <div className="patient-user">

            <div className="patient-user-avatar">
              {user?.fullName
                ? user.fullName.charAt(0).toUpperCase()
                : "P"}
            </div>

            <div className="patient-user-info">

              <strong>
                {user?.fullName || "Patient"}
              </strong>

              <span>
                Patient
              </span>

            </div>

          </div>


          <button
            type="button"
            className="patient-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN APPLICATION AREA
      ====================================================== */}
      <main className="patient-main">

        {/* ===================================================
            TOP HEADER
        ==================================================== */}
        <header className="patient-topbar">

          <div>
            <span className="patient-topbar-label">
              PERSONAL HEALTH SPACE
            </span>
          </div>


          {/* =================================================
              INTERACTIVE ACCOUNT MENU

              Old static H avatar has been removed.
              PatientHeaderMenu provides:
              - Profile
              - Logout
              - outside click close
              - Escape close
          ================================================== */}
          <PatientHeaderMenu />

        </header>


        {/* =====================================================
            PAGE CONTENT
        ====================================================== */}
        <div className="patient-page-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

export default PatientLayout;