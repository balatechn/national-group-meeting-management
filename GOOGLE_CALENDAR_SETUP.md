# Google Calendar Integration Setup Guide

## 📅 **Google Calendar Integration Options for National Group India Meeting Room Display**

### **Option 1: Full Google Calendar API Integration (Recommended)**

#### **🔧 Setup Steps:**

1. **Google Cloud Console Setup:**
   ```bash
   # Go to Google Cloud Console
   https://console.cloud.google.com/
   
   # Create a new project or select existing one
   # Enable Google Calendar API
   # Create credentials (API Key + OAuth 2.0 Client ID)
   ```

2. **Environment Configuration:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file with your credentials:
   VITE_GOOGLE_API_KEY=your_actual_api_key
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id
   VITE_ROOM_A_CALENDAR_ID=room-a@your-domain.com
   VITE_ROOM_B_CALENDAR_ID=room-b@your-domain.com
   ```

3. **Install Required Dependencies:**
   ```bash
   npm install @types/gapi @types/gapi.auth2
   ```

4. **Calendar Setup:**
   - Create dedicated Google Calendars for Room A and Room B
   - Share calendars with appropriate permissions
   - Use calendar IDs in environment variables

#### **🚀 Features:**
- ✅ Real-time calendar synchronization
- ✅ Create meetings directly from admin panel
- ✅ Delete meetings with calendar sync
- ✅ Room availability checking
- ✅ Attendee management
- ✅ Automatic refresh every 5 minutes
- ✅ Google authentication integration

---

### **Option 2: Calendar Webhook Integration (Alternative)**

#### **🔄 Webhook Setup:**
```typescript
// Webhook endpoint for calendar updates
app.post('/api/calendar/webhook', (req, res) => {
  // Handle calendar change notifications
  const calendarEvent = req.body;
  
  // Update local meeting data
  updateMeetingDisplay(calendarEvent);
  
  res.status(200).send('OK');
});
```

---

### **Option 3: ICS Feed Integration (Simple)**

#### **📥 ICS Feed Reader:**
```typescript
// Simple ICS calendar feed reader
async function fetchICSFeed(url: string) {
  const response = await fetch(url);
  const icsData = await response.text();
  
  // Parse ICS data to meetings
  return parseICSToMeetings(icsData);
}
```

---

### **Option 4: Manual Calendar Sync (Basic)**

#### **📋 CSV/Excel Import:**
```typescript
// Manual calendar data import
const importCalendarData = (csvData: string) => {
  const meetings = parseCSVToMeetings(csvData);
  updateMeetings(meetings);
};
```

---

## **🎯 Recommended Implementation Steps:**

### **Phase 1: Quick Setup (1-2 hours)**
1. Set up Google Cloud Console project
2. Configure environment variables
3. Test basic calendar connection
4. Implement read-only calendar display

### **Phase 2: Full Integration (3-4 hours)**
1. Add Google authentication
2. Implement meeting creation/deletion
3. Add room availability checking
4. Test with real calendar data

### **Phase 3: Advanced Features (2-3 hours)**
1. Add recurring meeting support
2. Implement meeting notifications
3. Add calendar conflict resolution
4. Mobile-responsive booking interface

---

## **🔐 Security Considerations:**

### **API Key Security:**
- Store API keys in environment variables
- Use OAuth 2.0 for user authentication
- Implement proper CORS policies
- Restrict API key usage to specific domains

### **Calendar Permissions:**
- Use service accounts for server-side access
- Implement read/write permissions carefully
- Log all calendar modifications
- Add audit trail for booking changes

---

## **📊 Integration Benefits:**

### **For National Group India:**
- ✅ **Centralized Booking**: All meeting rooms managed from one interface
- ✅ **Real-time Updates**: Calendar changes reflect immediately on displays
- ✅ **Conflict Prevention**: Automatic availability checking
- ✅ **Mobile Access**: Book rooms from phones/tablets
- ✅ **Reporting**: Meeting usage analytics and reports
- ✅ **Integration**: Works with existing Google Workspace

### **Technical Benefits:**
- ✅ **Scalable**: Easy to add more rooms/locations
- ✅ **Reliable**: Google's robust calendar infrastructure
- ✅ **Flexible**: Multiple booking interfaces possible
- ✅ **Maintainable**: Standard Google APIs and documentation

---

## **🚀 Getting Started:**

1. **Choose your integration option** (Full API recommended)
2. **Set up Google Cloud Console** with Calendar API
3. **Configure environment variables** in `.env` file
4. **Test with sample calendar data**
5. **Deploy to production** with real room calendars

---

## **💡 Additional Features to Consider:**

### **Enhanced Booking Features:**
- Recurring meeting templates
- Meeting room equipment status
- Catering/AV equipment booking
- Visitor management integration
- Mobile app for employees

### **Analytics & Reporting:**
- Room utilization reports
- Peak usage time analysis
- Booking pattern insights
- Cost allocation by department
- Meeting effectiveness metrics

### **Integrations:**
- Microsoft Teams/Zoom room links
- Door access control systems
- Digital signage outside rooms
- Employee directory integration
- Facilities management systems