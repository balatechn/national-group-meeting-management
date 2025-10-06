import React, { useState, useEffect } from 'react';

interface AutoBookingCalendarProps {
  onConnectionChange: (isConnected: boolean) => void;
  onMeetingsSync: (meetings: any[]) => void;
  onRoomBooked: (roomBooking: any) => void;
}

export default function AutoBookingCalendar({ 
  onConnectionChange, 
  onMeetingsSync,
  onRoomBooked
}: AutoBookingCalendarProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapi, setGapi] = useState<any>(null);
  const [watchingCalendars, setWatchingCalendars] = useState(false);

  // Configuration
  const GOOGLE_CONFIG = {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
  };

  // Room detection keywords and calendar mapping
  const ROOM_DETECTION = {
    keywords: ['room a', 'room b', 'conference room', 'meeting room', 'boardroom'],
    rooms: {
      'Room A': {
        keywords: ['room a', 'conference room a', 'meeting room a'],
        calendarId: import.meta.env.VITE_ROOM_A_CALENDAR_ID || 'room-a@your-domain.com',
        capacity: 8
      },
      'Room B': {
        keywords: ['room b', 'conference room b', 'meeting room b'],
        calendarId: import.meta.env.VITE_ROOM_B_CALENDAR_ID || 'room-b@your-domain.com',
        capacity: 12
      }
    }
  };

  // Initialize Google API
  useEffect(() => {
    const initializeGoogleAPI = async () => {
      try {
        if (!GOOGLE_CONFIG.apiKey || GOOGLE_CONFIG.apiKey === 'YOUR_GOOGLE_API_KEY') {
          setError('Google Calendar API key not configured. Using demo mode.');
          return;
        }

        // Load Google API script
        if (!(window as any).gapi) {
          await loadGoogleScript();
        }

        const gapiInstance = (window as any).gapi;
        setGapi(gapiInstance);

        await gapiInstance.load('client:auth2', async () => {
          await gapiInstance.client.init({
            apiKey: GOOGLE_CONFIG.apiKey,
            clientId: GOOGLE_CONFIG.clientId,
            discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
            scope: GOOGLE_CONFIG.scope
          });

          const authInstance = gapiInstance.auth2.getAuthInstance();
          const isCurrentlySignedIn = authInstance.isSignedIn.get();
          
          setIsSignedIn(isCurrentlySignedIn);
          setIsInitialized(true);
          onConnectionChange(isCurrentlySignedIn);

          // Listen for auth state changes
          authInstance.isSignedIn.listen((signedIn: boolean) => {
            setIsSignedIn(signedIn);
            onConnectionChange(signedIn);
            if (signedIn) {
              startCalendarWatching();
            } else {
              stopCalendarWatching();
            }
          });

          if (isCurrentlySignedIn) {
            startCalendarWatching();
          }
        });

      } catch (err) {
        console.error('Failed to initialize Google API:', err);
        setError('Failed to initialize Google Calendar integration');
      }
    };

    initializeGoogleAPI();
  }, []);

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  };

  // Auto room booking logic
  const detectRoomFromEvent = (event: any): string | null => {
    const title = event.summary?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    const location = event.location?.toLowerCase() || '';
    
    // Check each room's keywords
    for (const [roomName, roomConfig] of Object.entries(ROOM_DETECTION.rooms)) {
      for (const keyword of roomConfig.keywords) {
        if (title.includes(keyword) || description.includes(keyword) || location.includes(keyword)) {
          return roomName;
        }
      }
    }

    // Auto-assign based on attendee count
    const attendeeCount = event.attendees?.length || 0;
    if (attendeeCount <= 8) {
      return 'Room A';
    } else {
      return 'Room B';
    }
  };

  const checkRoomAvailability = async (roomName: string, startTime: string, endTime: string): Promise<boolean> => {
    if (!gapi || !isSignedIn) return false;

    try {
      const roomConfig = ROOM_DETECTION.rooms[roomName as keyof typeof ROOM_DETECTION.rooms];
      if (!roomConfig) return false;

      const response = await (gapi.client as any).calendar.freebusy.query({
        resource: {
          timeMin: startTime,
          timeMax: endTime,
          items: [{ id: roomConfig.calendarId }]
        }
      });

      const busyTimes = response.result.calendars[roomConfig.calendarId]?.busy || [];
      return busyTimes.length === 0;
    } catch (err) {
      console.error('Error checking room availability:', err);
      return false;
    }
  };

  const bookRoomAutomatically = async (event: any, roomName: string) => {
    if (!gapi || !isSignedIn) return;

    try {
      const roomConfig = ROOM_DETECTION.rooms[roomName as keyof typeof ROOM_DETECTION.rooms];
      if (!roomConfig) return;

      // Check if room is available
      const isAvailable = await checkRoomAvailability(roomName, event.start.dateTime, event.end.dateTime);
      
      if (!isAvailable) {
        console.log(`${roomName} is not available for the requested time`);
        return;
      }

      // Create room booking event
      const roomBooking = {
        summary: `${event.summary} - ${roomName}`,
        description: `Auto-booked for: ${event.summary}\\nOrganizer: ${event.organizer?.email}\\nAttendees: ${event.attendees?.length || 0}`,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        organizer: event.organizer
      };

      // Book the room
      const response = await (gapi.client as any).calendar.events.insert({
        calendarId: roomConfig.calendarId,
        resource: roomBooking
      });

      console.log(`Room ${roomName} automatically booked:`, response.result);
      
      // Notify the application
      onRoomBooked({
        id: response.result.id,
        room: roomName,
        title: event.summary,
        organizer: event.organizer?.displayName || event.organizer?.email,
        start: event.start.dateTime,
        end: event.end.dateTime,
        attendees: event.attendees?.map((a: any) => a.email) || [],
        autoBooked: true
      });

    } catch (err) {
      console.error('Error booking room automatically:', err);
      setError(`Failed to auto-book ${roomName}`);
    }
  };

  // Watch for calendar changes
  const startCalendarWatching = async () => {
    if (!gapi || !isSignedIn || watchingCalendars) return;

    try {
      setWatchingCalendars(true);
      
      // Poll for new events every 30 seconds
      const watchInterval = setInterval(async () => {
        await checkForNewMeetings();
      }, 30000);

      // Store interval ID for cleanup
      (window as any).calendarWatchInterval = watchInterval;
      
    } catch (err) {
      console.error('Error starting calendar watching:', err);
    }
  };

  const stopCalendarWatching = () => {
    if ((window as any).calendarWatchInterval) {
      clearInterval((window as any).calendarWatchInterval);
      (window as any).calendarWatchInterval = null;
    }
    setWatchingCalendars(false);
  };

  const checkForNewMeetings = async () => {
    if (!gapi || !isSignedIn) return;

    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Next 24 hours

      const response = await (gapi.client as any).calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50
      });

      const events = response.result.items || [];
      const newMeetings: any[] = [];

      for (const event of events) {
        if (event.attendees && event.attendees.length > 0) {
          // Detect if this meeting needs a room
          const detectedRoom = detectRoomFromEvent(event);
          
          if (detectedRoom) {
            // Check if room is already booked
            const existingBooking = await checkExistingRoomBooking(event, detectedRoom);
            
            if (!existingBooking) {
              // Auto-book the room
              await bookRoomAutomatically(event, detectedRoom);
            }

            // Add to meetings list
            newMeetings.push({
              id: event.id,
              room: detectedRoom,
              title: event.summary,
              organizer: event.organizer?.displayName || event.organizer?.email,
              start: event.start.dateTime,
              end: event.end.dateTime,
              attendees: event.attendees?.map((a: any) => a.email) || [],
              autoBooked: !existingBooking
            });
          }
        }
      }

      if (newMeetings.length > 0) {
        onMeetingsSync(newMeetings);
      }

    } catch (err) {
      console.error('Error checking for new meetings:', err);
    }
  };

  const checkExistingRoomBooking = async (event: any, roomName: string): Promise<boolean> => {
    if (!gapi || !isSignedIn) return false;

    try {
      const roomConfig = ROOM_DETECTION.rooms[roomName as keyof typeof ROOM_DETECTION.rooms];
      if (!roomConfig) return false;

      const response = await (gapi.client as any).calendar.events.list({
        calendarId: roomConfig.calendarId,
        timeMin: event.start.dateTime,
        timeMax: event.end.dateTime,
        singleEvents: true
      });

      const existingEvents = response.result.items || [];
      
      // Check if there's already a booking for this meeting
      return existingEvents.some((existingEvent: any) => 
        existingEvent.summary?.includes(event.summary) ||
        existingEvent.description?.includes(event.id)
      );

    } catch (err) {
      console.error('Error checking existing room booking:', err);
      return false;
    }
  };

  // Sign in to Google
  const signIn = async () => {
    if (!gapi || !isInitialized) {
      setError('Google API not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (err) {
      console.error('Sign in failed:', err);
      setError('Failed to sign in to Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out from Google
  const signOut = async () => {
    if (!gapi || !isInitialized) return;

    try {
      stopCalendarWatching();
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
      setError('Failed to sign out from Google Calendar');
    }
  };

  // Manual sync
  const manualSync = async () => {
    setIsLoading(true);
    await checkForNewMeetings();
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Auto-Booking Calendar</h3>
            <p className="text-sm text-gray-600">
              {isSignedIn ? 'Connected - Auto-booking rooms for meetings' : 'Connect to enable automatic room booking'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {watchingCalendars && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Watching</span>
            </div>
          )}
          
          {isSignedIn ? (
            <div className="flex gap-2">
              <button
                onClick={manualSync}
                disabled={isLoading}
                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={signOut}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              disabled={!isInitialized || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Connecting...' : 'Connect Calendar'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {isSignedIn && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Auto-Booking Rules</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Room A: Auto-booked for meetings with ≤8 attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Room B: Auto-booked for meetings with {'>'}8 attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Keyword detection: "room a", "room b", "conference room"</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Only books available rooms - checks for conflicts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}