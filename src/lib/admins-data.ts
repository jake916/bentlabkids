export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Content Admin" | "Product Admin";
  accessScope: string;
  status: "Active" | "Disabled";
  lastLogin: string;
  avatarColorBg: string;
  avatarColorText: string;
  avatarInitials: string;
}

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: "ADM-001",
    name: "James Wilson",
    email: "james.w@bentlab.tv",
    role: "Super Admin",
    accessScope: "Global / Full Control",
    status: "Active",
    lastLogin: "2 mins ago",
    avatarColorBg: "bg-rose-100",
    avatarColorText: "text-rose-700",
    avatarInitials: "JW",
  },
  {
    id: "ADM-002",
    name: "Sarah Chen",
    email: "sarah.c@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Active",
    lastLogin: "1 hour ago",
    avatarColorBg: "bg-blue-100",
    avatarColorText: "text-blue-700",
    avatarInitials: "SC",
  },
  {
    id: "ADM-003",
    name: "Mark Rodriguez",
    email: "mark.r@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Active",
    lastLogin: "Yesterday, 4:12 PM",
    avatarColorBg: "bg-emerald-100",
    avatarColorText: "text-emerald-700",
    avatarInitials: "MR",
  },
  {
    id: "ADM-004",
    name: "Emily Blunt",
    email: "emily.b@bentlab.tv",
    role: "Product Admin",
    accessScope: "Store, Subscription tiers",
    status: "Disabled",
    lastLogin: "Oct 24, 2023",
    avatarColorBg: "bg-amber-100",
    avatarColorText: "text-amber-700",
    avatarInitials: "EB",
  },
  // Add 20 more mock admin records to reach 24
  {
    id: "ADM-005",
    name: "Aisha Bello",
    email: "aisha.b@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Active",
    lastLogin: "3 hours ago",
    avatarColorBg: "bg-indigo-100",
    avatarColorText: "text-indigo-700",
    avatarInitials: "AB",
  },
  {
    id: "ADM-006",
    name: "Chinedu Okafor",
    email: "chinedu.o@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Active",
    lastLogin: "2 days ago",
    avatarColorBg: "bg-purple-100",
    avatarColorText: "text-purple-700",
    avatarInitials: "CO",
  },
  {
    id: "ADM-007",
    name: "David Smith",
    email: "david.s@bentlab.tv",
    role: "Product Admin",
    accessScope: "Store, Subscription tiers",
    status: "Active",
    lastLogin: "10 mins ago",
    avatarColorBg: "bg-pink-100",
    avatarColorText: "text-pink-700",
    avatarInitials: "DS",
  },
  {
    id: "ADM-008",
    name: "Grace Adebayo",
    email: "grace.a@bentlab.tv",
    role: "Super Admin",
    accessScope: "Global / Full Control",
    status: "Active",
    lastLogin: "Just now",
    avatarColorBg: "bg-teal-100",
    avatarColorText: "text-teal-700",
    avatarInitials: "GA",
  },
  {
    id: "ADM-009",
    name: "Michael Peterson",
    email: "michael.p@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Disabled",
    lastLogin: "Sep 12, 2025",
    avatarColorBg: "bg-cyan-100",
    avatarColorText: "text-cyan-700",
    avatarInitials: "MP",
  },
  {
    id: "ADM-010",
    name: "Kemi Balogun",
    email: "kemi.b@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Active",
    lastLogin: "5 hours ago",
    avatarColorBg: "bg-orange-100",
    avatarColorText: "text-orange-700",
    avatarInitials: "KB",
  },
  {
    id: "ADM-011",
    name: "Thomas Wright",
    email: "thomas.w@bentlab.tv",
    role: "Product Admin",
    accessScope: "Store, Subscription tiers",
    status: "Active",
    lastLogin: "3 days ago",
    avatarColorBg: "bg-lime-100",
    avatarColorText: "text-lime-700",
    avatarInitials: "TW",
  },
  {
    id: "ADM-012",
    name: "Sophia Martinez",
    email: "sophia.m@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Active",
    lastLogin: "Yesterday, 11:30 AM",
    avatarColorBg: "bg-fuchsia-100",
    avatarColorText: "text-fuchsia-700",
    avatarInitials: "SM",
  },
  {
    id: "ADM-013",
    name: "Yusuf Ibrahim",
    email: "yusuf.i@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Active",
    lastLogin: "4 hours ago",
    avatarColorBg: "bg-violet-100",
    avatarColorText: "text-violet-700",
    avatarInitials: "YI",
  },
  {
    id: "ADM-014",
    name: "Daniel Green",
    email: "daniel.g@bentlab.tv",
    role: "Product Admin",
    accessScope: "Store, Subscription tiers",
    status: "Disabled",
    lastLogin: "Nov 01, 2025",
    avatarColorBg: "bg-emerald-100",
    avatarColorText: "text-emerald-700",
    avatarInitials: "DG",
  },
  {
    id: "ADM-015",
    name: "Olivia Taylor",
    email: "olivia.t@bentlab.tv",
    role: "Super Admin",
    accessScope: "Global / Full Control",
    status: "Active",
    lastLogin: "15 mins ago",
    avatarColorBg: "bg-rose-100",
    avatarColorText: "text-rose-700",
    avatarInitials: "OT",
  },
  {
    id: "ADM-016",
    name: "Olumide Johnson",
    email: "olumide.j@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Active",
    lastLogin: "5 days ago",
    avatarColorBg: "bg-sky-100",
    avatarColorText: "text-sky-700",
    avatarInitials: "OJ",
  },
  {
    id: "ADM-017",
    name: "Liam Walker",
    email: "liam.w@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Active",
    lastLogin: "Yesterday, 9:15 AM",
    avatarColorBg: "bg-amber-100",
    avatarColorText: "text-amber-700",
    avatarInitials: "LW",
  },
  {
    id: "ADM-018",
    name: "Isabella Davis",
    email: "isabella.d@bentlab.tv",
    role: "Product Admin",
    accessScope: "Store, Subscription tiers",
    status: "Active",
    lastLogin: "1 hour ago",
    avatarColorBg: "bg-blue-100",
    avatarColorText: "text-blue-700",
    avatarInitials: "ID",
  },
  {
    id: "ADM-019",
    name: "Ngozi Eke",
    email: "ngozi.e@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Active",
    lastLogin: "3 days ago",
    avatarColorBg: "bg-rose-100",
    avatarColorText: "text-rose-700",
    avatarInitials: "NE",
  },
  {
    id: "ADM-020",
    name: "Ethan Clark",
    email: "ethan.c@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Disabled",
    lastLogin: "Oct 12, 2025",
    avatarColorBg: "bg-zinc-200",
    avatarColorText: "text-zinc-700",
    avatarInitials: "EC",
  },
  {
    id: "ADM-021",
    name: "Mia Hall",
    email: "mia.h@bentlab.tv",
    role: "Product Admin",
    accessScope: "Store, Subscription tiers",
    status: "Active",
    lastLogin: "6 days ago",
    avatarColorBg: "bg-indigo-100",
    avatarColorText: "text-indigo-700",
    avatarInitials: "MH",
  },
  {
    id: "ADM-022",
    name: "Lucas Allen",
    email: "lucas.a@bentlab.tv",
    role: "Content Admin",
    accessScope: "Video Library, Playlists",
    status: "Active",
    lastLogin: "Yesterday, 3:00 PM",
    avatarColorBg: "bg-violet-100",
    avatarColorText: "text-violet-700",
    avatarInitials: "LA",
  },
  {
    id: "ADM-023",
    name: "Charlotte King",
    email: "charlotte.k@bentlab.tv",
    role: "Super Admin",
    accessScope: "Global / Full Control",
    status: "Active",
    lastLogin: "25 mins ago",
    avatarColorBg: "bg-rose-100",
    avatarColorText: "text-rose-700",
    avatarInitials: "CK",
  },
  {
    id: "ADM-024",
    name: "Zainab Sani",
    email: "zainab.s@bentlab.tv",
    role: "Admin",
    accessScope: "User Management, CMS",
    status: "Active",
    lastLogin: "1 week ago",
    avatarColorBg: "bg-teal-100",
    avatarColorText: "text-teal-700",
    avatarInitials: "ZS",
  },
];

const LOCAL_STORAGE_KEY = "bentlab_admins_list_state";

export function getStoredAdmins(): AdminUser[] {
  if (typeof window === "undefined") return INITIAL_ADMINS;
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (val) {
      return JSON.parse(val);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_ADMINS));
      return INITIAL_ADMINS;
    }
  } catch (e) {
    console.error("Failed to read admins list from localStorage", e);
  }
  return INITIAL_ADMINS;
}

export function saveStoredAdmins(admins: AdminUser[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(admins));
  } catch (e) {
    console.error("Failed to save admins list to localStorage", e);
  }
}
