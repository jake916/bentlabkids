export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string; // formatted date (e.g. "Apr 18, 2026") or "—"
  rawDateString?: string; // ISO date for sorting
  avatarColorBg: string; // Tailwind background class
  avatarColorText: string; // Tailwind text color class
  avatarInitials: string;
  customerSince: string; // Month/Year e.g., "Jan 2026"
  shippingAddress: string;
  insights: {
    accountAge: string;
    returnRate: string;
    avgScore: string;
    tier: "HIGH VALUE" | "STANDARD" | "NEW";
  };
}

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "CUST-001",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+234 802 345 6789",
    totalOrders: 5,
    totalSpend: 45000,
    lastOrderDate: "Apr 18, 2026",
    rawDateString: "2026-04-18T14:15:00Z",
    avatarColorBg: "bg-rose-100",
    avatarColorText: "text-rose-700",
    avatarInitials: "SJ",
    customerSince: "Jan 2026",
    shippingAddress: "15 Alexander Avenue, Ikoyi, Lagos State, Nigeria",
    insights: {
      accountAge: "4 months",
      returnRate: "0%",
      avgScore: "4.9/5",
      tier: "HIGH VALUE",
    },
  },
  {
    id: "CUST-002",
    name: "David Ade",
    email: "david.ade@web.com",
    phone: "+234 803 111 2222",
    totalOrders: 1,
    totalSpend: 5000,
    lastOrderDate: "Apr 15, 2026",
    rawDateString: "2026-04-15T10:00:00Z",
    avatarColorBg: "bg-blue-100",
    avatarColorText: "text-blue-700",
    avatarInitials: "DA",
    customerSince: "Mar 2026",
    shippingAddress: "12 Ring Road, Ibadan, Oyo State, Nigeria",
    insights: {
      accountAge: "2 months",
      returnRate: "0%",
      avgScore: "4.0/5",
      tier: "NEW",
    },
  },
  {
    id: "CUST-003",
    name: "Mary Okeke",
    email: "mary.o@hub.org",
    phone: "+234 701 999 8888",
    totalOrders: 12,
    totalSpend: 128500,
    lastOrderDate: "Apr 12, 2026",
    rawDateString: "2026-04-12T12:00:00Z",
    avatarColorBg: "bg-emerald-100",
    avatarColorText: "text-emerald-700",
    avatarInitials: "MO",
    customerSince: "Jun 2024",
    shippingAddress: "Avenue Mall, Wuse 2, Abuja, Nigeria",
    insights: {
      accountAge: "2 years",
      returnRate: "5%",
      avgScore: "4.8/5",
      tier: "HIGH VALUE",
    },
  },
  {
    id: "CUST-004",
    name: "Emeka Williams",
    email: "emeka.w@mail.com",
    phone: "+234 805 555 4444",
    totalOrders: 2,
    totalSpend: 18200,
    lastOrderDate: "Mar 28, 2026",
    rawDateString: "2026-03-28T15:30:00Z",
    avatarColorBg: "bg-purple-100",
    avatarColorText: "text-purple-700",
    avatarInitials: "EW",
    customerSince: "Oct 2025",
    shippingAddress: "56 New Haven, Enugu, Enugu State, Nigeria",
    insights: {
      accountAge: "8 months",
      returnRate: "0%",
      avgScore: "4.2/5",
      tier: "STANDARD",
    },
  },
  {
    id: "CUST-005",
    name: "Faith Bello",
    email: "faith.b@nurture.kids",
    phone: "+234 811 222 3333",
    totalOrders: 8,
    totalSpend: 62100,
    lastOrderDate: "Apr 10, 2026",
    rawDateString: "2026-04-10T09:15:00Z",
    avatarColorBg: "bg-pink-100",
    avatarColorText: "text-pink-700",
    avatarInitials: "FB",
    customerSince: "Sep 2025",
    shippingAddress: "42 Gwarinpa Estate, Gwarinpa, Abuja, Nigeria",
    insights: {
      accountAge: "9 months",
      returnRate: "0%",
      avgScore: "4.7/5",
      tier: "HIGH VALUE",
    },
  },
  {
    id: "CUST-006",
    name: "Ibrahim Abubakar",
    email: "i.abubakar@skyline.io",
    phone: "+234 902 444 5555",
    totalOrders: 3,
    totalSpend: 22400,
    lastOrderDate: "Apr 02, 2026",
    rawDateString: "2026-04-02T18:40:00Z",
    avatarColorBg: "bg-sky-100",
    avatarColorText: "text-sky-700",
    avatarInitials: "IA",
    customerSince: "Jan 2025",
    shippingAddress: "18 Lamido Road, Kaduna, Kaduna State, Nigeria",
    insights: {
      accountAge: "17 months",
      returnRate: "12%",
      avgScore: "4.5/5",
      tier: "STANDARD",
    },
  },
  {
    id: "CUST-007",
    name: "Chinelo Eze",
    email: "eze.chinelo@pro.com",
    phone: "+234 703 666 7777",
    totalOrders: 21,
    totalSpend: 245000,
    lastOrderDate: "Mar 25, 2026",
    rawDateString: "2026-03-25T11:00:00Z",
    avatarColorBg: "bg-teal-100",
    avatarColorText: "text-teal-700",
    avatarInitials: "CE",
    customerSince: "Nov 2023",
    shippingAddress: "77 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria",
    insights: {
      accountAge: "2.5 years",
      returnRate: "2%",
      avgScore: "4.9/5",
      tier: "HIGH VALUE",
    },
  },
  {
    id: "CUST-008",
    name: "Samuel Musa",
    email: "s.musa@gmail.com",
    phone: "+234 802 888 9999",
    totalOrders: 0,
    totalSpend: 0,
    lastOrderDate: "—",
    rawDateString: "",
    avatarColorBg: "bg-zinc-100",
    avatarColorText: "text-zinc-700",
    avatarInitials: "SM",
    customerSince: "May 2026",
    shippingAddress: "105 Airport Road, Ikeja, Lagos State, Nigeria",
    insights: {
      accountAge: "1 month",
      returnRate: "0%",
      avgScore: "5.0/5",
      tier: "NEW",
    },
  },
  {
    id: "CUST-009",
    name: "Ngozi Obi",
    email: "ngozi.obi@yahoo.com",
    phone: "+234 806 777 8888",
    totalOrders: 4,
    totalSpend: 28000,
    lastOrderDate: "Apr 17, 2026",
    rawDateString: "2026-04-17T11:20:00Z",
    avatarColorBg: "bg-amber-100",
    avatarColorText: "text-amber-700",
    avatarInitials: "NO",
    customerSince: "Dec 2024",
    shippingAddress: "12 Owerri Road, Asaba, Delta State, Nigeria",
    insights: {
      accountAge: "18 months",
      returnRate: "0%",
      avgScore: "4.6/5",
      tier: "STANDARD",
    },
  },
  {
    id: "CUST-010",
    name: "Tunde Bakare",
    email: "t.bakare@outlook.com",
    phone: "+234 809 333 4444",
    totalOrders: 7,
    totalSpend: 59500,
    lastOrderDate: "Mar 12, 2026",
    rawDateString: "2026-03-12T16:45:00Z",
    avatarColorBg: "bg-orange-100",
    avatarColorText: "text-orange-700",
    avatarInitials: "TB",
    customerSince: "Mar 2025",
    shippingAddress: "88 Bodija Estate, Ibadan, Oyo State, Nigeria",
    insights: {
      accountAge: "15 months",
      returnRate: "0%",
      avgScore: "4.4/5",
      tier: "STANDARD",
    },
  },
  // We can fill the rest programmatically or with static data
];

// Dynamically generate the remaining 32 mock customers to fill the total of 42
const generateRemainingMockCustomers = () => {
  const names = [
    "Chioma Nwachukwu", "Abubakar Umar", "Funke Akindele", "Yetunde Adebayo", 
    "Chinedu Okoro", "Fatima Musa", "Kelechi Iheanacho", "Babajide Sanwo", 
    "Oluwaseun Ajayi", "Aisha Dahiru", "Chukwuma Soludo", "Ogechi Onyeka", 
    "Aminu Tambuwal", "Halima Dangote", "Ezenwa Uzo", "Ronke Oshodi", 
    "Jude Okoye", "Nkechi Blessing", "Femi Otedola", "Tony Elumelu", 
    "Aliko Dangote", "Herbert Wigwe", "Jim Ovia", "Mike Adenuga", 
    "Folorunsho Alakija", "Linda Ikeji", "Wizkid Balogun", "Davido Adeleke", 
    "Burna Boy", "Tiwa Savage", "Tems Openiyi", "Rema Ikubese"
  ];
  
  const emails = names.map(n => n.toLowerCase().replace(/ /g, ".") + "@example.com");
  const colors = [
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
    { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-yellow-100", text: "text-yellow-700" },
    { bg: "bg-sky-100", text: "text-sky-700" },
    { bg: "bg-pink-100", text: "text-pink-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
  ];
  
  const cities = ["Lekki, Lagos", "Ikeja, Lagos", "Victoria Island, Lagos", "Wuse, Abuja", "Gwarinpa, Abuja", "Maitama, Abuja", "Port Harcourt", "Kano", "Calabar", "Enugu"];
  
  for (let i = 0; i < names.length; i++) {
    const idNum = i + 11;
    const totalOrders = Math.floor(Math.random() * 15) + (idNum % 3 === 0 ? 0 : 2); // some 0 orders, some higher
    const totalSpend = totalOrders * (Math.floor(Math.random() * 8000) + 4000);
    const lastOrderDate = totalOrders > 0 ? `Apr ${Math.floor(Math.random() * 20) + 1}, 2026` : "—";
    const initials = names[i].split(" ").map(n => n[0]).join("");
    const color = colors[i % colors.length];
    
    INITIAL_CUSTOMERS.push({
      id: `CUST-0${idNum}`,
      name: names[i],
      email: emails[i],
      phone: `+234 80${Math.floor(Math.random() * 9) + 1} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
      totalOrders,
      totalSpend,
      lastOrderDate,
      rawDateString: totalOrders > 0 ? "2026-04-10T12:00:00Z" : "",
      avatarColorBg: color.bg,
      avatarColorText: color.text,
      avatarInitials: initials,
      customerSince: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i % 12]} ${2020 + (i % 6)}`,
      shippingAddress: `${Math.floor(Math.random() * 100) + 1} Street, ${cities[i % cities.length]}, Nigeria`,
      insights: {
        accountAge: `${1 + (i % 5)} years`,
        returnRate: `${i % 4 === 0 ? "2%" : "0%"}`,
        avgScore: `${(4.2 + (i % 9) * 0.1).toFixed(1)}/5`,
        tier: totalSpend > 100000 ? "HIGH VALUE" : totalOrders === 0 ? "NEW" : "STANDARD",
      }
    });
  }
};

generateRemainingMockCustomers();

const LOCAL_STORAGE_KEY = "bentlab_customers_state";

export function getStoredCustomers(): Customer[] {
  if (typeof window === "undefined") return INITIAL_CUSTOMERS;
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (val) {
      return JSON.parse(val);
    }
  } catch (e) {
    console.error("Failed to read customers from localStorage", e);
  }
  return INITIAL_CUSTOMERS;
}

export function saveStoredCustomers(customers: Customer[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customers));
  } catch (e) {
    console.error("Failed to save customers to localStorage", e);
  }
}
