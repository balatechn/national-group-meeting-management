import React, { useState, useEffect } from 'react';

interface SimpleCalendarProps {
  onMeetingsUpdate: (meetings: any[]) => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export default function SimpleGoogleCalendar({ 
  onMeetingsUpdate, 
  isConnected, 
  onConnectionChange 
}: SimpleCalendarProps) {
  const [mode, setMode] = useState<'demo' | 'simple' | 'advanced'>('demo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo mode - Works immediately without setup
  const enableDemoMode = () => {
    setMode('demo');
    setError(null);
    onConnectionChange(true);
    
    // Generate sample meetings for today
    const generateDemoMeetings = () => {
      const today = new Date();
      const meetings = [
        {
          id: 'demo-1',
          room: 'Room A' as const,
          title: 'Team Standup',
          organizer: 'Project Manager',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
          description: 'Daily team standup meeting'
        },
        {
          id: 'demo-2',
          room: 'Room A' as const,
          title: 'Client Presentation',
          organizer: 'Sales Team',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
          description: 'Quarterly business review with client'
        },
        {
          id: 'demo-3',
          room: 'Room B' as const,
          title: 'Design Review',
          organizer: 'Design Team',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(),
          description: 'UI/UX design review session'
        },
        {
          id: 'demo-4',
          room: 'Room B' as const,
          title: 'Technical Discussion',
          organizer: 'Engineering',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(),
          description: 'Architecture planning meeting'
        }
      ];
      onMeetingsUpdate(meetings);
    };

    generateDemoMeetings();
  };

  // Simple mode - Basic Google Calendar without complex OAuth
  const enableSimpleMode = () => {
    setMode('simple');
    setError('Simple mode: Coming soon! This will use basic calendar integration.');
    onConnectionChange(false);
  };

  // Advanced mode - Full Google Calendar API
  const enableAdvancedMode = () => {
    setMode('advanced');
    setError('Advanced mode requires Google Cloud Console setup. Please configure API keys in .env file.');
    onConnectionChange(false);
  };

  // Manual meeting management
  const addManualMeeting = () => {
    const title = prompt('Meeting Title:');
    const organizer = prompt('Organizer:');
    const room = prompt('Room (A or B):') === 'A' ? 'Room A' : 'Room B';
    const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    const startTime = prompt('Start Time (HH:MM):', '09:00');
    const endTime = prompt('End Time (HH:MM):', '10:00');

    if (title && organizer && date && startTime && endTime) {
      const newMeeting = {
        id: `manual-${Date.now()}`,
        room,
        title,
        organizer,
        start: `${date}T${startTime}:00`,
        end: `${date}T${endTime}:00`,
        description: 'Manually added meeting'
      };

      // Get current meetings and add new one
      const currentMeetings = JSON.parse(localStorage.getItem('demoMeetings') || '[]');
      const updatedMeetings = [...currentMeetings, newMeeting];
      localStorage.setItem('demoMeetings', JSON.stringify(updatedMeetings));
      onMeetingsUpdate(updatedMeetings);
    }
  };

  useEffect(() => {
    // Load saved meetings on component mount
    const savedMeetings = localStorage.getItem('demoMeetings');
    if (savedMeetings) {
      onMeetingsUpdate(JSON.parse(savedMeetings));
    }
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Calendar Integration</h3>
            <p className="text-sm text-gray-600">Choose your preferred integration mode</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
          isConnected && mode === 'demo'
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected && mode === 'demo' ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          {isConnected && mode === 'demo' ? 'Demo Mode Active' : 'Not Connected'}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Demo Mode */}
        <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          mode === 'demo' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-gray-50 hover:border-green-300'
        }`} onClick={enableDemoMode}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Demo Mode</h4>
              <p className="text-xs text-gray-600">Works immediately</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ No setup required</li>
            <li>✅ Sample meeting data</li>
            <li>✅ Full functionality</li>
            <li>✅ Manual meeting entry</li>
          </ul>
        </div>

        {/* Simple Mode */}
        <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all opacity-60 ${
          mode === 'simple' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 bg-gray-50'
        }`} onClick={enableSimpleMode}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Simple Mode</h4>
              <p className="text-xs text-gray-600">Coming soon</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>🔄 Basic calendar sync</li>
            <li>🔄 ICS file import</li>
            <li>🔄 CSV import/export</li>
            <li>🔄 Minimal setup</li>
          </ul>
        </div>

        {/* Advanced Mode */}
        <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          mode === 'advanced' 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-200 bg-gray-50 hover:border-purple-300'
        }`} onClick={enableAdvancedMode}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Advanced Mode</h4>
              <p className="text-xs text-gray-600">Full Google Calendar</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>🔧 Google API setup required</li>
            <li>⚡ Real-time sync</li>
            <li>🔐 OAuth authentication</li>
            <li>🌐 Cross-platform access</li>
          </ul>
        </div>
      </div>

      {/* Current Mode Status */}
      <div className={`p-4 rounded-xl mb-4 ${
        mode === 'demo' && isConnected
          ? 'bg-green-50 border border-green-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            mode === 'demo' && isConnected ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {mode === 'demo' && isConnected ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className={`font-medium mb-1 ${
              mode === 'demo' && isConnected ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {mode === 'demo' && isConnected 
                ? '✅ Demo Mode Active - Ready to Use!'
                : `Current Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`
              }
            </p>
            <p className={`text-sm ${
              mode === 'demo' && isConnected ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {mode === 'demo' && isConnected 
                ? 'You can now create, edit, and manage meetings. All features are fully functional with sample data.'
                : error || 'Select a mode above to get started with calendar integration.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {mode === 'demo' && isConnected && (
          <>
            <button
              onClick={addManualMeeting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Manual Meeting
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('demoMeetings');
                enableDemoMode();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Demo Data
            </button>
          </>
        )}

        {mode === 'advanced' && (
          <button
            onClick={() => window.open('https://console.cloud.google.com', '_blank')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Setup Google Cloud Console
          </button>
        )}

        <button
          onClick={() => setMode('demo')}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          Back to Demo Mode
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Recommendation:</strong> Start with Demo Mode to explore all features immediately. 
          Upgrade to Advanced Mode later when you're ready for full Google Calendar integration.
        </p>
      </div>
    </div>
  );
}