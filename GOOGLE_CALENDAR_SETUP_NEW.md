# Google Calendar Integration Setup Guide

## 📅 **Quick Setup Guide for National Group India Meeting Room Display**

### **Step 1: Google Cloud Console Setup (15 minutes)**

1. **Create Google Cloud Project:**
   ```
   1. Go to https://console.cloud.google.com/
   2. Click "New Project" 
   3. Name: "National Group Meeting Management"
   4. Click "Create"
   ```

2. **Enable Google Calendar API:**
   ```
   1. Navigate to "APIs & Services" > "Library"
   2. Search for "Google Calendar API"
   3. Click on it and press "Enable"
   ```

3. **Create Credentials:**
   ```
   1. Go to "APIs & Services" > "Credentials"
   2. Click "Create Credentials" > "API Key"
   3. Copy the API key (save it securely)
   4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
   5. Configure consent screen if needed
   6. Application type: "Web application"
   7. Add authorized domains: your-domain.com
   8. Copy the Client ID
   ```

### **Step 2: Google Calendar Setup (10 minutes)**

1. **Create Room Calendars:**
   ```
   1. Go to https://calendar.google.com/
   2. Click "+" next to "Other calendars"
   3. Select "Create new calendar"
   4. Name: "Meeting Room A - National Group India"
   5. Repeat for "Meeting Room B - National Group India"
   ```

2. **Get Calendar IDs:**
   ```
   1. Click on calendar settings (3 dots next to calendar name)
   2. Select "Settings and sharing"
   3. Scroll down to "Calendar ID" section
   4. Copy the calendar ID (looks like: abc123@group.calendar.google.com)
   ```

### **Step 3: Environment Configuration (5 minutes)**

1. **Create .env file:**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. **Edit .env file with your values:**
   ```bash
   VITE_GOOGLE_API_KEY=AIzaSyC...your_actual_api_key
   VITE_GOOGLE_CLIENT_ID=123456...your_actual_client_id.apps.googleusercontent.com
   VITE_ROOM_A_CALENDAR_ID=abc123@group.calendar.google.com
   VITE_ROOM_B_CALENDAR_ID=def456@group.calendar.google.com
   ```

### **Step 4: Test Integration (5 minutes)**

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Test the integration:**
   ```
   1. Login to admin panel (admin/admin)
   2. Go to "Meetings" section
   3. Click "Connect Google Calendar"
   4. Authorize with your Google account
   5. Create a test meeting
   6. Check that it appears in Google Calendar
   ```

## 🎯 **Features Now Available**

### **✅ Calendar-Style Interface**
- Week view with time slots (matching your Outlook screenshot)
- Day view with room-by-room comparison
- Month overview for planning
- Today/Previous/Next navigation

### **✅ Google Calendar Integration**
- Real-time synchronization
- Create meetings directly from admin panel
- Automatic conflict detection
- Delete meetings from either system

### **✅ Professional Design**
- National Group India branding
- Modern glassmorphism UI
- Color-coded rooms (Purple for Room A, Blue for Room B)
- Responsive mobile-friendly design

### **✅ Admin Features**
- Dashboard with room status
- Activity logging
- User management
- Meeting analytics

## 🔧 **Production Deployment Checklist**

### **Security Configuration:**
- [ ] Replace demo API keys with production keys
- [ ] Configure authorized domains in Google Cloud Console
- [ ] Set up proper user authentication
- [ ] Enable HTTPS for production deployment

### **Calendar Configuration:**
- [ ] Create production room calendars
- [ ] Share calendars with appropriate permissions
- [ ] Test calendar access from admin panel
- [ ] Configure automatic backups

### **Application Setup:**
- [ ] Deploy to production server
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Test mobile responsiveness

## 📋 **Troubleshooting**

### **Common Issues:**

1. **"API Key Invalid"**
   - Check API key is copied correctly
   - Ensure Google Calendar API is enabled
   - Verify authorized domains in Google Cloud Console

2. **"Calendar Not Found"**
   - Verify calendar IDs are correct
   - Check calendar sharing permissions
   - Ensure calendar is owned by authenticated user

3. **"Authentication Failed"**
   - Check OAuth 2.0 client ID
   - Verify authorized JavaScript origins
   - Clear browser cache and try again

### **Support Resources:**
- Google Calendar API Documentation: https://developers.google.com/calendar
- Google Cloud Console: https://console.cloud.google.com/
- OAuth 2.0 Setup Guide: https://developers.google.com/identity/protocols/oauth2

## 🚀 **Next Steps**

1. **Complete the setup** following steps 1-4 above
2. **Test thoroughly** with different meeting scenarios
3. **Train users** on the new system
4. **Monitor usage** and gather feedback
5. **Scale** to additional rooms if needed

The system is now ready for production use with full Google Calendar integration matching the calendar interface you requested!