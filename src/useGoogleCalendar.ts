// React Hook for Google Calendar Integration
import { useState, useEffect, useCallback } from 'react';

// Meeting type (matches your existing interface)
type Meeting = {
  id: string;
  room: "Room A" | "Room B";
  title: string;
  organizer: string;
  start: string; // ISO
  end: string;   // ISO
};

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  location?: string;
}

interface CalendarHookOptions {
  roomACalendarId: string;
  roomBCalendarId: string;
  refreshInterval?: number; // in milliseconds
  daysToFetch?: number;
}

export function useGoogleCalendar(options: CalendarHookOptions) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    roomACalendarId,
    roomBCalendarId,
    refreshInterval = 300000, // 5 minutes default
    daysToFetch = 7
  } = options;

  // Initialize Google Calendar API
  const initializeGoogleAPI = useCallback(async () => {
    try {
      // Load Google API script if not already loaded
      if (typeof window !== 'undefined' && !(window as any).gapi) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => {
            (window as any).gapi.load('client:auth2', () => resolve());
          };
          script.onerror = () => reject(new Error('Failed to load Google API'));
          document.head.appendChild(script);
        });
      }

      const gapi = (window as any).gapi;
      
      // Initialize the API client
      await gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });

      // Check authentication status
      const authInstance = gapi.auth2.getAuthInstance();
      setIsAuthenticated(authInstance.isSignedIn.get());

      // Listen for authentication changes
      authInstance.isSignedIn.listen(setIsAuthenticated);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Google Calendar API');
    }
  }, []);

  // Authenticate user
  const signIn = useCallback(async () => {
    try {
      const gapi = (window as any).gapi;
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }, []);

  // Sign out user
  const signOut = useCallback(async () => {
    try {
      const gapi = (window as any).gapi;
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  }, []);

  // Fetch meetings from Google Calendar
  const fetchMeetings = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const gapi = (window as any).gapi;
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + daysToFetch);

      const allMeetings: Meeting[] = [];

      // Fetch events for Room A
      const roomAResponse = await gapi.client.calendar.events.list({
        calendarId: roomACalendarId,
        timeMin: now.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const roomAEvents = roomAResponse.result.items || [];
      allMeetings.push(...roomAEvents.map((event: any) => convertToMeeting(event, 'Room A')));

      // Fetch events for Room B
      const roomBResponse = await gapi.client.calendar.events.list({
        calendarId: roomBCalendarId,
        timeMin: now.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const roomBEvents = roomBResponse.result.items || [];
      allMeetings.push(...roomBEvents.map((event: any) => convertToMeeting(event, 'Room B')));

      setMeetings(allMeetings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, roomACalendarId, roomBCalendarId, daysToFetch]);

  // Convert Google Calendar event to Meeting
  const convertToMeeting = (event: GoogleCalendarEvent, room: "Room A" | "Room B"): Meeting => {
    return {
      id: event.id,
      room,
      title: event.summary || 'Untitled Meeting',
      organizer: event.attendees?.[0]?.displayName || 
                event.attendees?.[0]?.email || 
                'Unknown Organizer',
      start: event.start.dateTime,
      end: event.end.dateTime
    };
  };

  // Create new meeting
  const createMeeting = useCallback(async (meetingData: {
    room: "Room A" | "Room B";
    title: string;
    organizer: string;
    start: string;
    end: string;
    description?: string;
    attendees?: string[];
  }) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    const gapi = (window as any).gapi;
    const calendarId = meetingData.room === 'Room A' ? roomACalendarId : roomBCalendarId;

    const event = {
      summary: meetingData.title,
      description: meetingData.description || `Meeting organized by ${meetingData.organizer}`,
      start: {
        dateTime: meetingData.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: meetingData.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: meetingData.attendees?.map(email => ({ email })),
      location: meetingData.room
    };

    const response = await gapi.client.calendar.events.insert({
      calendarId,
      resource: event
    });

    // Refresh meetings after creation
    await fetchMeetings();
    
    return response.result;
  }, [isAuthenticated, roomACalendarId, roomBCalendarId, fetchMeetings]);

  // Update existing meeting
  const updateMeeting = useCallback(async (meetingId: string, meetingData: {
    room: "Room A" | "Room B";
    title?: string;
    organizer?: string;
    start?: string;
    end?: string;
    description?: string;
  }) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    const gapi = (window as any).gapi;
    const calendarId = meetingData.room === 'Room A' ? roomACalendarId : roomBCalendarId;

    const event: any = {};
    if (meetingData.title) event.summary = meetingData.title;
    if (meetingData.description) event.description = meetingData.description;
    if (meetingData.start) {
      event.start = {
        dateTime: meetingData.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
    if (meetingData.end) {
      event.end = {
        dateTime: meetingData.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    const response = await gapi.client.calendar.events.update({
      calendarId,
      eventId: meetingId,
      resource: event
    });

    // Refresh meetings after update
    await fetchMeetings();
    
    return response.result;
  }, [isAuthenticated, roomACalendarId, roomBCalendarId, fetchMeetings]);

  // Delete meeting
  const deleteMeeting = useCallback(async (meetingId: string, room: "Room A" | "Room B") => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    const gapi = (window as any).gapi;
    const calendarId = room === 'Room A' ? roomACalendarId : roomBCalendarId;

    await gapi.client.calendar.events.delete({
      calendarId,
      eventId: meetingId
    });

    // Refresh meetings after deletion
    await fetchMeetings();
  }, [isAuthenticated, roomACalendarId, roomBCalendarId, fetchMeetings]);

  // Check room availability
  const checkAvailability = useCallback(async (room: "Room A" | "Room B", start: string, end: string) => {
    if (!isAuthenticated) return false;

    const gapi = (window as any).gapi;
    const calendarId = room === 'Room A' ? roomACalendarId : roomBCalendarId;

    const response = await gapi.client.calendar.freebusy.query({
      resource: {
        timeMin: start,
        timeMax: end,
        items: [{ id: calendarId }]
      }
    });

    const busyTimes = response.result.calendars?.[calendarId]?.busy || [];
    return busyTimes.length === 0;
  }, [isAuthenticated, roomACalendarId, roomBCalendarId]);

  // Initialize on mount
  useEffect(() => {
    initializeGoogleAPI();
  }, [initializeGoogleAPI]);

  // Fetch meetings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMeetings();
    }
  }, [isAuthenticated, fetchMeetings]);

  // Set up periodic refresh
  useEffect(() => {
    if (!isAuthenticated || !refreshInterval) return;

    const interval = setInterval(fetchMeetings, refreshInterval);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshInterval, fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    isAuthenticated,
    signIn,
    signOut,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    checkAvailability,
    refreshMeetings: fetchMeetings
  };
}