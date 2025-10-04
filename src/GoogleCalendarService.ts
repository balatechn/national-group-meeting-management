/// <reference types="gapi" />
/// <reference types="gapi.client.calendar-v3" />

// Google Calendar API Integration Service
// This service handles all Google Calendar operations

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
}

interface CalendarConfig {
  calendarId: string;
  apiKey: string;
  clientId: string;
  clientSecret?: string;
}

export class GoogleCalendarService {
  private config: CalendarConfig;
  private accessToken: string | null = null;

  constructor(config: CalendarConfig) {
    this.config = config;
  }

  // Initialize Google Calendar API
  async initialize(): Promise<void> {
    try {
      // Load Google APIs
      await this.loadGoogleAPI();
      await this.authenticateUser();
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
      throw error;
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('client:auth2', resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private async authenticateUser(): Promise<void> {
    await gapi.client.init({
      apiKey: this.config.apiKey,
      clientId: this.config.clientId,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      scope: 'https://www.googleapis.com/auth/calendar'
    });

    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
  }

  // Fetch events for room calendars
  async fetchRoomEvents(roomCalendarIds: string[], startDate: Date, endDate: Date): Promise<GoogleCalendarEvent[]> {
    const allEvents: GoogleCalendarEvent[] = [];

    for (const calendarId of roomCalendarIds) {
      try {
        const response = await (gapi.client as any).calendar.events.list({
          calendarId: calendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });

        const events = response.result.items || [];
        allEvents.push(...events.map((event: any) => ({
          id: event.id!,
          summary: event.summary || 'Untitled Meeting',
          description: event.description,
          start: {
            dateTime: event.start?.dateTime || event.start?.date || '',
            timeZone: event.start?.timeZone || 'UTC'
          },
          end: {
            dateTime: event.end?.dateTime || event.end?.date || '',
            timeZone: event.end?.timeZone || 'UTC'
          },
          attendees: event.attendees?.map((attendee: any) => ({
            email: attendee.email || '',
            displayName: attendee.displayName
          })),
          location: event.location
        })));
      } catch (error) {
        console.error(`Failed to fetch events for calendar ${calendarId}:`, error);
      }
    }

    return allEvents;
  }

  // Create new meeting in Google Calendar
  async createMeeting(calendarId: string, meetingData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
    location?: string;
  }): Promise<GoogleCalendarEvent> {
    const event = {
      summary: meetingData.title,
      description: meetingData.description,
      start: {
        dateTime: meetingData.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: meetingData.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: meetingData.attendees?.map(email => ({ email })),
      location: meetingData.location
    };

    const response = await (gapi.client as any).calendar.events.insert({
      calendarId: calendarId,
      resource: event
    });

    return response.result as GoogleCalendarEvent;
  }

  // Update existing meeting
  async updateMeeting(calendarId: string, eventId: string, meetingData: Partial<{
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees: string[];
    location: string;
  }>): Promise<GoogleCalendarEvent> {
    const event: any = {};

    if (meetingData.title) event.summary = meetingData.title;
    if (meetingData.description) event.description = meetingData.description;
    if (meetingData.startTime) {
      event.start = {
        dateTime: meetingData.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
    if (meetingData.endTime) {
      event.end = {
        dateTime: meetingData.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
    if (meetingData.attendees) {
      event.attendees = meetingData.attendees.map(email => ({ email }));
    }
    if (meetingData.location) event.location = meetingData.location;

    const response = await (gapi.client as any).calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      resource: event
    });

    return response.result as GoogleCalendarEvent;
  }

  // Delete meeting
  async deleteMeeting(calendarId: string, eventId: string): Promise<void> {
    await (gapi.client as any).calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
  }

  // Check room availability
  async checkRoomAvailability(calendarId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const response = await (gapi.client as any).calendar.freebusy.query({
      resource: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: calendarId }]
      }
    });

    const busyTimes = response.result.calendars?.[calendarId]?.busy || [];
    return busyTimes.length === 0;
  }

  // Convert Google Calendar event to Meeting type
  convertToMeeting(event: GoogleCalendarEvent, room: "Room A" | "Room B"): Meeting {
    return {
      id: event.id,
      room: room,
      title: event.summary,
      organizer: event.attendees?.[0]?.displayName || event.attendees?.[0]?.email || 'Unknown',
      start: event.start.dateTime,
      end: event.end.dateTime
    };
  }
}

// Meeting type (matches your existing interface)
type Meeting = {
  id: string;
  room: "Room A" | "Room B";
  title: string;
  organizer: string;
  start: string; // ISO
  end: string;   // ISO
};

// Calendar configuration for room resources
export const ROOM_CALENDARS = {
  "Room A": "room-a@your-domain.com", // Replace with actual calendar IDs
  "Room B": "room-b@your-domain.com"
};

// Export singleton instance
export const calendarService = new GoogleCalendarService({
  calendarId: 'primary',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
});