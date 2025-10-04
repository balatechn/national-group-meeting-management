// Updated AdminPage with Google Calendar Integration
import React, { useState, useEffect } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';

// Types (keeping your existing structure)
type Meeting = {
  id: string;
  room: "Room A" | "Room B";
  title: string;
  organizer: string;
  start: string; // ISO
  end: string;   // ISO
};

type User = {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'user';
  lastLogin: string;
};

type ActivityLog = {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
  meetingId?: string;
};

type AdminPageProps = {
  onBackToDisplay: () => void;
};

export default function AdminPageWithGoogleCalendar({ onBackToDisplay }: AdminPageProps) {
  // Google Calendar configuration
  const {
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
    refreshMeetings
  } = useGoogleCalendar({
    roomACalendarId: 'room-a@your-domain.com', // Replace with actual calendar IDs
    roomBCalendarId: 'room-b@your-domain.com',
    refreshInterval: 300000, // 5 minutes
    daysToFetch: 7
  });

  // Local state
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    room: 'Room A' as "Room A" | "Room B",
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    attendees: ''
  });

  // Authentication check
  const isUserAuthenticated = currentUser !== null;

  // Initialize users and activity logs
  useEffect(() => {
    const savedUsers = localStorage.getItem('meetingUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const defaultUsers: User[] = [
        { id: '1', username: 'admin', fullName: 'System Admin', role: 'admin', lastLogin: new Date().toISOString() },
        { id: '2', username: 'manager', fullName: 'Meeting Manager', role: 'manager', lastLogin: new Date().toISOString() },
        { id: '3', username: 'user', fullName: 'Regular User', role: 'user', lastLogin: new Date().toISOString() }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('meetingUsers', JSON.stringify(defaultUsers));
    }

    const savedLogs = localStorage.getItem('meetingActivityLogs');
    if (savedLogs) {
      setActivityLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = users.find(u => u.username === loginForm.username);
    if (user && (loginForm.password === 'admin' || loginForm.password === user.username)) {
      setCurrentUser(user);
      logActivity(user.id, user.username, 'LOGIN', 'User logged into admin panel');
    } else {
      alert('Invalid credentials. Try: admin/admin, manager/manager, or user/user');
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (currentUser) {
      logActivity(currentUser.id, currentUser.username, 'LOGOUT', 'User logged out of admin panel');
    }
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
  };

  // Log activity
  const logActivity = (userId: string, username: string, action: string, details: string, meetingId?: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId,
      username,
      action,
      details,
      timestamp: new Date().toISOString(),
      meetingId
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep last 100 logs
    setActivityLogs(updatedLogs);
    localStorage.setItem('meetingActivityLogs', JSON.stringify(updatedLogs));
  };

  // Handle form submission for creating meetings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please authenticate with Google Calendar first');
      return;
    }

    try {
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      // Check availability
      const isAvailable = await checkAvailability(formData.room, startDateTime, endDateTime);
      if (!isAvailable) {
        alert('Room is not available during the selected time');
        return;
      }

      const attendeesArray = formData.attendees
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      await createMeeting({
        room: formData.room,
        title: formData.title,
        organizer: formData.organizer,
        start: startDateTime,
        end: endDateTime,
        description: formData.description,
        attendees: attendeesArray
      });

      if (currentUser) {
        logActivity(
          currentUser.id,
          currentUser.username,
          'CREATE_MEETING',
          `Created meeting: ${formData.title} in ${formData.room}`
        );
      }

      // Reset form
      setFormData({
        title: '',
        organizer: '',
        room: 'Room A',
        date: '',
        startTime: '',
        endTime: '',
        description: '',
        attendees: ''
      });
      setShowAddForm(false);
      
      alert('Meeting created successfully!');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  // Handle meeting deletion
  const handleDelete = async (meeting: Meeting) => {
    if (!isAuthenticated) {
      alert('Please authenticate with Google Calendar first');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
      try {
        await deleteMeeting(meeting.id, meeting.room);
        
        if (currentUser) {
          logActivity(
            currentUser.id,
            currentUser.username,
            'DELETE_MEETING',
            `Deleted meeting: ${meeting.title} from ${meeting.room}`
          );
        }
        
        alert('Meeting deleted successfully!');
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  // Google Calendar Authentication Section
  const GoogleCalendarAuth = () => (
    <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
      <h3 className="text-xl font-bold text-blue-900 mb-4">Google Calendar Integration</h3>
      
      {!isAuthenticated ? (
        <div className="space-y-4">
          <p className="text-blue-700">
            Connect to Google Calendar to manage room bookings directly from your calendar.
          </p>
          <button
            onClick={signIn}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          {error && (
            <p className="text-red-600 text-sm">Error: {error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-green-700">
              ✅ Connected to Google Calendar
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={refreshMeetings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Calendar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Quick Booking Widget
  const QuickBookingWidget = () => (
    <div className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
      <h3 className="text-xl font-bold text-green-900 mb-4">Quick Room Booking</h3>
      
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          disabled={!isAuthenticated}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book a Room
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meeting Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Organizer</label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Room</label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value as "Room A" | "Room B" })}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="Room A">Room A</option>
                <option value="Room B">Room B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 border rounded-lg"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-2">Start</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attendees (Optional - comma separated emails)</label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Meeting
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );

  // If not logged in, show login form
  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf7f1] to-[#f1efe9] flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-12 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">National Group India Meeting Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Demo credentials: admin/admin, manager/manager, user/user
          </div>
        </div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f1] to-[#f1efe9] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Meeting Management</h1>
            <p className="text-gray-600 mt-2">Google Calendar Integration - National Group India</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {currentUser.fullName}</span>
            <button
              onClick={onBackToDisplay}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Display
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Google Calendar Authentication */}
        <GoogleCalendarAuth />

        {/* Quick Booking */}
        {isAuthenticated && <QuickBookingWidget />}

        {/* Meetings List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Current Meetings</h2>
            <div className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${meetings.length} meetings found`}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Error: {error}
            </div>
          )}

          <div className="space-y-4">
            {meetings.map(meeting => (
              <div key={meeting.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        meeting.room === 'Room A' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {meeting.room}
                      </span>
                      <h3 className="text-lg font-semibold">{meeting.title}</h3>
                    </div>
                    <div className="mt-2 text-gray-600">
                      <p>Organizer: {meeting.organizer}</p>
                      <p>Time: {new Date(meeting.start).toLocaleString()} - {new Date(meeting.end).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(meeting)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {meetings.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No meetings found. {isAuthenticated ? 'Create your first meeting above!' : 'Please authenticate with Google Calendar first.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}