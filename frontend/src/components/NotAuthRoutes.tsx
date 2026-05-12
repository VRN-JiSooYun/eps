// 이미 로그인한 사용자가 접근할 수 없는 라우트를 정의하는 컴포넌트입니다. 예를 들어, 로그인 페이지나 회원가입 페이지 등이 여기에 해당합니다.

import React from "react";
import { Navigate } from "react-router-dom";

interface NotAuthRoutesProps {
  children: React.ReactNode;
}

const NotAuthRoutes: React.FC<NotAuthRoutesProps> = ({ children }) => {
  const isAuthenticated = false; // 실제 인증 상태를 확인하는 로직으로 대체해야 합니다.

  if (isAuthenticated) {
    return <Navigate to="/" />; // 이미 로그인한 사용자는 홈 페이지로 리다이렉트
  }

  return <>{children}</>; // 로그인하지 않은 사용자에게만 자식 컴포넌트를 렌더링
};

export default NotAuthRoutes; 