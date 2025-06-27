import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip);

const ratingColors = {
  newbie: "#808080", // Gray
  pupil: "#008000", // Green
  specialist: "#03a89e", // Cyan
  expert: "#0000ff", // Blue
  candidate_master: "#aa00aa", // Violet
  master: "#ff8c00", // Orange
  international_master: "#ff8c00",
  grandmaster: "#ff0000", // Red
  international_grandmaster: "#ff0000",
  legendary_grandmaster: "#ff0000",
};

const getColorByRating = (rating) => {
  if (rating < 1200) return ratingColors.newbie;
  if (rating < 1400) return ratingColors.pupil;
  if (rating < 1600) return ratingColors.specialist;
  if (rating < 1900) return ratingColors.expert;
  if (rating < 2100) return ratingColors.candidate_master;
  if (rating < 2300) return ratingColors.master;
  if (rating < 2400) return ratingColors.international_master;
  if (rating < 2600) return ratingColors.grandmaster;
  if (rating < 3000) return ratingColors.international_grandmaster;
  return ratingColors.legendary_grandmaster;
};

const Analytics = () => {
  const [handle, setHandle] = useState("");
  const [inputHandle, setInputHandle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [problemRatings, setProblemRatings] = useState({});
  const [problemTags, setProblemTags] = useState({});
  const [timeline, setTimeline] = useState("all");
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef();

  useEffect(() => {
    chrome.storage.local.get(["cfHandle"], (res) => {
      if (res.cfHandle) {
        setHandle(res.cfHandle);
        fetchUserData(res.cfHandle);
      } else {
        setIsEditing(true);
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      event.preventDefault();
    });
  }, []);

  useEffect(() => {
    if (!handle) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchUserData(handle);
    }, 300);
  }, [timeline]);

  const fetchUserData = async (username) => {
    try {
      setLoading(true);

      const res = await fetch(
        `https://codeforces.com/api/user.info?handles=${username}`
      );
      const data = await res.json();
      if (data.status !== "OK") {
        toast.error("Invalid handle.");
        return;
      }

      setUserInfo(data.result[0]);

      const subsRes = await fetch(
        `https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`
      );
      const subsData = await subsRes.json();
      if (subsData.status !== "OK") return;

      const now = Date.now();
      let timeLimit = 0;
      switch (timeline) {
        case "1y":
          timeLimit = now - 365 * 24 * 60 * 60 * 1000;
          break;
        case "30d":
          timeLimit = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case "7d":
          timeLimit = now - 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          timeLimit = 0;
      }

      const ratingMap = {};
      const tagMap = {};

      for (let sub of subsData.result) {
        if (sub.verdict !== "OK" || !sub.problem.rating) continue;
        if (timeline !== "all" && sub.creationTimeSeconds * 1000 < timeLimit)
          continue;

        const rating = sub.problem.rating;
        ratingMap[rating] = (ratingMap[rating] || 0) + 1;

        for (let tag of sub.problem.tags || []) {
          tagMap[tag] = (tagMap[tag] || 0) + 1;
        }
      }

      setProblemRatings(ratingMap);
      setProblemTags(tagMap);
    } catch (e) {
      toast.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const saveHandle = async () => {
    const trimmed = inputHandle.trim();
    if (!trimmed) return toast.error("Handle cannot be empty.");

    try {
      const res = await fetch(
        `https://codeforces.com/api/user.info?handles=${trimmed}`
      );
      const data = await res.json();

      if (data.status !== "OK")
        return toast.error("Invalid Codeforces handle!");

      chrome.storage.local.set({ cfHandle: trimmed });
      setHandle(trimmed);
      setIsEditing(false);
      toast.success("Handle saved!");
      fetchUserData(trimmed);
    } catch (e) {
      toast.error("Error validating handle");
    }
  };

  const barData = {
    labels: Object.keys(problemRatings).sort((a, b) => a - b),
    datasets: [
      {
        label: "Solved",
        backgroundColor: "#06b6d4",
        data: Object.keys(problemRatings)
          .sort((a, b) => a - b)
          .map((key) => problemRatings[key]),
        borderRadius: 4,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(problemTags),
    datasets: [
      {
        data: Object.values(problemTags),
        backgroundColor: [
          "#06b6d4",
          "#22c55e",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#14b8a6",
          "#0ea5e9",
          "#e11d48",
          "#10b981",
        ],
      },
    ],
  };

  return (
    <div className="p-6 text-gray-200 min-h-screen">
      {/* Title */}
      <div className="flex items-center gap-3 mb-4">
        <img src="/code-forces.svg" alt="cf-logo" className="w-10 h-10" />
        <h1 className="text-3xl font-bold text-white">Codeforces Analytics</h1>
      </div>

      {/* Handle Input */}
      <div className="mb-6">
        {!isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm">{handle}</span>
            <button
              onClick={() => {
                setIsEditing(true);
                setInputHandle(handle);
              }}
              className="text-cyan-500 hover:underline text-sm"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value)}
              className="px-2 py-1 bg-[#1f1f2d] border border-gray-700 rounded text-sm"
              placeholder="Enter Codeforces handle"
            />
            <button
              onClick={saveHandle}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* User Rating */}
      {userInfo && (
        <div className="mb-6 text-sm">
          <div className="flex gap-6">
            <p>
              <span className="text-gray-400">Current Rating:</span>{" "}
              <span style={{ color: getColorByRating(userInfo.rating || 0) }}>
                {userInfo.rating || "N/A"}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Max Rating:</span>{" "}
              <span
                style={{ color: getColorByRating(userInfo.maxRating || 0) }}
              >
                {userInfo.maxRating || "N/A"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Timeline Switch */}
      <div className="flex gap-4 mb-6">
        {["all", "1y", "30d", "7d"].map((t) => (
          <button
            key={t}
            onClick={() => setTimeline(t)}
            className={`px-4 py-1 rounded-full text-sm transition ${
              timeline === t
                ? "bg-cyan-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Charts */}
      {loading ? (
        <p className="text-cyan-300">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg mb-2 font-semibold text-cyan-400">
              By Rating
            </h2>
            <Bar data={barData} />
          </div>
          <div>
            <h2 className="text-lg mb-2 font-semibold text-cyan-400">
              By Topic
            </h2>
            <Pie data={pieData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
