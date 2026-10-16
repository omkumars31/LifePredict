import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import "./PatientHeaderMenu.css";

function PatientHeaderMenu() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const initial =
    user?.fullName?.trim()?.charAt(0)?.toUpperCase() || "H";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleProfile = () => {
    setOpen(false);
    navigate("/patient/profile");
  };

  const handleLogout = () => {
    setOpen(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <div className="lp-header-profile-menu" ref={menuRef}>
      <button
        type="button"
        className={`lp-header-avatar-button ${open ? "open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <span className="lp-header-avatar">{initial}</span>
        <ChevronDown
          className={`lp-header-avatar-chevron ${open ? "rotated" : ""}`}
          size={14}
        />
      </button>

      {open && (
        <div className="lp-header-account-menu" role="menu">
          <div className="lp-header-account-summary">
            <span className="lp-header-account-avatar">{initial}</span>

            <div>
              <strong>{user?.fullName || "Patient"}</strong>
              <span>{user?.role === "patient" ? "Patient" : "Account"}</span>
            </div>
          </div>

          <div className="lp-header-menu-divider" />

          <button
            type="button"
            className="lp-header-menu-item"
            role="menuitem"
            onClick={handleProfile}
          >
            <span className="lp-header-menu-icon">
              <UserRound size={16} />
            </span>

            <span>Profile</span>
          </button>

          <button
            type="button"
            className="lp-header-menu-item logout"
            role="menuitem"
            onClick={handleLogout}
          >
            <span className="lp-header-menu-icon">
              <LogOut size={16} />
            </span>

            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default PatientHeaderMenu;
