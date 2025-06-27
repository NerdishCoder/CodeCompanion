import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const Reminders = () => {
  const [alarmOn, setAlarmOn] = useState(false);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch alarm state on mount
  useEffect(() => {
    chrome.storage.local.get(["cfAlarmEnabled"], (res) => {
      setAlarmOn(Boolean(res.cfAlarmEnabled));
    });
  }, []);

  // Fetch upcoming Codeforces contest
  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await fetch(
          "https://codeforces.com/api/contest.list?gym=false"
        );
        const data = await res.json();

        const upcoming = data.result
          .filter((c) => c.phase === "BEFORE")
          .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

        if (upcoming.length > 0) {
          setContest(upcoming[0]);
        }
      } catch (err) {
        console.error("Failed to fetch contest:", err);
        toast.error("Error fetching contest data.");
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, []);

  const toggleAlarm = () => {
    if (!contest) return;

    const contestTimeMs = contest.startTimeSeconds * 1000;
    const alarmTime = contestTimeMs - 5 * 60 * 1000;

    if (!alarmOn) {
      // Enable alarm
      chrome.alarms.clear("cf-contest-reminder");
      chrome.alarms.create("cf-contest-reminder", { when: alarmTime });
      chrome.storage.local.set({
        cfAlarmEnabled: true,
        currentCfContestId: contest.id,
        currentCfContestTime: contest.startTimeSeconds,
      });
      toast.success("Reminder set for 5 minutes before the contest!");
    } else {
      // Disable alarm
      chrome.alarms.clear("cf-contest-reminder");
      chrome.storage.local.set({ cfAlarmEnabled: false });
      chrome.storage.local.remove([
        "currentCfContestId",
        "currentCfContestTime",
      ]);
      toast("Reminder turned off.");
    }

    setAlarmOn(!alarmOn);
  };

  return (
    <div className="min-h-screen p-6 font-sans bg-gradient-to-br from-[#0f0f0f] via-[#1e1e2f] to-[#121212] text-gray-200">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-4 mb-4">
        <img src="/code-forces.svg" alt="CF" className="w-10 h-10" />
        <h1 className="text-3xl font-bold text-gray-100">
          Codeforces Reminders
        </h1>
      </div>

      {/* ---- Toggle ---- */}
      <div className="flex items-center justify-between border border-gray-700 rounded-lg p-4 mb-6 bg-[#1a1b25]/80 shadow-md">
        <span className="text-gray-300 text-lg">Get all Codeforces alerts</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={alarmOn}
            onChange={toggleAlarm}
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-cyan-600 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
      </div>

      {/* ---- Contest Info ---- */}
      <div className="max-w-2xl mx-auto bg-[#1a1b25]/90 border border-gray-700 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Upcoming Contest
        </h2>

        {loading ? (
          <p className="text-cyan-300">Loading...</p>
        ) : contest ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-cyan-200">{contest.name}</p>
            <p className="text-sm text-gray-400">
              Starts at:{" "}
              {new Date(contest.startTimeSeconds * 1000).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-cyan-400">No upcoming contests found.</p>
        )}
      </div>
    </div>
  );
};

export default Reminders;
