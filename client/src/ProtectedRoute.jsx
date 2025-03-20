import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const ProtectedRoute = ({ children }) => {
  const authToken = localStorage.getItem("authToken");
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!authToken && !hasShownToast.current) {
      toast.error("Login First", { duration: 3000 });
      hasShownToast.current = true;
    }
  }, [authToken]);

  if (!authToken) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {/* Consider placing <Toaster /> once in your app's root (e.g., App.js) */}
      <Toaster position="top-right" />
      {children}
    </>
  );
};

export default ProtectedRoute;
