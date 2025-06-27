import { useState } from "react";
import Navbar from "./components/Navbar";
import Analytics from "./components/Analytics";
import Snippets from "./components/Snippets";
import Reminders from "./components/Reminders";
import AI_Assist from "./components/AI_Assist";
import { Toaster } from "react-hot-toast";

export default function App() {
  const [activeTab, setActiveTab] = useState("analytics");

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return <Analytics />;
      case "snippets":
        return <Snippets />;
      case "reminders":
        return <Reminders />;
      case "ai-assist":
        return <AI_Assist />;
      default:
        return <AI_Assist />;
    }
  };

  return (
    <div className="w-[500px] h-[600px] p-4 bg-gradient-to-br from-[#0f0f0f] via-[#1e1e2f] to-[#121212] text-gray-200 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e1e2f",
            color: "#e0e0e0",
            border: "1px solid #333",
          },
        }}
      />

      <Navbar active={activeTab} onTabChange={setActiveTab} />

      <div className="flex-grow overflow-auto mt-4 custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
}
