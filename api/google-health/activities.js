import {
  authorizedClient,
  durationSeconds,
  json,
  openSession,
  readCookies,
  TOKEN_COOKIE,
} from "../../server/google-health.js";

const typeMap = {
  WALKING: "Walk",
  RUNNING: "Run",
  BIKING: "Cycle",
  HIKING: "Hike",
  BACKPACKING: "Hike",
  SWIMMING: "Swim",
  STRENGTH_TRAINING: "Gym",
  YOGA: "Yoga",
};

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default async function activities(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Method not allowed" });
  const session = openSession(readCookies(req)[TOKEN_COOKIE]);
  if (!session)
    return json(res, 401, { error: "Google Health belum terhubung." });

  try {
    const auth = await authorizedClient(session);
    if (!auth)
      return json(res, 503, { error: "Google Health belum dikonfigurasi." });
    const response = await auth.request({
      url: "https://health.googleapis.com/v4/users/me/dataTypes/exercise/dataPoints",
      params: { pageSize: 25 },
    });
    const dataPoints = response.data?.dataPoints || [];
    const importedAt = new Date().toISOString();
    const importedActivities = dataPoints.map((point, index) => {
      const exercise = point.exercise || {};
      const metrics = exercise.metricsSummary || {};
      const distanceKm = Number(metrics.distanceMillimeters || 0) / 1_000_000;
      const duration =
        durationSeconds(exercise.activeDuration) ||
        Math.max(
          0,
          (Date.parse(exercise.interval?.endTime) -
            Date.parse(exercise.interval?.startTime)) /
            1000,
        );
      const paceSeconds =
        Number(metrics.averagePaceSecondsPerMeter || 0) * 1000;
      const pace =
        paceSeconds > 0
          ? `${Math.floor(paceSeconds / 60)}:${String(Math.round(paceSeconds % 60)).padStart(2, "0")}`
          : distanceKm > 0 && duration > 0
            ? `${Math.floor(duration / distanceKm / 60)}:${String(Math.round((duration / distanceKm) % 60)).padStart(2, "0")}`
            : "—";
      const timestamp =
        exercise.interval?.startTime || exercise.createTime || importedAt;
      return {
        id: `google-health-${Buffer.from(point.name || `${timestamp}-${index}`).toString("base64url")}`,
        type: typeMap[exercise.exerciseType] || "Other",
        title:
          exercise.displayName ||
          exercise.exerciseType ||
          "Google Health exercise",
        date: new Date(timestamp).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        distance: `${distanceKm.toFixed(2)} km`,
        time: formatDuration(duration),
        pace: distanceKm > 0 ? `${pace}/km` : pace,
        source: "Google Health API",
        importedAt,
      };
    });
    return json(res, 200, { activities: importedActivities });
  } catch (error) {
    console.error(
      "Google Health activity request failed",
      error?.code || "unknown error",
    );
    return json(res, 502, {
      error:
        "Gagal mengambil aktivitas dari Google Health. Periksa izin API dan coba lagi.",
    });
  }
}
