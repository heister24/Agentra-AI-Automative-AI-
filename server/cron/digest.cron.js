import cron from "node-cron";
import { runAllActiveMorningDigests } from "../services/digest.service.js";

export function initDigestCron() {
  // Runs every day at 09:00 AM IST
  cron.schedule(
    "0 9 * * *",
    async () => {
      await runAllActiveMorningDigests();
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  // Startup Catch-up: If server was offline at 09:00 AM IST, dispatch once DB is connected
  setTimeout(async () => {
    try {
      await runAllActiveMorningDigests({ isCatchUp: true });
    } catch (err) {
      // Silent catch
    }
  }, 4000);
}
