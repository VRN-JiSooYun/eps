// NavBar - NavItem
// Description: NavBar의 각 항목을 나타내는 컴포넌트입니다. 아이콘과 텍스트를 포함하며, 클릭 시 해당 페이지로 이동합니다.

import React from "react";
import { NavLink } from "react-router-dom";

interface NavItemProps {
  to: string; // 이동할 경로
  icon: React.ReactNode; // 아이콘 컴포넌트
  label: string; // 항목 텍스트
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          isActive ? "bg-voronoi-orange text-white" : "text-voronoi-gray-800 hover:bg-voronoi-gray-200"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default NavItem;