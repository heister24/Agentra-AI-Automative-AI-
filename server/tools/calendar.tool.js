import { google } from "googleapis";
import Integration from "../models/integration.model.js";
import { tool } from "@langchain/core/tools";
import z from "zod/v3";

// Helper function that will fetch users detail from databse and help to talk with calender
async function getOAuthCalendarClient(userId) {
  try {
    if (!userId) {
      return null;
    }
    const integration = await Integration.findOne({
      userId: userId,
      provider: "gmail",
      isConnected: true,
    });

    if (!integration || !integration.tokens.refreshToken) {
      return null;
    }

    //Google OAuth Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:8000/api/integration/google/callback",
    );

    // setting credentials
    oauth2Client.setCredentials({
      access_token: integration.tokens.accessToken,
      refresh_token: integration.tokens.refreshToken,
    });

    // Initializing google calender api
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // returning calender object and its email
    return { calendar, accountEmail: integration.accountEmail };
  } catch (error) {
    console.error("Error creating Calendar client:", error.message);
    return null;
  }
}

// List the Upcoming Events
async function listEvents(calendar, limit = 5, query) {
  try {
    // get current time so we can find future events not past events
    const now = new Date().toISOString();

    //fetching google events by calendar api
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now,
      maxResults: limit,
      singleEvents: true,
      orderBy: "startTime",
      q: query || undefined,
    });

    const events = res.data.items;
    if (!events || events.length === 0) {
      return "You have no upcoming events or meetings scheduled.";
    }

    // Cleaning and making response readable
    const formattedList = events.map((event, idx) => {
      // finding start date/time
      const start = event.start.dateTime || event.start.date;
      const formattedDate = new Date(start).toLocaleString();

      // If there is any meeting link then extract that also
      const meetLink = event.hangoutLink
        ? `\n Google Meet : ${event.hangoutLink}`
        : "";
      return `[${idx + 1}] "${event.summary || "No Title"}"\n    Date/Time: ${formattedDate}${meetLink}`;
    });

    // returning final response for AI Agent
    return `Found ${events.length} upcoming event(s):\n\n${formattedList.join("\n\n")}`;
  } catch (error) {}
}

// Normalizes any datetime string (whether converted to UTC Z or with timezone offset)
// into the exact local date-time string ("YYYY-MM-DDTHH:mm:ss") intended by the user in their timezone.
function normalizeToLocalISO(dateTimeStr, userTimeZone = "Asia/Kolkata") {
  if (!dateTimeStr) return dateTimeStr;
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: userTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";
    return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
  } catch (e) {
    return dateTimeStr.replace("Z", "");
  }
}

// Create/Schedule a new event
async function createEvent(
  calendar,
  { summary, description, startDateTime, endDateTime, attendees, timeZone },
) {
  // Get primary calendar timezone
  let calTz = timeZone;
  try {
    const cal = await calendar.calendars.get({ calendarId: "primary" });
    if (cal.data?.timeZone) {
      calTz = cal.data.timeZone;
    }
  } catch (e) {
    calTz = calTz || "UTC";
  }

  // Normalize start and end times to the literal requested hour
  const normalizedStart = normalizeToLocalISO(
    startDateTime,
    timeZone || "Asia/Kolkata",
  );
  const normalizedEnd = normalizeToLocalISO(
    endDateTime,
    timeZone || "Asia/Kolkata",
  );

  // Event Payload
  const eventPayload = {
    summary: summary || "New Meeting",
    description: description || "Scheduled via Agentra-AI",
    start: {
      dateTime: normalizedStart,
      timeZone: calTz,
    },
    end: {
      dateTime: normalizedEnd,
      timeZone: calTz,
    },
    // Magic Feature: Google Meet Video Call Link Automatically Generate Karna
    conferenceData: {
      createRequest: {
        requestId: `meet_${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  if (attendees) {
    eventPayload.attendees = attendees.split(",").map((email) => ({
      email: email.trim(),
    }));
  }

  // Insert into Google Calendar Api
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: eventPayload,
    conferenceDataVersion: 1,
  });

  //   Generated Meet Link
  const meetLink = res.data.hangoutLink
    ? `\nGoogle Meet Link: ${res.data.hangoutLink}`
    : "";

  return `[SUCCESS] Event "${res.data.summary}" has been scheduled successfully!
Start: ${normalizedStart.replace("T", " ")}
End: ${normalizedEnd.replace("T", " ")}${meetLink}
Event ID: ${res.data.id}`;
}

// Delete Event
async function deleteEvent(calendar, { eventId, query }) {
  let targetId = eventId;
  let targetTitle = query || "Meeting";

  if (!targetId && query) {
    const search = await calendar.events.list({
      calendarId: "primary",
      q: query,
      maxResults: 1,
    });
    if (search.data.items?.length > 0) {
      targetId = search.data.items[0].id;
      targetTitle = search.data.items[0].summary;
    }
  }

  if (!targetId) {
    return `Could not find any event matching "${query}" in your calendar to delete.`;
  }

  await calendar.events.delete({
    calendarId: "primary",
    eventId: targetId,
  });

  return `[SUCCESS] Event "${targetTitle}" has been cancelled and removed from your Google Calendar!`;
}

// Calendar Tool
export const calendarTool = tool(
  async (
    {
      action,
      summary,
      description,
      startDateTime,
      endDateTime,
      attendees,
      limit = 5,
      eventId,
      query,
      timeZone,
    },
    config,
  ) => {
    try {
      console.log(`[CalendarTool] Executing Action: "${action}"`);
      const userId = config?.configurable?.userId;
      const oauthClient = await getOAuthCalendarClient(userId);

      if (!oauthClient) {
        return "No Google account connected. Please visit the Integrations page (/integration) and click 'Connect with Google' to manage your calendar.";
      }

      if (action === "list_events") {
        return await listEvents(oauthClient.calendar, limit, query);
      }

      if (action === "create_event") {
        if (!summary || !startDateTime || !endDateTime) {
          return "Cannot create event: 'summary', 'startDateTime', and 'endDateTime' are all required.";
        }
        return await createEvent(oauthClient.calendar, {
          summary,
          description,
          startDateTime,
          endDateTime,
          attendees,
          timeZone,
        });
      }

      if (action === "delete_event") {
        return await deleteEvent(oauthClient.calendar, { eventId, query });
      }
      return `Unsupported action "${action}". Supported actions are: 'list_events', 'create_event', 'delete_event'.`;
    } catch (error) {
      console.error("❌ CalendarTool Error:", error.message);
      return `Failed to execute calendar action "${action}". Error: ${error.message}`;
    }
  },
  {
    name: "calendar",
    description:
      "Manage Google Calendar: check upcoming schedule, book/schedule new meetings with Google Meet link, or cancel/delete events.",
    // Zod Schema: AI ko batata hai ki kaun-kaun se inputs valid hain
    schema: z.object({
      action: z
        .enum(["list_events", "create_event", "delete_event"])
        .describe(
          "Action: 'list_events' to see schedule, 'create_event' to book, 'delete_event' to cancel.",
        ),
      summary: z
        .string()
        .optional()
        .describe("Title/summary of the meeting for create_event."),
      description: z
        .string()
        .optional()
        .describe("Description or agenda of the meeting."),
      startDateTime: z
        .string()
        .optional()
        .describe(
          "Start time in ISO format with explicit timezone offset (e.g. '2026-11-24T06:00:00+05:30' for 6:00 AM IST). Always preserve the user's requested local time and offset.",
        ),
      endDateTime: z
        .string()
        .optional()
        .describe(
          "End time in ISO format with explicit timezone offset (e.g. '2026-11-24T10:00:00+05:30' for 10:00 AM IST). Always preserve the user's requested local time and offset.",
        ),
      timeZone: z
        .string()
        .optional()
        .describe("Timezone (e.g. 'Asia/Kolkata'). Defaults to user's timezone."),
      attendees: z
        .string()
        .optional()
        .describe(
          "Comma-separated attendee emails (e.g. 'alex@gmail.com, john@gmail.com').",
        ),
      limit: z
        .number()
        .optional()
        .describe("Max events to list for list_events (defaults to 5)."),
      eventId: z
        .string()
        .optional()
        .describe("Event ID to delete for delete_event."),
      query: z
        .string()
        .optional()
        .describe(
          "Search query to filter meetings or find an event to delete.",
        ),
    }),
  },
);
