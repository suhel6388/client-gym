export type MemberStatus = "Active" | "Expiring" | "Inactive" | "Frozen";

export type Member = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  plan: string;
  status: MemberStatus;
  joined: string;
  nextDue: string | null;
  avatar?: string;
};

export const members: Member[] = [
  {
    id: "MEM-001",
    name: "Marcus Bennett",
    initials: "MB",
    email: "marcus.bennett@example.com",
    phone: "+1 (555) 101-2001",
    plan: "Annual Pro",
    status: "Active",
    joined: "2025-01-15",
    nextDue: "2027-01-15",
  },
  {
    id: "MEM-002",
    name: "Elena Rodriguez",
    initials: "ER",
    email: "elena.r@example.com",
    phone: "+1 (555) 102-2002",
    plan: "Monthly Flex",
    status: "Active",
    joined: "2026-05-20",
    nextDue: "2026-11-20",
  },
  {
    id: "MEM-003",
    name: "Devon Clarke",
    initials: "DC",
    email: "devon.clarke@example.com",
    phone: "+1 (555) 103-2003",
    plan: "Quarterly",
    status: "Expiring",
    joined: "2026-07-10",
    nextDue: "2026-10-16",
  },
  {
    id: "MEM-004",
    name: "Priya Raman",
    initials: "PR",
    email: "priya.raman@example.com",
    phone: "+1 (555) 104-2004",
    plan: "Annual Pro",
    status: "Active",
    joined: "2025-09-05",
    nextDue: "2026-09-05",
  },
  {
    id: "MEM-005",
    name: "Jonah Whitfield",
    initials: "JW",
    email: "jonah.w@example.com",
    phone: "+1 (555) 105-2005",
    plan: "Student",
    status: "Inactive",
    joined: "2026-02-14",
    nextDue: null,
  },
  {
    id: "MEM-006",
    name: "Amara Osei",
    initials: "AO",
    email: "amara.osei@example.com",
    phone: "+1 (555) 106-2006",
    plan: "Monthly Flex",
    status: "Active",
    joined: "2026-08-03",
    nextDue: "2026-10-03",
  },
  {
    id: "MEM-007",
    name: "Liam Castellano",
    initials: "LC",
    email: "liam.c@example.com",
    phone: "+1 (555) 107-2007",
    plan: "Quarterly",
    status: "Frozen",
    joined: "2026-04-22",
    nextDue: "2026-11-22",
  },
  {
    id: "MEM-008",
    name: "Sofia Marchetti",
    initials: "SM",
    email: "sofia.m@example.com",
    phone: "+1 (555) 108-2008",
    plan: "Monthly Flex",
    status: "Expiring",
    joined: "2026-09-14",
    nextDue: "2026-10-14",
  },
];
