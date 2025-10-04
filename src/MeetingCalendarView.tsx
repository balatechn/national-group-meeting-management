import React, { useState, useEffect } from 'react';

interface Meeting {
  id: string;
  room: "Room A" | "Room B";
  title: string;
  organizer: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
}

interface MeetingCalendarViewProps {
  meetings: Meeting[];
  onCreateMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  onUpdateMeeting: (id: string, meeting: Partial<Meeting>) => void;
  onDeleteMeeting: (id: string) => void;
  isGoogleCalendarConnected: boolean;
}

export default function MeetingCalendarView({
  meetings,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  isGoogleCalendarConnected
}: MeetingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);

  // Calendar navigation
  const navigateCalendar = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Get date range for current view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        return { start, end };
      case 'week':
        // Get week start (Sunday)
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        return { start, end };
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        return { start, end };
      default:
        return { start, end };
    }
  };

  // Format date range display
  const formatDateRange = () => {
    const { start, end } = getDateRange();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };

    if (viewMode === 'day') {
      return start.toLocaleDateString('en-US', options);
    } else if (viewMode === 'week') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
    } else {
      return start.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  // Get meetings for current view
  const getFilteredMeetings = () => {
    const { start, end } = getDateRange();
    
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start);
      return meetingDate >= start && meetingDate <= end;
    });
  };

  // Generate time slots for day/week view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 20; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour
      });
    }
    return slots;
  };

  // Get week days
  const getWeekDays = () => {
    const { start } = getDateRange();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Check if meeting overlaps with time slot
  const getMeetingAtTime = (date: Date, hour: number, room?: string) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return meetings.find(meeting => {
      if (room && meeting.room !== room) return false;
      
      const meetingStart = new Date(meeting.start);
      const meetingEnd = new Date(meeting.end);
      
      return (meetingStart < slotEnd && meetingEnd > slotStart);
    });
  };

  // Calendar Header
  const CalendarHeader = () => (
    <div className="flex items-center justify-between mb-6 p-4 bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Meeting Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateCalendar('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-semibold min-w-[280px] text-center">
            {formatDateRange()}
          </span>
          <button
            onClick={() => navigateCalendar('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigateCalendar('today')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Today
        </button>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-[#c7a268] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={!isGoogleCalendarConnected}
          className="px-4 py-2 bg-[#c7a268] text-white rounded-lg font-medium hover:bg-[#b8956a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + New Meeting
        </button>
      </div>
    </div>
  );

  // Week View Component
  const WeekView = () => {
    const timeSlots = generateTimeSlots();
    const weekDays = getWeekDays();

    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gray-50 font-medium text-gray-600">Time</div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-4 bg-gray-50 text-center">
              <div className="font-medium text-gray-800">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-sm ${
                day.toDateString() === new Date().toDateString() 
                  ? 'text-blue-600 font-bold' 
                  : 'text-gray-600'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((slot) => (
            <div key={slot.time} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
              <div className="p-2 bg-gray-50 text-sm text-gray-600 font-medium">
                {slot.time}
              </div>
              {weekDays.map((day, dayIndex) => {
                const meeting = getMeetingAtTime(day, slot.hour);
                return (
                  <div key={dayIndex} className="p-1 border-r border-gray-100 relative">
                    {meeting && (
                      <div
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setShowMeetingDetails(true);
                        }}
                        className={`p-2 rounded-lg cursor-pointer text-xs font-medium shadow-sm hover:shadow-md transition-all ${
                          meeting.room === 'Room A'
                            ? 'bg-purple-100 text-purple-800 border-l-4 border-purple-500'
                            : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
                        }`}
                      >
                        <div className="font-semibold truncate">{meeting.title}</div>
                        <div className="opacity-75 truncate">{meeting.organizer}</div>
                        <div className="text-xs opacity-60">{meeting.room}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day View Component
  const DayView = () => {
    const timeSlots = generateTimeSlots();
    const todayMeetings = getFilteredMeetings().filter(meeting => {
      const meetingDate = new Date(meeting.start);
      return meetingDate.toDateString() === currentDate.toDateString();
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time slots for both rooms */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 border-b border-gray-200">
            <div className="p-4 bg-gray-50 font-medium text-gray-600">Time</div>
            <div className="p-4 bg-purple-50 text-center font-medium text-purple-800">Room A</div>
            <div className="p-4 bg-blue-50 text-center font-medium text-blue-800">Room B</div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((slot) => (
              <div key={slot.time} className="grid grid-cols-3 border-b border-gray-100 min-h-[60px]">
                <div className="p-3 bg-gray-50 text-sm text-gray-600 font-medium flex items-center">
                  {slot.time}
                </div>
                {(['Room A', 'Room B'] as const).map((room, roomIndex) => {
                  const meeting = getMeetingAtTime(currentDate, slot.hour, room);
                  return (
                    <div key={roomIndex} className={`p-2 border-r border-gray-100 ${
                      room === 'Room A' ? 'bg-purple-25' : 'bg-blue-25'
                    }`}>
                      {meeting && (
                        <div
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowMeetingDetails(true);
                          }}
                          className={`p-3 rounded-lg cursor-pointer text-sm font-medium shadow-sm hover:shadow-md transition-all ${
                            room === 'Room A'
                              ? 'bg-purple-100 text-purple-800 border-l-4 border-purple-500'
                              : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
                          }`}
                        >
                          <div className="font-semibold">{meeting.title}</div>
                          <div className="opacity-75 text-xs">{meeting.organizer}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(meeting.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(meeting.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Daily summary */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Today's Meetings</h3>
          <div className="space-y-3">
            {todayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setShowMeetingDetails(true);
                }}
                className={`p-3 rounded-lg cursor-pointer border-l-4 ${
                  meeting.room === 'Room A'
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="font-semibold text-sm">{meeting.title}</div>
                <div className="text-xs text-gray-600">{meeting.organizer}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(meeting.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(meeting.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className={`text-xs font-medium mt-1 ${
                  meeting.room === 'Room A' ? 'text-purple-700' : 'text-blue-700'
                }`}>
                  {meeting.room}
                </div>
              </div>
            ))}
            
            {todayMeetings.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No meetings scheduled for today
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Month View Component (simplified)
  const MonthView = () => {
    const filteredMeetings = getFilteredMeetings();
    
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => {
                setSelectedMeeting(meeting);
                setShowMeetingDetails(true);
              }}
              className={`p-4 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 ${
                meeting.room === 'Room A'
                  ? 'bg-purple-50 border-purple-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{meeting.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  meeting.room === 'Room A'
                    ? 'bg-purple-200 text-purple-700'
                    : 'bg-blue-200 text-blue-700'
                }`}>
                  {meeting.room}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{meeting.organizer}</p>
              <div className="text-xs text-gray-500">
                <div>{new Date(meeting.start).toLocaleDateString()}</div>
                <div>
                  {new Date(meeting.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(meeting.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMeetings.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            No meetings found for this month
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CalendarHeader />
      
      {/* Connection Status */}
      <div className={`p-4 rounded-xl flex items-center gap-3 ${
        isGoogleCalendarConnected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          isGoogleCalendarConnected ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
        <span className={`font-medium ${
          isGoogleCalendarConnected ? 'text-green-800' : 'text-yellow-800'
        }`}>
          Google Calendar {isGoogleCalendarConnected ? 'Connected' : 'Not Connected'}
        </span>
        {!isGoogleCalendarConnected && (
          <span className="text-yellow-600 text-sm">
            Connect to Google Calendar to create and manage meetings
          </span>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'week' && <WeekView />}
      {viewMode === 'day' && <DayView />}
      {viewMode === 'month' && <MonthView />}

      {/* Meeting Details Modal */}
      {showMeetingDetails && selectedMeeting && (
        <MeetingDetailsModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowMeetingDetails(false);
            setSelectedMeeting(null);
          }}
          onEdit={(meeting) => {
            setShowMeetingDetails(false);
            // Handle edit
          }}
          onDelete={(meetingId) => {
            onDeleteMeeting(meetingId);
            setShowMeetingDetails(false);
            setSelectedMeeting(null);
          }}
        />
      )}

      {/* Add Meeting Modal */}
      {showAddModal && (
        <AddMeetingModal
          onClose={() => setShowAddModal(false)}
          onSave={(meeting) => {
            onCreateMeeting(meeting);
            setShowAddModal(false);
          }}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

// Meeting Details Modal Component
function MeetingDetailsModal({ meeting, onClose, onEdit, onDelete }: {
  meeting: Meeting;
  onClose: () => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Meeting Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <p className="text-lg font-semibold">{meeting.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Organizer</label>
            <p>{meeting.organizer}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Room</label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              meeting.room === 'Room A'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {meeting.room}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date & Time</label>
            <p>{new Date(meeting.start).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">
              {new Date(meeting.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
              {new Date(meeting.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>

          {meeting.description && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <p className="text-sm">{meeting.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onEdit(meeting)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(meeting.id)}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Meeting Modal Component
function AddMeetingModal({ onClose, onSave, selectedDate }: {
  onClose: () => void;
  onSave: (meeting: Omit<Meeting, 'id'>) => void;
  selectedDate: Date;
}) {
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    room: 'Room A' as "Room A" | "Room B",
    date: selectedDate.toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    attendees: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const meeting: Omit<Meeting, 'id'> = {
      title: formData.title,
      organizer: formData.organizer,
      room: formData.room,
      start: `${formData.date}T${formData.startTime}:00`,
      end: `${formData.date}T${formData.endTime}:00`,
      description: formData.description,
      attendees: formData.attendees ? formData.attendees.split(',').map(s => s.trim()) : []
    };

    onSave(meeting);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add New Meeting</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organizer *</label>
            <input
              type="text"
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room *</label>
            <select
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value as "Room A" | "Room B" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
              required
            >
              <option value="Room A">Room A</option>
              <option value="Room B">Room B</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attendees (comma-separated emails)</label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a268] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#c7a268] text-white rounded-lg font-medium hover:bg-[#b8956a] transition-colors"
            >
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}