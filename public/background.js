const POLL_INTERVAL_HOURS = 6;

const fetchUpcomingContest = async () => {
  try {
    const res = await fetch(
      "https://codeforces.com/api/contest.list?gym=false"
    );
    const data = await res.json();
    if (data.status !== "OK") throw new Error("Invalid Codeforces response");
    const upcoming = data.result
      .filter((c) => c.phase === "BEFORE")
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    return upcoming[0] || null;
  } catch (err) {
    console.error("Error fetching contest:", err);
    return null;
  }
};

const scheduleAlarm = async () => {
  const res = await chrome.storage.local.get(["cfAlarmEnabled"]);
  if (!res.cfAlarmEnabled) return;

  const contest = await fetchUpcomingContest();
  if (!contest) return;

  const alarmTime = contest.startTimeSeconds * 1000 - 5 * 60 * 1000; // 5 min before
  const now = Date.now();

  if (alarmTime <= now) return; // Don't set alarm in past

  chrome.alarms.clear("cf-contest-reminder");
  chrome.alarms.create("cf-contest-reminder", { when: alarmTime });

  chrome.storage.local.set({
    currentCfContestId: contest.id,
    currentCfContestTime: contest.startTimeSeconds,
  });

  console.log("Alarm set for:", new Date(alarmTime).toLocaleString());
};

const pollAndSchedule = async () => {
  const res = await chrome.storage.local.get(["cfAlarmEnabled"]);
  if (!res.cfAlarmEnabled) return;

  await scheduleAlarm();
};

chrome.runtime.onInstalled.addListener(() => {
  pollAndSchedule();
  chrome.alarms.create("cf-poll-refresh", {
    periodInMinutes: POLL_INTERVAL_HOURS * 60,
    delayInMinutes: 1,
  });
});

chrome.runtime.onStartup.addListener(() => {
  pollAndSchedule();
  chrome.alarms.create("cf-poll-refresh", {
    periodInMinutes: POLL_INTERVAL_HOURS * 60,
    delayInMinutes: 1,
  });

  chrome.storage.local.get(
    ["cfAlarmEnabled", "currentCfContestId", "currentCfContestTime"],
    async (res) => {
      if (!res.cfAlarmEnabled || !res.currentCfContestTime) return;

      const now = Date.now();
      const startTime = res.currentCfContestTime * 1000;
      const alarmTime = startTime - 5 * 60 * 1000;

      if (alarmTime < now && now < startTime) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "Missed Contest Reminder",
          message:
            "You may have missed the earlier Codeforces contest reminder!",
          priority: 2,
        });
      }
    }
  );
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cf-contest-reminder") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Codeforces Contest Reminder",
      message: "A Codeforces contest is starting in 5 minutes!",
      priority: 2,
    });

    chrome.alarms.clear("cf-contest-reminder");
    chrome.storage.local.remove(["currentCfContestId", "currentCfContestTime"]);
  }

  if (alarm.name === "cf-poll-refresh") {
    pollAndSchedule();
  }
});
