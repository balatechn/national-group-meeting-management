// Simple Google Calendar Integration Example
// This shows how to integrate the Google Calendar hook with your existing SmartMeetDisplay

import React, { useState } from 'react';
import SmartMeetDisplay from './SmartMeetDisplay';
import AdminPageGoogleCalendar from './src/AdminPageGoogleCalendar';
// Uncomment when ready to use Google Calendar:
// import { useGoogleCalendar } from './src/useGoogleCalendar';

export default function AppWithGoogleCalendar() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Google Calendar Integration (currently disabled for demo)
  const ENABLE_GOOGLE_CALENDAR = false;

  // If Google Calendar is enabled, use the real calendar data
  // Uncomment these lines when ready:
  /*
  const {
    meetings: calendarMeetings,
    loading,
    error,
    isAuthenticated,
    createMeeting,
    deleteMeeting
  } = useGoogleCalendar({
    roomACalendarId: 'room-a@your-domain.com',
    roomBCalendarId: 'room-b@your-domain.com',
    refreshInterval: 300000, // 5 minutes
    daysToFetch: 7
  });
  */

  if (showAdmin) {
    return (
      <AdminPageGoogleCalendar
        onBackToDisplay={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <div className="relative">
      <SmartMeetDisplay />
      
      {/* Admin access button */}
      <button
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all z-50 flex items-center justify-center"
        title="Open Admin Panel"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Google Calendar Status Indicator */}
      {ENABLE_GOOGLE_CALENDAR && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-white/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Calendar Sync</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}