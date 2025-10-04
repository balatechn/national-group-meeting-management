import React, { useState, useEffect } from 'react';

interface GoogleCalendarIntegrationProps {
  onConnectionChange: (isConnected: boolean) => void;
  onMeetingsSync: (meetings: any[]) => void;
}

export default function GoogleCalendarIntegration({ 
  onConnectionChange, 
  onMeetingsSync 
}: GoogleCalendarIntegrationProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapi, setGapi] = useState<any>(null);

  // Configuration - these should be in environment variables
  const GOOGLE_CONFIG = {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY', // Replace with actual API key
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com', // Replace with actual client ID
    scope: 'https://www.googleapis.com/auth/calendar',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
  };

  const ROOM_CALENDARS = {
    'Room A': import.meta.env.VITE_ROOM_A_CALENDAR_ID || 'room-a@your-domain.com', // Replace with actual calendar IDs
    'Room B': import.meta.env.VITE_ROOM_B_CALENDAR_ID || 'room-b@your-domain.com'
  };

  // Initialize Google API
  useEffect(() => {
    const initializeGoogleAPI = async () => {
      try {
        // Check if we have the required configuration
        if (!GOOGLE_CONFIG.apiKey || GOOGLE_CONFIG.apiKey === 'YOUR_GOOGLE_API_KEY') {
          setError('Google Calendar API key not configured. Please set up your .env file with valid credentials.');
          return;
        }

        if (!GOOGLE_CONFIG.clientId || GOOGLE_CONFIG.clientId.includes('YOUR_CLIENT_ID')) {
          setError('Google Calendar Client ID not configured. Please set up your .env file with valid credentials.');
          return;
        }

        // Load Google API script
        if (!(window as any).gapi) {
          await loadGoogleScript();
        }

        const gapiInstance = (window as any).gapi;
        setGapi(gapiInstance);

        // Load auth2 and client
        await new Promise<void>((resolve) => {
          gapiInstance.load('client:auth2', resolve);
        });

        // Initialize the API client
        await gapiInstance.client.init({
          apiKey: GOOGLE_CONFIG.apiKey,
          clientId: GOOGLE_CONFIG.clientId,
          discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
          scope: GOOGLE_CONFIG.scope
        });

        // Check current auth status
        const authInstance = gapiInstance.auth2.getAuthInstance();
        const signedIn = authInstance.isSignedIn.get();
        setIsSignedIn(signedIn);
        onConnectionChange(signedIn);

        // Listen for auth changes
        authInstance.isSignedIn.listen((isSignedIn: boolean) => {
          setIsSignedIn(isSignedIn);
          onConnectionChange(isSignedIn);
          
          if (isSignedIn) {
            fetchCalendarMeetings();
          }
        });

        setIsInitialized(true);
        
        // Fetch meetings if already signed in
        if (signedIn) {
          fetchCalendarMeetings();
        }

      } catch (err) {
        console.error('Failed to initialize Google API:', err);
        setError('Failed to initialize Google Calendar API. Please check your internet connection and API configuration.');
      }
    };

    initializeGoogleAPI();
  }, []);

  // Load Google API script
  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
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
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
      setError('Failed to sign out from Google Calendar');
    }
  };

  // Fetch meetings from Google Calendar
  const fetchCalendarMeetings = async () => {
    if (!gapi || !isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

      const allMeetings: any[] = [];

      // Fetch events from each room calendar
      for (const [roomName, calendarId] of Object.entries(ROOM_CALENDARS)) {
        try {
          const response = await gapi.client.calendar.events.list({
            calendarId: calendarId,
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50
          });

          const events = response.result.items || [];
          
          // Convert to our meeting format
          const meetings = events.map((event: any) => ({
            id: event.id,
            room: roomName as 'Room A' | 'Room B',
            title: event.summary || 'Untitled Meeting',
            organizer: event.organizer?.displayName || event.organizer?.email || 'Unknown',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            description: event.description,
            attendees: event.attendees?.map((a: any) => a.email) || []
          }));

          allMeetings.push(...meetings);
        } catch (roomError) {
          console.warn(`Failed to fetch events for ${roomName}:`, roomError);
        }
      }

      onMeetingsSync(allMeetings);
    } catch (err) {
      console.error('Failed to fetch calendar meetings:', err);
      setError('Failed to fetch calendar meetings');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new meeting in Google Calendar
  const createCalendarMeeting = async (meetingData: {
    room: 'Room A' | 'Room B';
    title: string;
    start: string;
    end: string;
    description?: string;
    attendees?: string[];
  }) => {
    if (!gapi || !isSignedIn) {
      throw new Error('Not connected to Google Calendar');
    }

    const calendarId = ROOM_CALENDARS[meetingData.room];
    if (!calendarId) {
      throw new Error(`Calendar ID not found for ${meetingData.room}`);
    }

    const event = {
      summary: meetingData.title,
      start: {
        dateTime: meetingData.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: meetingData.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      description: meetingData.description,
      attendees: meetingData.attendees?.map(email => ({ email })),
      location: meetingData.room
    };

    const response = await gapi.client.calendar.events.insert({
      calendarId: calendarId,
      resource: event
    });

    // Refresh meetings after creation
    await fetchCalendarMeetings();
    
    return response.result;
  };

  // Delete a meeting from Google Calendar
  const deleteCalendarMeeting = async (meetingId: string, room: 'Room A' | 'Room B') => {
    if (!gapi || !isSignedIn) {
      throw new Error('Not connected to Google Calendar');
    }

    const calendarId = ROOM_CALENDARS[room];
    if (!calendarId) {
      throw new Error(`Calendar ID not found for ${room}`);
    }

    await gapi.client.calendar.events.delete({
      calendarId: calendarId,
      eventId: meetingId
    });

    // Refresh meetings after deletion
    await fetchCalendarMeetings();
  };

  // Manual refresh
  const handleRefresh = () => {
    if (isSignedIn) {
      fetchCalendarMeetings();
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Google Calendar Integration</h3>
            <p className="text-sm text-gray-600">Sync your room bookings with Google Calendar</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
          isSignedIn 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isSignedIn ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          {isSignedIn ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Google Calendar Configuration Required</p>
              <p className="text-yellow-700 mb-3">{error}</p>
              <div className="bg-white p-3 rounded border border-yellow-200">
                <p className="font-medium text-gray-800 mb-2">📋 Setup Instructions:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Create a Google Cloud Console project</li>
                  <li>Enable Google Calendar API</li>
                  <li>Create API key and OAuth 2.0 credentials</li>
                  <li>Copy .env.example to .env and add your credentials</li>
                  <li>Restart the development server</li>
                </ol>
                <p className="text-xs text-gray-500 mt-2">
                  See GOOGLE_CALENDAR_SETUP_NEW.md for detailed instructions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isSignedIn ? (
          <button
            onClick={signIn}
            disabled={!isInitialized || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {isInitialized ? 'Connect Google Calendar' : 'Initializing...'}
          </button>
        ) : (
          <>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sync Calendar
            </button>
            
            <button
              onClick={signOut}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {isSignedIn && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Calendar Integration Active</p>
              <p>Meetings will be automatically synced with your Google Calendar. Any changes made here will be reflected in your calendar and vice versa.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export functions for use in other components
export { };