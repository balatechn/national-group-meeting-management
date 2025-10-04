import React, { useState, useEffect } from 'react';
import MeetingCalendarView from './MeetingCalendarView';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';

// Types
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
  meetings: Meeting[];
  onUpdateMeetings: (meetings: Meeting[]) => void;
  onBackToDisplay: () => void;
};

export default function AdminPage({ meetings, onUpdateMeetings, onBackToDisplay }: AdminPageProps) {
  const [localMeetings, setLocalMeetings] = useState<Meeting[]>(meetings);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [activeSection, setActiveSection] = useState<'dashboard' | 'meetings' | 'users' | 'logs'>('dashboard');
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    room: 'Room A' as "Room A" | "Room B",
    date: '',
    startTime: '',
    endTime: ''
  });

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

  // Update local meetings when prop changes
  useEffect(() => {
    setLocalMeetings(meetings);
  }, [meetings]);

  // Initialize with sample meetings if no meetings exist
  useEffect(() => {
    if (localMeetings.length === 0) {
      const today = new Date();
      const sampleMeetings: Meeting[] = [
        {
          id: '1',
          room: 'Room A',
          title: 'Morning Standup',
          organizer: 'Nirup',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString()
        },
        {
          id: '2',
          room: 'Room A',
          title: 'Design Review',
          organizer: 'Priya',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString()
        },
        {
          id: '3',
          room: 'Room A',
          title: 'Client Presentation',
          organizer: 'Raj',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString()
        },
        {
          id: '4',
          room: 'Room B',
          title: 'Sales Review',
          organizer: 'Kartik',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString()
        },
        {
          id: '5',
          room: 'Room B',
          title: 'Team Training',
          organizer: 'Meera',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString()
        },
        {
          id: '6',
          room: 'Room B',
          title: 'Project Planning',
          organizer: 'Arun',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString()
        },
        {
          id: '7',
          room: 'Room A',
          title: 'Board Meeting',
          organizer: 'CEO',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString()
        },
        {
          id: '8',
          room: 'Room A',
          title: 'Technical Discussion',
          organizer: 'Tech Lead',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString()
        },
        {
          id: '9',
          room: 'Room B',
          title: 'Client Call - Montra',
          organizer: 'Chris',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString()
        }
      ];
      setLocalMeetings(sampleMeetings);
    }
  }, [localMeetings.length]);

  // Authentication
  const handleLogin = () => {
    const user = users.find(u => u.username === loginForm.username);
    if (user && (loginForm.password === 'admin' || loginForm.password === user.username)) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      addActivityLog('LOGIN', 'User logged into admin panel');
    } else {
      alert('Invalid credentials. Try: admin/admin, manager/manager, or user/user');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      addActivityLog('LOGOUT', 'User logged out of admin panel');
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Activity logging
  const addActivityLog = (action: string, details: string, meetingId?: string) => {
    if (!currentUser) return;
    
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      action,
      details,
      timestamp: new Date().toISOString(),
      meetingId
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100);
    setActivityLogs(updatedLogs);
    localStorage.setItem('meetingActivityLogs', JSON.stringify(updatedLogs));
  };

  // Handle Google Calendar connection change
  const handleGoogleCalendarConnection = (isConnected: boolean) => {
    setIsGoogleCalendarConnected(isConnected);
    if (currentUser) {
      addActivityLog(
        isConnected ? 'GOOGLE_CALENDAR_CONNECTED' : 'GOOGLE_CALENDAR_DISCONNECTED',
        `Google Calendar ${isConnected ? 'connected' : 'disconnected'}`
      );
    }
  };

  // Handle Google Calendar meetings sync
  const handleGoogleCalendarSync = (googleMeetings: any[]) => {
    setLocalMeetings(googleMeetings);
    if (currentUser) {
      addActivityLog('GOOGLE_CALENDAR_SYNC', `Synced ${googleMeetings.length} meetings from Google Calendar`);
    }
  };

  // Meeting management
  const handleAddMeeting = () => {
    if (!formData.title || !formData.organizer || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill in all fields');
      return;
    }

    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: formData.title,
      organizer: formData.organizer,
      room: formData.room,
      start: `${formData.date}T${formData.startTime}:00`,
      end: `${formData.date}T${formData.endTime}:00`
    };

    const updatedMeetings = [...localMeetings, newMeeting];
    setLocalMeetings(updatedMeetings);
    addActivityLog('CREATE_MEETING', `Created meeting "${newMeeting.title}" in ${newMeeting.room}`, newMeeting.id);
    resetForm();
  };

  const handleDeleteMeeting = (meetingId: string) => {
    const meeting = localMeetings.find(m => m.id === meetingId);
    if (meeting && window.confirm(`Delete "${meeting.title}"?`)) {
      const updatedMeetings = localMeetings.filter(m => m.id !== meetingId);
      setLocalMeetings(updatedMeetings);
      addActivityLog('DELETE_MEETING', `Deleted meeting "${meeting.title}"`, meetingId);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    const startDateTime = new Date(meeting.start);
    const endDateTime = new Date(meeting.end);
    
    setFormData({
      title: meeting.title,
      organizer: meeting.organizer,
      room: meeting.room,
      date: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toTimeString().substring(0, 5),
      endTime: endDateTime.toTimeString().substring(0, 5)
    });
    setEditingMeeting(meeting);
    setShowAddForm(true);
  };

  const handleUpdateMeeting = () => {
    if (!editingMeeting) return;

    const updatedMeeting: Meeting = {
      ...editingMeeting,
      title: formData.title,
      organizer: formData.organizer,
      room: formData.room,
      start: `${formData.date}T${formData.startTime}:00`,
      end: `${formData.date}T${formData.endTime}:00`
    };

    const updatedMeetings = localMeetings.map(m => 
      m.id === editingMeeting.id ? updatedMeeting : m
    );
    setLocalMeetings(updatedMeetings);
    addActivityLog('UPDATE_MEETING', `Updated meeting "${updatedMeeting.title}"`, updatedMeeting.id);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      organizer: '',
      room: 'Room A',
      date: '',
      startTime: '',
      endTime: ''
    });
    setEditingMeeting(null);
    setShowAddForm(false);
  };

  const handleSaveChanges = () => {
    onUpdateMeetings(localMeetings);
    addActivityLog('SAVE_CHANGES', 'Saved meeting changes');
    alert('Changes saved successfully!');
  };

  const handleDiscardChanges = () => {
    setLocalMeetings(meetings);
    addActivityLog('DISCARD_CHANGES', 'Discarded meeting changes');
    resetForm();
  };

  // Filter meetings based on view mode and selected date
  const getFilteredMeetings = () => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    return localMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.start).toISOString().split('T')[0];
      
      if (viewMode === 'day') {
        return meetingDate === selectedDateStr;
      } else if (viewMode === 'week') {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const meetingDateTime = new Date(meeting.start);
        return meetingDateTime >= weekStart && meetingDateTime <= weekEnd;
      } else { // month
        return meeting.start.startsWith(selectedDate.toISOString().substring(0, 7));
      }
    });
  };

  const formatDateRange = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString();
    } else if (viewMode === 'week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#faf7f1] to-[#f1efe9] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-lg text-center">
            <div className="relative mb-6">
              <img 
                src="c:\Users\Admin\OneDrive\Pictures\national-logo.png.png" 
                alt="National Group India Logo"
                className="h-16 w-auto mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.login-logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="login-logo-fallback h-16 w-16 rounded-2xl bg-[#c7a268] mx-auto hidden" />
            </div>
            
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">National Group India</h1>
            <p className="text-[#1a1a1a]/70 mb-8">Meeting Management System</p>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#c7a268] focus:ring-2 focus:ring-[#c7a268]/20 outline-none transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#c7a268] focus:ring-2 focus:ring-[#c7a268]/20 outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-[#c7a268] text-white rounded-xl font-semibold hover:bg-[#b8956a] transition-colors"
              >
                Sign In
              </button>
            </div>
            
            <p className="text-sm text-[#1a1a1a]/50 mt-6">
              Demo: admin/admin, manager/manager, user/user
            </p>
            
            <button
              onClick={onBackToDisplay}
              className="mt-4 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              ← Back to Display
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main admin interface with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf7f1] to-[#f1efe9] flex">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-white/70 backdrop-blur-xl border-r border-white/60 p-6 flex flex-col">
        {/* Logo and Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img 
                src="c:\Users\Admin\OneDrive\Pictures\national-logo.png.png" 
                alt="National Group India Logo"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.admin-logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="admin-logo-fallback h-10 w-10 rounded-xl bg-[#c7a268] hidden" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1a]">National Group</h1>
              <p className="text-sm text-[#1a1a1a]/70">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeSection === 'dashboard' 
                ? 'bg-[#c7a268] text-white shadow-lg' 
                : 'text-gray-700 hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => setActiveSection('meetings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeSection === 'meetings' 
                ? 'bg-[#c7a268] text-white shadow-lg' 
                : 'text-gray-700 hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Meetings
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeSection === 'users' 
                ? 'bg-[#c7a268] text-white shadow-lg' 
                : 'text-gray-700 hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Users
          </button>

          <button
            onClick={() => setActiveSection('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeSection === 'logs' 
                ? 'bg-[#c7a268] text-white shadow-lg' 
                : 'text-gray-700 hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Activity Logs
          </button>
        </nav>

        {/* User Info and Actions */}
        <div className="border-t border-white/40 pt-6 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
            <div className="w-8 h-8 bg-[#c7a268] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{currentUser?.fullName}</p>
              <p className="text-xs text-gray-600 capitalize">{currentUser?.role}</p>
            </div>
          </div>

          <button
            onClick={onBackToDisplay}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Display
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] capitalize">
              {activeSection === 'dashboard' ? 'Dashboard Overview' :
               activeSection === 'meetings' ? 'Meeting Management' :
               activeSection === 'users' ? 'User Management' :
               'Activity Logs'}
            </h2>
            <p className="text-[#1a1a1a]/70 mt-1">
              Welcome back, {currentUser?.fullName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeSection === 'meetings' && (
              <>
                <div className="flex bg-white/70 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'day' ? 'bg-[#c7a268] text-white' : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'week' ? 'bg-[#c7a268] text-white' : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'month' ? 'bg-[#c7a268] text-white' : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    Month
                  </button>
                </div>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-gray-300 focus:border-[#c7a268] focus:ring-2 focus:ring-[#c7a268]/20 outline-none text-sm"
                />
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-[#c7a268] text-white rounded-xl font-medium hover:bg-[#b8956a] transition-colors text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleDiscardChanges}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors text-sm"
                >
                  Discard Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Section Based on Active Navigation */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-lg">
          {activeSection === 'dashboard' && (
            <div>
              <h3 className="text-xl font-semibold mb-6">Dashboard Overview</h3>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold opacity-90">Today's Meetings</h4>
                      <p className="text-3xl font-bold">
                        {localMeetings.filter(m => {
                          const meetingDate = new Date(m.start).toDateString();
                          const today = new Date().toDateString();
                          return meetingDate === today;
                        }).length}
                      </p>
                    </div>
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold opacity-90">Room A</h4>
                      <p className="text-xl font-bold">
                        {localMeetings.find(m => m.room === 'Room A' && 
                          new Date() >= new Date(m.start) && new Date() <= new Date(m.end)) 
                          ? 'Busy' : 'Available'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${
                      localMeetings.find(m => m.room === 'Room A' && 
                        new Date() >= new Date(m.start) && new Date() <= new Date(m.end)) 
                        ? 'bg-red-400' : 'bg-green-300'
                    }`} />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold opacity-90">Room B</h4>
                      <p className="text-xl font-bold">
                        {localMeetings.find(m => m.room === 'Room B' && 
                          new Date() >= new Date(m.start) && new Date() <= new Date(m.end)) 
                          ? 'Busy' : 'Available'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${
                      localMeetings.find(m => m.room === 'Room B' && 
                        new Date() >= new Date(m.start) && new Date() <= new Date(m.end)) 
                        ? 'bg-red-400' : 'bg-green-300'
                    }`} />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold opacity-90">This Week</h4>
                      <p className="text-3xl font-bold">
                        {localMeetings.filter(m => {
                          const meetingDate = new Date(m.start);
                          const now = new Date();
                          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                          const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
                          return meetingDate >= weekStart && meetingDate <= weekEnd;
                        }).length}
                      </p>
                    </div>
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Today's Schedule */}
              <div className="bg-white/50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold mb-4">Today's Schedule</h4>
                <div className="space-y-3">
                  {localMeetings
                    .filter(m => {
                      const meetingDate = new Date(m.start).toDateString();
                      const today = new Date().toDateString();
                      return meetingDate === today;
                    })
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .slice(0, 5)
                    .map((meeting) => {
                      const startTime = new Date(meeting.start);
                      const endTime = new Date(meeting.end);
                      const now = new Date();
                      const isActive = now >= startTime && now <= endTime;
                      
                      return (
                        <div
                          key={meeting.id}
                          className={`flex items-center gap-4 p-3 rounded-xl border-l-4 ${
                            meeting.room === 'Room A'
                              ? 'bg-purple-50 border-purple-500'
                              : 'bg-blue-50 border-blue-500'
                          } ${isActive ? 'ring-2 ring-green-300' : ''}`}
                        >
                          <div className="flex-shrink-0">
                            <div className="text-sm font-medium text-gray-600">
                              {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div className="text-xs text-gray-500">
                              {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{meeting.title}</div>
                            <div className="text-sm text-gray-600">{meeting.organizer}</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            meeting.room === 'Room A'
                              ? 'bg-purple-200 text-purple-700'
                              : 'bg-blue-200 text-blue-700'
                          }`}>
                            {meeting.room}
                          </div>
                          {isActive && (
                            <div className="px-2 py-1 bg-green-200 text-green-700 rounded-full text-xs font-medium">
                              Live
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {localMeetings.filter(m => {
                    const meetingDate = new Date(m.start).toDateString();
                    const today = new Date().toDateString();
                    return meetingDate === today;
                  }).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No meetings scheduled for today
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'meetings' && (
            <div>
              <GoogleCalendarIntegration
                onConnectionChange={handleGoogleCalendarConnection}
                onMeetingsSync={handleGoogleCalendarSync}
              />
              <MeetingCalendarView
                meetings={localMeetings}
                onCreateMeeting={(meeting) => {
                  const newMeeting: Meeting = {
                    id: Date.now().toString(),
                    ...meeting
                  };
                  const updatedMeetings = [...localMeetings, newMeeting];
                  setLocalMeetings(updatedMeetings);
                  addActivityLog('CREATE_MEETING', `Created meeting "${newMeeting.title}" in ${newMeeting.room}`, newMeeting.id);
                }}
                onUpdateMeeting={(id, updates) => {
                  const updatedMeetings = localMeetings.map(m => 
                    m.id === id ? { ...m, ...updates } : m
                  );
                  setLocalMeetings(updatedMeetings);
                  const meeting = localMeetings.find(m => m.id === id);
                  if (meeting) {
                    addActivityLog('UPDATE_MEETING', `Updated meeting "${meeting.title}"`, id);
                  }
                }}
                onDeleteMeeting={(id) => {
                  const meeting = localMeetings.find(m => m.id === id);
                  if (meeting && window.confirm(`Delete "${meeting.title}"?`)) {
                    const updatedMeetings = localMeetings.filter(m => m.id !== id);
                    setLocalMeetings(updatedMeetings);
                    addActivityLog('DELETE_MEETING', `Deleted meeting "${meeting.title}"`, id);
                  }
                }}
                isGoogleCalendarConnected={isGoogleCalendarConnected}
              />
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <h3 className="text-xl font-semibold mb-6">User Management</h3>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#c7a268] rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{user.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-sm text-gray-600">@{user.username} • {user.role}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last login: {new Date(user.lastLogin).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'logs' && (
            <div>
              <h3 className="text-xl font-semibold mb-6">Activity Logs</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {activityLogs.slice(0, 50).map(log => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{log.action.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">{log.details}</p>
                        <p className="text-xs text-gray-500">by {log.username}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Meeting Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">
                {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
              </h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Meeting Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                
                <input
                  type="text"
                  placeholder="Organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                
                <select
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value as "Room A" | "Room B" }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Room A">Room A</option>
                  <option value="Room B">Room B</option>
                </select>
                
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingMeeting ? handleUpdateMeeting : handleAddMeeting}
                  className="flex-1 bg-[#c7a268] text-white py-2 rounded-lg hover:bg-[#b8956a]"
                >
                  {editingMeeting ? 'Update' : 'Add'} Meeting
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}