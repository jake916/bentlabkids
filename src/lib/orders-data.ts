export type OrderStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  details?: string; // size/collection details
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatarUrl?: string;
  customerSince?: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  date: string;
  rawDateString: string; // for new Date parsing
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-1023",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@example.com",
    customerPhone: "+234 802 345 6789",
    customerSince: "2022",
    customerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    shippingAddress: "12B Banana Island Road, Ikoyi, Lagos State, Nigeria",
    items: [
      {
        id: "p1",
        name: "Children's Bible Storybook",
        details: "Hardcover Edition • Kids Collection",
        price: 4500,
        quantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=150&auto=format&fit=crop"
      },
      {
        id: "p2",
        name: "Bentlab Explorer Tee",
        details: "Size: M (7-8Y) • Royal Blue",
        price: 6000,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=150&auto=format&fit=crop"
      }
    ],
    totalAmount: 15000,
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "Card (**** 1234)",
    date: "Oct 24, 2023",
    rawDateString: "2023-10-24T14:15:00Z"
  },
  {
    id: "ORD-1024",
    customerName: "David Ade",
    customerEmail: "david.ade@web.com",
    customerPhone: "+234 812 345 6789",
    customerSince: "2023",
    shippingAddress: "12, Ring Road, Ibadan, Oyo State, Nigeria",
    items: [{ id: "p3", name: "Bible Story Book Set", details: "Volume 1 & 2 Set", price: 5000, quantity: 1 }],
    totalAmount: 5000,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "Bank Transfer",
    date: "Apr 18, 2026",
    rawDateString: "2026-04-18T10:00:00Z"
  },
  {
    id: "ORD-1025",
    customerName: "Mary Okeke",
    customerEmail: "mary.o@hub.org",
    customerPhone: "+234 905 456 7890",
    customerSince: "2024",
    shippingAddress: "Avenue Mall, Wuse 2, Abuja, Nigeria",
    items: [
      { id: "p4", name: "Armour of God T-shirt", details: "Red Color • size 6Y", price: 4200, quantity: 1 },
      { id: "p2", name: "Jesus Loves Me Socks", details: "Blue Color", price: 1200, quantity: 1 },
      { id: "p5", name: "Prayer Journal for Kids", details: "Premium Hardback", price: 2800, quantity: 1 },
    ],
    totalAmount: 8200,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "USSD",
    date: "Apr 17, 2026",
    rawDateString: "2026-04-17T12:00:00Z"
  },
  {
    id: "ORD-1026",
    customerName: "Emeka Williams",
    customerEmail: "emeka.w@mail.com",
    customerPhone: "+234 809 999 8888",
    customerSince: "2023",
    shippingAddress: "56, New Haven, Enugu, Nigeria",
    items: [{ id: "p4", name: "Armour of God T-shirt", price: 4200, quantity: 1 }],
    totalAmount: 4200,
    status: "DELIVERED",
    paymentStatus: "FAILED",
    paymentMethod: "Card payment",
    date: "Apr 17, 2026",
    rawDateString: "2026-04-17T15:30:00Z"
  },
  {
    id: "ORD-1027",
    customerName: "Alice Cooper",
    customerEmail: "alice.c@design.io",
    customerPhone: "+1 (555) 019-2834",
    customerSince: "2021",
    shippingAddress: "742 Evergreen Terrace, Springfield, USA",
    items: [
      { id: "p3", name: "Bible Story Book Set", price: 8500, quantity: 2 },
      { id: "p1", name: "Kids Faith Tote Bag", price: 3500, quantity: 1 },
      { id: "p2", name: "Jesus Loves Me Socks", price: 1200, quantity: 1 },
    ],
    totalAmount: 22000,
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "PayPal",
    date: "Apr 16, 2026",
    rawDateString: "2026-04-16T09:15:00Z"
  },
  {
    id: "ORD-1028",
    customerName: "Samuel Thompson",
    customerEmail: "sam.t@cloud.net",
    customerPhone: "+234 701 222 3333",
    customerSince: "2024",
    shippingAddress: "32, Gwarinpa Estate, Abuja, Nigeria",
    items: [
      { id: "p6", name: "Bentlab Kids Backpack", price: 8600, quantity: 1 },
      { id: "p5", name: "Prayer Journal for Kids", price: 2800, quantity: 1 },
    ],
    totalAmount: 11400,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "Bank Transfer",
    date: "Apr 16, 2026",
    rawDateString: "2026-04-16T18:40:00Z"
  },
  {
    id: "ORD-1029",
    customerName: "Bola Tinubu",
    customerEmail: "bola.bat@nigeria.gov",
    customerPhone: "+234 802 000 1111",
    customerSince: "2022",
    shippingAddress: "Aso Rock Villa, FCT Abuja, Nigeria",
    items: [
      { id: "p6", name: "Bentlab Kids Backpack", price: 12500, quantity: 5 },
      { id: "p3", name: "Bible Story Book Set", price: 8500, quantity: 5 },
    ],
    totalAmount: 105000,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "USSD",
    date: "Apr 15, 2026",
    rawDateString: "2026-04-15T11:00:00Z"
  },
  {
    id: "ORD-1030",
    customerName: "Grace Kelly",
    customerEmail: "grace.k@royal.mc",
    customerPhone: "+377 93 25 18 56",
    customerSince: "2023",
    shippingAddress: "Prince's Palace, Monaco",
    items: [{ id: "p5", name: "Prayer Journal for Kids", price: 2800, quantity: 3 }],
    totalAmount: 8400,
    status: "CANCELLED",
    paymentStatus: "FAILED",
    paymentMethod: "Card payment",
    date: "Apr 14, 2026",
    rawDateString: "2026-04-14T10:20:00Z"
  },
];

const LOCAL_STORAGE_KEY = "bentlab_orders_state";

export function getStoredOrders(): Order[] {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      return parsed.map((o: any) => ({
        ...o,
        rawDate: new Date(o.rawDateString),
      }));
    }
  } catch (e) {
    console.error("Failed to read orders from localStorage", e);
  }
  return INITIAL_ORDERS;
}

export function saveStoredOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders to localStorage", e);
  }
}
