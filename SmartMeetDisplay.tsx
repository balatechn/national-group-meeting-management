import {useEffect, useMemo, useState} from "react";
import AdminPage from "./src/AdminPage";
import landingVideo from "./src/landing.mp4";

// SmartMeet Display – Vertical signage layout for two adjacent rooms
// Notes:
// - Replace MOCK_MEETINGS with your API data (Google/Zoho/ICS)
// - Set videoSrc to your brand/promotional MP4 (landscape-friendly)
// - Runs in kiosk-style full screen (h-screen w-screen)

// ---------------- Mock Data ----------------

type Meeting = {
  id: string;
  room: "Room A" | "Room B";
  title: string;
  organizer: string;
  start: string; // ISO
  end: string;   // ISO
};

// Create a simple day schedule; ensure proper spacing and no overlaps
const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = (h: number, m: number) =>
  `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(h)}:${pad(m)}:00`;
const tomorrowISO = (h: number, m: number) => {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T${pad(h)}:${pad(m)}:00`;
};

const MOCK_MEETINGS: Meeting[] = [
  // Today's meetings - Room A
  {
    id: "1",
    room: "Room A",
    title: "Morning Standup",
    organizer: "Nirup",
    start: todayISO(9, 0),
    end: todayISO(9, 30),
  },
  {
    id: "2",
    room: "Room A",
    title: "Design Review",
    organizer: "Priya",
    start: todayISO(11, 0),
    end: todayISO(12, 0),
  },
  {
    id: "3",
    room: "Room A",
    title: "Client Presentation",
    organizer: "Raj",
    start: todayISO(14, 0),
    end: todayISO(15, 30),
  },
  // Today's meetings - Room B
  {
    id: "4",
    room: "Room B",
    title: "Sales Review",
    organizer: "Karthik",
    start: todayISO(10, 0),
    end: todayISO(11, 0),
  },
  {
    id: "5",
    room: "Room B",
    title: "Team Training",
    organizer: "Meera",
    start: todayISO(13, 0),
    end: todayISO(14, 0),
  },
  {
    id: "6",
    room: "Room B",
    title: "Project Planning",
    organizer: "Arun",
    start: todayISO(16, 0),
    end: todayISO(17, 0),
  },
  // Tomorrow's meetings - Room A
  {
    id: "7",
    room: "Room A",
    title: "Board Meeting",
    organizer: "CEO",
    start: tomorrowISO(10, 0),
    end: tomorrowISO(12, 0),
  },
  {
    id: "8",
    room: "Room A",
    title: "Technical Discussion",
    organizer: "Tech Lead",
    start: tomorrowISO(14, 0),
    end: tomorrowISO(15, 0),
  },
  // Tomorrow's meetings - Room B
  {
    id: "9",
    room: "Room B",
    title: "Client Call - Montra",
    organizer: "Chris",
    start: tomorrowISO(11, 0),
    end: tomorrowISO(12, 0),
  },
  {
    id: "10",
    room: "Room B",
    title: "Weekly Review",
    organizer: "Manager",
    start: tomorrowISO(15, 0),
    end: tomorrowISO(16, 0),
  },
];

// ---------------- Utilities ----------------

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

const parseISO = (s: string) => new Date(s);

const within = (t: Date, a: Date, b: Date) => t >= a && t <= b;

const bySoonestStart = (a: Meeting, b: Meeting) => +parseISO(a.start) - +parseISO(b.start);

// ---------------- Component ----------------

export default function SmartMeetDisplay() {
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [tick, setTick] = useState(0);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Auto-refresh clock/schedule every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh page every 10 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Handle admin mode toggle with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setIsAdminMode(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const now = useMemo(() => new Date(), [tick]);

  // Show admin page if in admin mode
  if (isAdminMode) {
    return (
      <AdminPage
        meetings={meetings}
        onUpdateMeetings={setMeetings}
        onBackToDisplay={() => setIsAdminMode(false)}
      />
    );
  }

  // Derive per-room status
  const rooms = ["Room A", "Room B"] as const;
  type Room = (typeof rooms)[number];

  const roomNow = (room: Room) =>
    meetings.find((m) => m.room === room && within(now, parseISO(m.start), parseISO(m.end)));

  const roomNext = (room: Room) =>
    meetings
      .filter((m) => m.room === room && parseISO(m.start) > now)
      .sort(bySoonestStart)[0];

  const busyRoom: Room | null = rooms.find((r) => !!roomNow(r)) ?? null;

  // Arrow direction: if Room A is busy -> left, if Room B -> right, else pulse both
  const arrowDirection: "left" | "right" | "both" = busyRoom === "Room A" ? "left" : busyRoom === "Room B" ? "right" : "both";

  // ---------------- Theming ----------------
  // Off‑white base with subtle gold accent and glass cards

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#faf7f1] to-[#f1efe9] text-[#1a1a1a] relative overflow-hidden flex flex-col">
      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0" style={{boxShadow: "inset 0 0 240px rgba(0,0,0,0.08)"}} />

      {/* Header: Logo + Clock - Fixed height for 21.5" vertical display */}
      <header className="flex-shrink-0 h-20 flex items-center justify-between px-8 z-20 bg-white/20 backdrop-blur border-b border-white/30">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src="c:\Users\Admin\OneDrive\Pictures\national-logo.png.png" 
              alt="National Group India Logo"
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback to colored rectangle if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div className="logo-fallback h-12 w-12 rounded-2xl bg-[#c7a268] hidden" />
          </div>
          <div className="text-3xl font-bold tracking-wide text-[#1a1a1a]">National Group India</div>
        </div>
        <div className="flex items-center gap-4">
          <Clock now={now} />
          <button
            onClick={() => setIsAdminMode(true)}
            className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur border border-white/40 shadow-sm text-sm font-medium hover:bg-white/80 transition-colors"
          >
            Admin
          </button>
        </div>
      </header>

      {/* Three-section vertical layout optimized for 21.5" vertical display */}
      <div className="flex-1 flex flex-col p-8 gap-8 min-h-0">
        
        {/* TOP SECTION - ROOM A (35% of available height) */}
        <div className="flex-[35] min-h-0">
          <RoomSection 
            room="Room A" 
            meeting={roomNow("Room A")} 
            nextMeeting={roomNext("Room A")}
            position="top"
          />
        </div>

        {/* CENTER SECTION - VIDEO/SLIDESHOW (30% of available height) */}
        <div className="flex-[30] min-h-0">
          <VideoSection />
        </div>

        {/* BOTTOM SECTION - ROOM B (35% of available height) */}
        <div className="flex-[35] min-h-0">
          <RoomSection 
            room="Room B" 
            meeting={roomNow("Room B")} 
            nextMeeting={roomNext("Room B")}
            position="bottom"
          />
        </div>

      </div>

      {/* Direction indicators overlay with gold gradient */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <DirectionIndicator direction={arrowDirection} busyRoom={busyRoom} />
      </div>
    </div>
  );
}

// ---------------- New Horizontal Layout Components ----------------

function Clock({now}: {now: Date}) {
  useEffect(() => {
    const id = setInterval(() => {}, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="px-6 py-3 rounded-xl bg-white/70 backdrop-blur border border-white/50 shadow-sm">
      <div className="text-lg font-bold tracking-wide text-[#1a1a1a]">
        {now.toLocaleDateString(undefined, {weekday: "short", month: "short", day: "2-digit"})}
        {" • "}
        {now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
      </div>
    </div>
  );
}

function Pill({label, variant = "neutral"}: {label: string; variant?: "free" | "busy" | "neutral"}) {
  const map = {
    free: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40 shadow-emerald-500/20",
    busy: "bg-rose-500/20 text-rose-700 border-rose-500/40 shadow-rose-500/20",
    neutral: "bg-black/10 text-black/70 border-black/20",
  } as const;
  return (
    <span className={`px-4 py-2 rounded-full text-base font-bold border shadow-lg ${map[variant]}`}>
      {label}
    </span>
  );
}

function VideoSection() {
  return (
    <div className="h-full rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] ring-1 ring-black/5 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient background if video fails to load
            e.currentTarget.style.display = 'none';
          }}
        >
          <source src={landingVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Content Overlay - Optimized for 21.5" center section */}
      <div className="absolute inset-0 flex flex-col text-white p-8">
        {/* Top Section - Company Branding */}
        <div className="text-center flex-shrink-0 mb-6">
          <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur border border-white/30 mx-auto mb-4 flex items-center justify-center relative">
            <img 
              src="c:\Users\Admin\OneDrive\Pictures\national-logo.png.png" 
              alt="National Group India Logo"
              className="h-20 w-auto filter brightness-0 invert"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.center-logo-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div className="center-logo-fallback h-12 w-12 rounded-xl bg-[#c7a268] hidden" />
          </div>
          <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">National Group India</h1>
          <p className="text-2xl opacity-90 mb-2 drop-shadow-md">Pioneering Infrastructure. Transforming Communities.</p>
          <p className="text-xl opacity-75 drop-shadow-md">Since 1949 • 200+ Landmark Projects</p>
        </div>

        {/* Middle Section - Company Message */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center max-w-5xl">
            <div className="mb-8">
              <h2 className="text-6xl font-bold mb-6 drop-shadow-lg leading-tight">
                Building Tomorrow's India
              </h2>
              <p className="text-3xl opacity-90 mb-6 drop-shadow-md">
                Excellence in Every Foundation
              </p>
              <p className="text-2xl opacity-80 leading-relaxed drop-shadow-sm">
                From infrastructure to innovation, we've been shaping India's landscape for over seven decades.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Company Stats */}
        <div className="grid grid-cols-4 gap-6 flex-shrink-0">
          <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
            <div className="text-4xl font-bold mb-3 drop-shadow-md">73+</div>
            <div className="text-lg opacity-75">Years</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
            <div className="text-4xl font-bold mb-3 drop-shadow-md">200+</div>
            <div className="text-lg opacity-75">Projects</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
            <div className="text-4xl font-bold mb-3 drop-shadow-md">4</div>
            <div className="text-lg opacity-75">Verticals</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
            <div className="text-4xl font-bold mb-3 drop-shadow-md">1000+</div>
            <div className="text-lg opacity-75">Team</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomSection({room, meeting, nextMeeting, position}: {room: string; meeting?: Meeting; nextMeeting?: Meeting; position: "top" | "bottom"}) {
  const isBusy = !!meeting;
  
  return (
    <div className="h-full rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col">
      {/* Room Header - Optimized for 21.5" vertical display */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
            room === "Room A" ? "bg-gradient-to-br from-purple-500 to-purple-600" : "bg-gradient-to-br from-blue-500 to-blue-600"
          }`}>
            <span className="text-white text-2xl font-bold">{room.slice(-1)}</span>
          </div>
          <div className="text-4xl font-bold tracking-wide text-[#1a1a1a]">{room}</div>
        </div>
        <div className="flex-shrink-0">
          <Pill label={isBusy ? "Busy" : "Free"} variant={isBusy ? "busy" : "free"} />
        </div>
      </div>

      {/* Meeting Content - Optimized spacing */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {/* Current Meeting Card */}
        <div className="flex-1 rounded-2xl p-6 bg-white/80 border border-white/60 flex flex-col">
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="h-4 w-4 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xl font-bold text-black/70 uppercase tracking-wide">NOW</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {meeting ? (
              <div className="text-center">
                <div className="text-3xl font-bold mb-3 text-[#1a1a1a]">{meeting.title}</div>
                <div className="text-xl text-black/70 mb-3">Organizer: {meeting.organizer}</div>
                <div className="text-lg text-black/60 font-medium">
                  {fmtTime(parseISO(meeting.start))} – {fmtTime(parseISO(meeting.end))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">Room Available</div>
                <div className="text-xl text-black/50">No current meeting</div>
              </div>
            )}
          </div>
        </div>

        {/* Next Meeting Card */}
        <div className="flex-1 rounded-2xl p-6 bg-white/60 border border-white/40 flex flex-col">
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="h-4 w-4 rounded-full bg-blue-500" />
            <span className="text-xl font-bold text-black/70 uppercase tracking-wide">NEXT</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {nextMeeting ? (
              <div className="text-center">
                <div className="text-2xl font-semibold mb-3 text-[#1a1a1a]">{nextMeeting.title}</div>
                <div className="text-lg text-black/70 mb-3">Organizer: {nextMeeting.organizer}</div>
                <div className="text-base text-black/60 font-medium">
                  {fmtTime(parseISO(nextMeeting.start))} – {fmtTime(parseISO(nextMeeting.end))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-semibold text-black/50 mb-2">No upcoming meetings</div>
                <div className="text-lg text-black/40">Schedule available</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Direction Indicator - Fixed position */}
      {isBusy && (
        <div className="mt-6 pt-4 border-t border-white/40 flex-shrink-0">
          <div className="flex items-center justify-center gap-4">
            <div className={`h-12 w-12 rounded-xl bg-[#c7a268] grid place-items-center animate-pulse shadow-lg`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 text-white">
                <path d="M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                <path d={position === "top" ? "M10 7l-5 5 5 5" : "M14 17l5-5-5-5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-[#c7a268]">Room in Use</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectionIndicator({direction, busyRoom}: {direction: "left" | "right" | "both"; busyRoom: "Room A" | "Room B" | null}) {
  if (!busyRoom) return null;
  
  const isLeftDirection = direction === "left" || (direction === "both" && busyRoom === "Room A");
  
  return (
    <div className="rounded-2xl p-4 bg-gradient-to-r from-[#d4af37] via-[#c7a268] to-[#b8956a] shadow-2xl border border-yellow-400/30">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-300 to-yellow-600 grid place-items-center animate-pulse shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 text-white drop-shadow-md">
            <path d="M5 12h14" strokeWidth="2.5" strokeLinecap="round"/>
            <path d={isLeftDirection ? "M10 7l-5 5 5 5" : "M14 17l5-5-5-5"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-white">
          <div className="text-sm uppercase tracking-wider font-bold opacity-90 drop-shadow-sm">Active Room</div>
          <div className="text-lg font-bold drop-shadow-md">
            {isLeftDirection ? "← Room A in Use" : "Room B in Use →"}
          </div>
        </div>
      </div>
    </div>
  );
}