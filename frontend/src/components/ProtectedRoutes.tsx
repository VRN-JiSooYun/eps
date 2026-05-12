// 로그인 하지 않은 사용자가 접근할 수 없는 라우트를 보호하는 컴포넌트
import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }

  // 로그인한 사용자는 요청한 페이지를 렌더링
  return <>{children}</>;
};

export default ProtectedRoute;