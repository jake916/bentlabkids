export interface ChatMessage {
  id: string;
  sender: "client" | "admin";
  text: string;
  time: string;
  avatarInitials?: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  title: string;
  snippet: string;
  status: "Open" | "In Progress" | "Resolved";
  priority: "High" | "Medium" | "Low";
  timeAgo: string;
  unread: boolean;
  avatarColorBg: string;
  avatarColorText: string;
  avatarInitials: string;
  messages: ChatMessage[];
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "1",
    customerName: "Marcus Chen",
    customerEmail: "marcus.chen@example.com",
    title: "Login issue on Mobile App",
    snippet: "I've been trying to log in for the past hour and keep getting a 403 error. Can you help?",
    status: "Open",
    priority: "High",
    timeAgo: "2m ago",
    unread: true,
    avatarColorBg: "bg-[#FFF0F2]",
    avatarColorText: "text-[#B31046]",
    avatarInitials: "MC",
    messages: [
      {
        id: "m1_1",
        sender: "client",
        text: "Hi support team, I'm encountering a consistent 403 Forbidden error whenever I try to log in via the mobile app. My credentials work fine on the desktop version though. I've already tried clearing the app cache but it didn't help.",
        time: "10:42 AM",
      },
      {
        id: "m1_2",
        sender: "admin",
        text: "Hello Marcus! Sorry for the trouble. I'm looking into this right now. Could you please let me know which version of the app you are currently running? Also, are you on iOS or Android?",
        time: "10:45 AM",
      },
      {
        id: "m1_3",
        sender: "client",
        text: "I'm on Android 13, app version 2.4.1. I just updated it this morning.",
        time: "10:47 AM",
      },
    ],
  },
  {
    id: "2",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@example.com",
    title: "Billing cycle question",
    snippet: "I was charged twice this month. Please investigate the double transaction on card...",
    status: "In Progress",
    priority: "Medium",
    timeAgo: "15m ago",
    unread: false,
    avatarColorBg: "bg-blue-50",
    avatarColorText: "text-blue-600",
    avatarInitials: "SJ",
    messages: [
      {
        id: "m2_1",
        sender: "client",
        text: "I was charged twice this month. Please investigate the double transaction on card. One charge was on the 10th and another on the 12th.",
        time: "09:30 AM",
      },
      {
        id: "m2_2",
        sender: "admin",
        text: "Hello Sarah, let me check your invoice history right now. Could you please verify the last 4 digits of your active card?",
        time: "09:35 AM",
      },
    ],
  },
  {
    id: "3",
    customerName: "Alex Rivera",
    customerEmail: "alex.rivera@example.com",
    title: "New Feature Request",
    snippet: "It would be great if we could export the analytics data directly to Google Sheets.",
    status: "Resolved",
    priority: "Low",
    timeAgo: "1h ago",
    unread: false,
    avatarColorBg: "bg-zinc-100",
    avatarColorText: "text-zinc-600",
    avatarInitials: "AR",
    messages: [
      {
        id: "m3_1",
        sender: "client",
        text: "It would be great if we could export the analytics data directly to Google Sheets.",
        time: "Yesterday, 3:15 PM",
      },
      {
        id: "m3_2",
        sender: "admin",
        text: "Thanks for the feedback Alex! We have added this suggestion to our product roadmap and marked this ticket as resolved for now.",
        time: "Yesterday, 4:00 PM",
      },
    ],
  },
  {
    id: "4",
    customerName: "Elena Thorne",
    customerEmail: "elena.t@example.com",
    title: "Dashboard rendering slowly",
    snippet: "Ever since the last update, the main charts take forever to load. Is this a known issue?",
    status: "Open",
    priority: "Low",
    timeAgo: "3h ago",
    unread: false,
    avatarColorBg: "bg-emerald-50",
    avatarColorText: "text-emerald-700",
    avatarInitials: "ET",
    messages: [
      {
        id: "m4_1",
        sender: "client",
        text: "Ever since the last update, the main charts take forever to load. Is this a known issue?",
        time: "07:10 AM",
      },
      {
        id: "m4_2",
        sender: "admin",
        text: "Hi Elena, we are currently optimizing our dashboard query response times. This should be fixed in the upcoming patch.",
        time: "07:22 AM",
      },
    ],
  },
];

export function getStoredTickets(): SupportTicket[] {
  if (typeof window === "undefined") return INITIAL_TICKETS;
  try {
    const data = localStorage.getItem("bentlab_support_tickets");
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading support tickets", e);
  }
  return INITIAL_TICKETS;
}

export function saveStoredTickets(tickets: SupportTicket[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("bentlab_support_tickets", JSON.stringify(tickets));
  } catch (e) {
    console.error("Error saving support tickets", e);
  }
}
