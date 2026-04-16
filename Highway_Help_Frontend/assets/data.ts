import {
  BookOpen,
  Briefcase,
  Calendar,
  Car,
  CloudSun,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Mail,
  MessageCircle,
  Phone,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Ticket,
  UtensilsCrossed,
  Wifi,
} from "lucide-react-native";

export const categories = [
  { id: "all", name: "All", icon: Database },
  { id: "telecom", name: "Telecom", icon: Smartphone },
  { id: "lifestyle", name: "Lifestyle", icon: Heart },
  { id: "financial", name: "Financial", icon: CreditCard },
  { id: "entertainment", name: "Fun", icon: Gamepad2 },
];

export const services = [
  // Telecom Services
  {
    id: "recharge",
    name: "Recharge Balance",
    description: "Top-up your account",
    icon: CreditCard,
    category: "telecom",
    color: "#00A99D",
  },
  {
    id: "packages",
    name: "Buy Packages",
    description: "Data, voice, and combo bundles",
    icon: Database,
    category: "telecom",
    color: "#8B5CF6",
  },
  {
    id: "transfer",
    name: "Balance Transfer",
    description: "Send money to friends",
    icon: Smartphone,
    category: "telecom",
    color: "#F59E0B",
  },
  {
    id: "loan",
    name: "Emergency Loan",
    description: "Instant credit when needed",
    icon: Gift,
    category: "telecom",
    color: "#EF4444",
  },
  {
    id: "subscriptions",
    name: "My Subscriptions",
    description: "Manage active services",
    icon: Database,
    category: "telecom",
    color: "#10B981",
  },
  {
    id: "sim-management",
    name: "SIM Management",
    description: "Migrate to eSIM",
    icon: Smartphone,
    category: "telecom",
    color: "#3B82F6",
  },
];

export const supportOptions = [
  {
    id: "chat",
    title: "Live Chat",
    subtitle: "Chat with our support team",
    icon: MessageCircle,
    color: "#00A99D",
  },
  {
    id: "call",
    title: "Call Support",
    subtitle: "24/7 hotline: 0700",
    icon: Phone,
    color: "#3B82F6",
  },
  {
    id: "email",
    title: "Email Support",
    subtitle: "support@etisalat.af",
    icon: Mail,
    color: "#8B5CF6",
  },
  {
    id: "tickets",
    title: "My Tickets",
    subtitle: "View support tickets",
    icon: FileText,
    color: "#F59E0B",
  },
];

export const faqItems = [
  {
    question: "How do I recharge my balance?",
    answer: "You can recharge using mHawala or voucher cards through the app.",
  },
  {
    question: "How to check my data usage?",
    answer: "Go to Home screen to see your current balance and data usage.",
  },
  {
    question: "What is eSIM migration?",
    answer: "Convert your physical SIM to digital eSIM through the app.",
  },
  {
    question: "How do loyalty points work?",
    answer: "Earn points through app usage and redeem them for rewards.",
  },
];
