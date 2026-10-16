import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ allowedRole }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // No session
  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(userData);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Check JWT expiry
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    if (
      payload.exp &&
      payload.exp * 1000 < Date.now()
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Role protection
  if (
    allowedRole &&
    user.role !== allowedRole
  ) {
    if (user.role === "patient") {
      return (
        <Navigate
          to="/patient/dashboard"
          replace
        />
      );
    }

    if (user.role === "doctor") {
      return (
        <Navigate
          to="/doctor/dashboard"
          replace
        />
      );
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;