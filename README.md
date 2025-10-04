# 🏢 National Group India - Meeting Management System

A modern, professional meeting room management system with Google Calendar integration for National Group India.

![Meeting Management System](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue)
![Vite](https://img.shields.io/badge/Vite-4.5.14-purple)

## ✨ Features

### 🎯 **Meeting Management**
- **Calendar-style Interface** - Week, Day, and Month views
- **Real-time Room Status** - Live availability tracking
- **Professional Design** - Modern glassmorphism UI with National Group branding
- **Color-coded Rooms** - Purple for Room A, Blue for Room B
- **Interactive Scheduling** - Click-to-create, drag-to-reschedule

### 📅 **Google Calendar Integration**
- **Real-time Synchronization** - Bi-directional sync with Google Calendar
- **OAuth 2.0 Authentication** - Secure Google account integration
- **Automatic Conflict Detection** - Prevents double-booking
- **Room-specific Calendars** - Dedicated calendars for each meeting room
- **Cross-platform Access** - Manage from any device with Google Calendar

### 👨‍💼 **Admin Features**
- **Dashboard Analytics** - Meeting statistics and room utilization
- **User Management** - Role-based access control
- **Activity Logging** - Complete audit trail
- **Meeting Analytics** - Usage reports and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Cloud Console account (for calendar integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/national-group-meeting-management.git
   cd national-group-meeting-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Google Calendar credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## ⚙️ Google Calendar Setup

### 1. Google Cloud Console Configuration

1. **Create a new project** at [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it
3. **Create credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Create API Key
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized origins: `http://localhost:3000`

### 2. Environment Variables

Update your `.env` file:
```bash
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
VITE_ROOM_A_CALENDAR_ID=room-a@your-domain.com
VITE_ROOM_B_CALENDAR_ID=room-b@your-domain.com
```

### 3. Room Calendar Setup

1. Create dedicated Google Calendars for each room
2. Share calendars with appropriate permissions
3. Copy calendar IDs to environment variables

## 🎮 Usage

### Admin Panel Access
- **URL**: Click "Admin Panel" on main display
- **Demo Credentials**:
  - Admin: `admin / admin`
  - Manager: `manager / manager`
  - User: `user / user`

### Meeting Management
1. **Navigate** to "Meetings" section
2. **Connect** Google Calendar (first time)
3. **Create meetings** using "+ New Meeting" button
4. **View schedules** in Week/Day/Month views
5. **Manage bookings** with click-to-edit interface

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Calendar**: Google Calendar API
- **Authentication**: Google OAuth 2.0

### Project Structure
```
src/
├── AdminPage.tsx              # Main admin interface
├── MeetingCalendarView.tsx    # Calendar-style meeting view
├── GoogleCalendarIntegration.tsx # Google Calendar API integration
├── GoogleCalendarService.ts   # Calendar service functions
├── useGoogleCalendar.ts      # React hook for calendar operations
└── SmartMeetDisplay.tsx      # Public meeting display
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Components
- **AdminPage**: Main administrative interface with sidebar navigation
- **MeetingCalendarView**: Calendar-style meeting management
- **GoogleCalendarIntegration**: Handles Google Calendar API integration
- **SmartMeetDisplay**: Public-facing meeting room display

## 📱 Responsive Design

- **Desktop**: Full-featured admin interface
- **Tablet**: Touch-optimized meeting management
- **Mobile**: Quick booking and status checking

## 🔒 Security Features

- **Environment Variables**: Secure API key storage
- **OAuth 2.0**: Google authentication
- **Activity Logging**: Complete audit trail
- **Role-based Access**: Admin, manager, and user roles
- **CORS Protection**: Domain-restricted API access

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Configure production Google Calendar credentials
- Set up SSL certificates for HTTPS
- Configure domain authorization in Google Cloud Console

### Recommended Hosting
- **Vercel**: Zero-configuration deployment
- **Netlify**: Git-based deployment
- **Azure Static Web Apps**: Enterprise hosting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- **Documentation**: See setup guides in `/docs`
- **Issues**: Create an issue on GitHub
- **Email**: support@nationalgroup.com

## 🙏 Acknowledgments

- **National Group India** - Project requirements and design guidelines
- **Google Calendar API** - Calendar integration capabilities
- **React Community** - Framework and ecosystem
- **Tailwind CSS** - Styling framework

---

**Built with ❤️ for National Group India**