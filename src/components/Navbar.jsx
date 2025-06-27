import { FaChartBar, FaBell, FaCode, FaRobot } from "react-icons/fa";

const Navbar = ({ active, onTabChange }) => {
  const navItems = [
    { id: "ai-assist", label: "AI Assist", icon: <FaRobot size={14} /> },
    { id: "analytics", label: "Analytics", icon: <FaChartBar size={14} /> },
    { id: "reminders", label: "Reminders", icon: <FaBell size={14} /> },
    { id: "snippets", label: "Snippets", icon: <FaCode size={14} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#1a1b25]/80 backdrop-blur-md border-b border-gray-700 rounded-b-lg shadow-md px-6 py-3 flex justify-center gap-4">
      {navItems.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-md transition-all duration-200
            ${
              active === id
                ? "bg-cyan-600 text-white shadow-md scale-105"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          aria-selected={active === id}
        >
          {icon}
          {label}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
