import React, { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Edit,
  Expand,
  Filter,
  Mail,
  MessageCircle,
  Minimize2,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Search,
  Send,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const SUMMARY_STATS = [
  { title: "Total Revenue", value: "$142,500.00", icon: DollarSign, trend: "+12.5%" },
  { title: "Total Patients", value: "2,845", icon: Users, trend: "+5.2%" },
  { title: "Cash Payments", value: "$45,200.00", icon: Wallet, trend: "-2.4%" },
  { title: "Online/Card", value: "$97,300.00", icon: CreditCard, trend: "+18.1%" },
];

const TRANSACTIONS = [
  {
    id: "TRX-847291",
    mrn: "MR-40291",
    patientName: "Sarah Jenkins",
    phone: "+1 (555) 234-9182",
    referredBy: "Dr. Robert Chen",
    doctor: "Dr. Emily Wong",
    department: "Cardiology",
    subDepartment: "Outpatient",
    insuranceCompany: "BlueCross Shield",
    insuranceNo: "BCS-992810",
    procedureName: "Echocardiogram",
    subtotal: 1200,
    zakat: 0,
    discount: 50,
    insuranceClaim: 950,
    coPayment: 200,
    total: 1150,
    status: "Paid",
    paymentMode: "Insurance",
    doctorRevenue: 400,
    hospitalShare: 750,
    deptRevenue: 500,
    subDeptRevenue: 250,
    paymentDate: "2023-10-24 09:30 AM",
    createdBy: "j.smith",
  },
  {
    id: "TRX-847292",
    mrn: "MR-39102",
    patientName: "Michael Chang",
    phone: "+1 (555) 882-1023",
    referredBy: "Self",
    doctor: "Dr. James Wilson",
    department: "Orthopedics",
    subDepartment: "Surgery",
    insuranceCompany: "N/A",
    insuranceNo: "N/A",
    procedureName: "Knee Arthroscopy",
    subtotal: 4500,
    zakat: 0,
    discount: 200,
    insuranceClaim: 0,
    coPayment: 0,
    total: 4300,
    status: "Pending",
    paymentMode: "Pending",
    doctorRevenue: 1500,
    hospitalShare: 2800,
    deptRevenue: 2000,
    subDeptRevenue: 800,
    paymentDate: "-",
    createdBy: "a.davis",
  },
  {
    id: "TRX-847293",
    mrn: "MR-50192",
    patientName: "Elena Rodriguez",
    phone: "+1 (555) 441-9920",
    referredBy: "Dr. Alan Turing",
    doctor: "Dr. Sarah Connor",
    department: "Neurology",
    subDepartment: "Consultation",
    insuranceCompany: "Aetna",
    insuranceNo: "AET-559102",
    procedureName: "Initial Consult",
    subtotal: 350,
    zakat: 0,
    discount: 0,
    insuranceClaim: 280,
    coPayment: 70,
    total: 350,
    status: "Paid",
    paymentMode: "Card",
    doctorRevenue: 150,
    hospitalShare: 200,
    deptRevenue: 200,
    subDeptRevenue: 0,
    paymentDate: "2023-10-24 10:15 AM",
    createdBy: "m.johnson",
  },
  {
    id: "TRX-847294",
    mrn: "MR-22019",
    patientName: "David Kim",
    phone: "+1 (555) 772-4019",
    referredBy: "Self",
    doctor: "Dr. Lisa Cuddy",
    department: "Pediatrics",
    subDepartment: "Vaccination",
    insuranceCompany: "Cigna",
    insuranceNo: "CIG-882910",
    procedureName: "Annual Checkup",
    subtotal: 200,
    zakat: 0,
    discount: 0,
    insuranceClaim: 180,
    coPayment: 20,
    total: 200,
    status: "Partial",
    paymentMode: "Cash",
    doctorRevenue: 80,
    hospitalShare: 120,
    deptRevenue: 120,
    subDeptRevenue: 0,
    paymentDate: "2023-10-24 11:00 AM",
    createdBy: "j.smith",
  },
  {
    id: "TRX-847295",
    mrn: "MR-60211",
    patientName: "Marcus Johnson",
    phone: "+1 (555) 339-2011",
    referredBy: "Dr. Gregory House",
    doctor: "Dr. Allison Cameron",
    department: "Immunology",
    subDepartment: "Lab",
    insuranceCompany: "UnitedHealth",
    insuranceNo: "UH-110293",
    procedureName: "Blood Panel Comprehensive",
    subtotal: 850,
    zakat: 0,
    discount: 100,
    insuranceClaim: 600,
    coPayment: 150,
    total: 750,
    status: "Paid",
    paymentMode: "Online",
    doctorRevenue: 100,
    hospitalShare: 650,
    deptRevenue: 400,
    subDeptRevenue: 250,
    paymentDate: "2023-10-24 11:45 AM",
    createdBy: "k.williams",
  },
];

type Transaction = (typeof TRANSACTIONS)[number];

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "paid":
      return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">Paid</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200">Pending</Badge>;
    case "partial":
      return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200">Partial</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PaymentModeBadge({ mode }: { mode: string }) {
  switch (mode.toLowerCase()) {
    case "cash":
      return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50"><Wallet className="w-3 h-3 mr-1" /> Cash</Badge>;
    case "online":
    case "card":
      return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50"><CreditCard className="w-3 h-3 mr-1" /> {mode}</Badge>;
    case "insurance":
      return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50"><Building2 className="w-3 h-3 mr-1" /> Insurance</Badge>;
    default:
      return <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50">{mode}</Badge>;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function MoneyInput({ label, value }: { label: string; value: number }) {
  return (
    <FieldLabel label={label}>
      <div className="relative">
        <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input defaultValue={value.toFixed(2)} className="h-9 pl-8 text-sm font-medium" />
      </div>
    </FieldLabel>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
      </div>
      {children}
    </section>
  );
}

function EditTransactionDrawer({
  transaction,
  expanded,
  notice,
  onClose,
  onToggleExpand,
  onUpdate,
}: {
  transaction: Transaction | null;
  expanded: boolean;
  notice: string;
  onClose: () => void;
  onToggleExpand: () => void;
  onUpdate: (print?: boolean) => void;
}) {
  const totalPreview = useMemo(() => {
    if (!transaction) return 0;
    return transaction.subtotal - transaction.discount - transaction.zakat;
  }, [transaction]);

  if (!transaction) return null;

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
      <aside className={`flex h-full flex-col bg-slate-50 shadow-2xl transition-all duration-300 ease-out ${expanded ? "w-full" : "w-[40vw] min-w-[520px] max-w-[680px]"}`}>
        <div className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">Edit Transaction</h2>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{transaction.id}</Badge>
            </div>
            <p className="text-xs text-slate-500">Changes are staged until an update action is clicked</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand} title={expanded ? "Collapse drawer" : "Expand drawer"}>
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600" onClick={onClose} title="Close without saving">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {notice && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 pb-28">
          <div className={`grid gap-4 ${expanded ? "xl:grid-cols-2" : "grid-cols-1"}`}>
            <DrawerSection title="Visit Information">
              <div className="grid grid-cols-2 gap-3">
                <FieldLabel label="MR#">
                  <Input value={transaction.mrn} readOnly className="h-9 bg-slate-100 font-mono text-slate-500" />
                </FieldLabel>
                <FieldLabel label="Patient Name">
                  <Input value={transaction.patientName} readOnly className="h-9 bg-slate-100 text-slate-500" />
                </FieldLabel>
                <FieldLabel label="Patient Phone">
                  <Input value={transaction.phone} readOnly className="h-9 bg-slate-100 text-slate-500" />
                </FieldLabel>
                <FieldLabel label="Referred By">
                  <Input defaultValue={transaction.referredBy} className="h-9" />
                </FieldLabel>
                <FieldLabel label="Doctor">
                  <Select defaultValue={transaction.doctor}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr. Emily Wong">Dr. Emily Wong</SelectItem>
                      <SelectItem value="Dr. James Wilson">Dr. James Wilson</SelectItem>
                      <SelectItem value="Dr. Sarah Connor">Dr. Sarah Connor</SelectItem>
                      <SelectItem value="Dr. Lisa Cuddy">Dr. Lisa Cuddy</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldLabel>
                <FieldLabel label="Insurance Company">
                  <Input defaultValue={transaction.insuranceCompany} className="h-9" />
                </FieldLabel>
                <FieldLabel label="Insurance No.">
                  <Input defaultValue={transaction.insuranceNo} className="h-9 font-mono" />
                </FieldLabel>
                <FieldLabel label="Procedure Name">
                  <Input defaultValue={transaction.procedureName} className="h-9" />
                </FieldLabel>
              </div>
              <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">Patient identity fields are locked to prevent front-desk editing errors.</p>
            </DrawerSection>

            <DrawerSection title="Billing Information">
              <div className="grid grid-cols-2 gap-3">
                <MoneyInput label="Subtotal" value={transaction.subtotal} />
                <MoneyInput label="Zakat" value={transaction.zakat} />
                <MoneyInput label="Discount" value={transaction.discount} />
                <MoneyInput label="Insurance Claim" value={transaction.insuranceClaim} />
                <MoneyInput label="Co-Payment" value={transaction.coPayment} />
                <FieldLabel label="Total">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-800">{formatCurrency(totalPreview)}</div>
                </FieldLabel>
                <FieldLabel label="Payment Status">
                  <Select defaultValue={transaction.status.toLowerCase()}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldLabel>
                <FieldLabel label="Mode of Payment">
                  <Select defaultValue={transaction.paymentMode.toLowerCase()}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldLabel>
              </div>
            </DrawerSection>

            <DrawerSection title="Shares & Revenue">
              <div className="grid grid-cols-2 gap-3">
                <MoneyInput label="Doctor Revenue" value={transaction.doctorRevenue} />
                <MoneyInput label="Hospital Share" value={transaction.hospitalShare} />
                <MoneyInput label="Department Revenue" value={transaction.deptRevenue} />
                <MoneyInput label="Sub-department Revenue" value={transaction.subDeptRevenue} />
                <FieldLabel label="Payment Date">
                  <Input defaultValue={transaction.paymentDate} className="h-9" />
                </FieldLabel>
                <FieldLabel label="Created By">
                  <Input defaultValue={transaction.createdBy} className="h-9" />
                </FieldLabel>
              </div>
            </DrawerSection>

            <DrawerSection title="Change Control">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">Unsaved edits</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Form changes remain local until Update Transaction or Update & Print is selected. Closing the drawer discards edits.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white border border-slate-200 p-3">
                    <span className="text-slate-400">Opened by</span>
                    <p className="font-semibold text-slate-800">Front Desk</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-3">
                    <span className="text-slate-400">Permission</span>
                    <p className="font-semibold text-slate-800">Billing Edit</p>
                  </div>
                </div>
              </div>
            </DrawerSection>
          </div>
        </div>

        <div className="fixed bottom-0 right-0 z-[60] border-t border-slate-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur" style={{ width: expanded ? "100%" : "clamp(520px, 40vw, 680px)" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="hidden text-xs text-slate-500 sm:block">Sticky actions stay visible while scrolling long forms.</p>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" className="border-slate-200" onClick={() => onUpdate(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Update & Print
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => onUpdate(false)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Update Transaction
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function Dashboard() {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(TRANSACTIONS[0]);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [notice, setNotice] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openEditor = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDrawerExpanded(false);
    setNotice("");
  };

  const closeEditor = () => {
    setSelectedTransaction(null);
    setDrawerExpanded(false);
    setNotice("");
  };

  const showUpdateNotice = (print?: boolean) => {
    setNotice(print ? "Transaction updated and receipt sent to print queue." : "Transaction updated successfully.");
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <header className="z-20 flex h-14 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-indigo-700">
            <Activity className="h-6 w-6" />
            <span>MedFinance Pro</span>
          </div>
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <Button variant="ghost" className="h-9 bg-indigo-50 px-3 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800">Transactions</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Reports</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Claims</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Settlements</Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search MRN, Name..." className="h-9 w-64 border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:ring-indigo-500" />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-700">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full border border-slate-200 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=finance" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Jane Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">Finance Manager</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="relative z-10 flex-none border-b border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 p-3 px-4">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Filter className="h-4 w-4 text-slate-500" />
              Transaction Filters
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-xs font-medium">Clear All</Button>
              <Button size="sm" className="h-8 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700">Apply Filters</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
            <Select defaultValue="today">
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Date Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cardio">Cardiology</SelectItem>
                <SelectItem value="ortho">Orthopedics</SelectItem>
                <SelectItem value="neuro">Neurology</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Sub-dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="opd">Outpatient</SelectItem>
                <SelectItem value="ipd">Inpatient</SelectItem>
                <SelectItem value="er">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Consultant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dr-chen">Dr. Robert Chen</SelectItem>
                <SelectItem value="dr-wong">Dr. Emily Wong</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs"><SelectValue placeholder="Visit Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Visit</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
              </SelectContent>
            </Select>
            <Input className="h-8 border-slate-200 bg-white text-xs" placeholder="Search Procedure..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white p-3 px-4 lg:grid-cols-4">
          {SUMMARY_STATS.map((stat, i) => {
            const Icon = stat.icon;
            const isPositive = stat.trend.startsWith("+");
            return (
              <Card key={i} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">{stat.title}</p>
                    <p className="text-lg font-bold tracking-tight text-slate-900">{stat.value}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-[10px] font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>{stat.trend}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
        <div className="mx-auto max-w-[1600px] space-y-3 pb-8">
          <div className="hidden grid-cols-12 gap-4 rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <div className="col-span-4">Visit Information</div>
            <div className="col-span-4">Billing & Status</div>
            <div className="col-span-3">Shares & Revenue</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {TRANSACTIONS.map((trx) => (
            <Collapsible key={trx.id} open={expandedRows[trx.id]} onOpenChange={() => toggleRow(trx.id)} className={`overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:border-indigo-200 ${selectedTransaction?.id === trx.id ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"}`}>
              <div className="relative grid grid-cols-1 gap-4 p-4 lg:grid-cols-12 lg:items-center">
                <div className="col-span-1 flex gap-3 lg:col-span-4">
                  <div className="mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500">{trx.patientName.charAt(0)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-slate-900">{trx.patientName}</span>
                      <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{trx.mrn}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1 truncate"><UserCircle className="h-3 w-3 text-slate-400" /> {trx.doctor}</div>
                      <div className="flex items-center gap-1 truncate"><Building2 className="h-3 w-3 text-slate-400" /> {trx.department}</div>
                      <div className="col-span-2 truncate text-[11px] text-slate-500" title={trx.procedureName}>Proc: {trx.procedureName}</div>
                    </div>
                  </div>
                </div>

                <div className="my-2 h-px bg-slate-100 lg:hidden" />

                <div className="col-span-1 grid grid-cols-2 gap-2 text-sm lg:col-span-4">
                  <div className="flex flex-col justify-center">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(trx.total)}</span>
                      <StatusBadge status={trx.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <PaymentModeBadge mode={trx.paymentMode} />
                      <span className="font-mono text-[10px] text-slate-500">{trx.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-1 border-l border-slate-100 pl-3 text-xs">
                    <div className="flex justify-between text-slate-500"><span>Subtotal:</span> <span className="font-medium text-slate-700">{formatCurrency(trx.subtotal)}</span></div>
                    {trx.discount > 0 && <div className="flex justify-between text-rose-500"><span>Discount:</span> <span>-{formatCurrency(trx.discount)}</span></div>}
                    <div className="flex justify-between text-indigo-600"><span>Co-Pay:</span> <span className="font-medium">{formatCurrency(trx.coPayment)}</span></div>
                  </div>
                </div>

                <div className="my-2 h-px bg-slate-100 lg:hidden" />

                <div className="col-span-1 grid grid-cols-2 gap-x-3 gap-y-1 border-l-0 text-xs lg:col-span-3 lg:border-l lg:border-slate-100 lg:pl-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Hospital Share</span>
                    <span className="font-medium text-slate-700">{formatCurrency(trx.hospitalShare)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Doctor Rev.</span>
                    <span className="font-medium text-slate-700">{formatCurrency(trx.doctorRevenue)}</span>
                  </div>
                  <div className="mt-1 flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Date</span>
                    <span className="flex items-center gap-1 text-slate-600"><Calendar className="h-3 w-3" /> {trx.paymentDate.split(" ")[0]}</span>
                  </div>
                  <div className="mt-1 flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Created By</span>
                    <span className="text-slate-600">{trx.createdBy}</span>
                  </div>
                </div>

                <div className="absolute right-4 top-4 col-span-1 flex items-center justify-end gap-1 lg:relative lg:right-auto lg:top-auto lg:col-span-1">
                  <div className="flex gap-1 lg:flex-col">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit Transaction" onClick={() => openEditor(trx)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Print Receipt">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Send Invoice">
                          <Send className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuLabel>Send Invoice</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><Mail className="mr-2 h-3.5 w-3.5" /> Send via Email</DropdownMenuItem>
                        <DropdownMenuItem><MessageCircle className="mr-2 h-3.5 w-3.5" /> Send via WhatsApp</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem onClick={() => openEditor(trx)}><Edit className="mr-2 h-3 w-3" /> Edit Transaction</DropdownMenuItem>
                        <DropdownMenuItem><Printer className="mr-2 h-3 w-3" /> Print Receipt</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600"><RotateCcw className="mr-2 h-3 w-3" /> Process Refund</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="absolute bottom-1 right-1/2 h-5 translate-x-1/2 text-[10px] text-slate-400 hover:text-slate-600 lg:hidden">
                    {expandedRows[trx.id] ? "Less Details" : "More Details"}
                    {expandedRows[trx.id] ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="border-t border-slate-100 bg-slate-50 p-4 text-xs">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <h4 className="mb-2 border-b border-slate-200 pb-1 font-semibold text-slate-700">Patient & Insurance</h4>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Phone:</span> <span className="col-span-2 font-medium">{trx.phone}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ref By:</span> <span className="col-span-2 font-medium">{trx.referredBy}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ins. Co:</span> <span className="col-span-2 font-medium">{trx.insuranceCompany}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ins. No:</span> <span className="col-span-2 font-mono font-medium">{trx.insuranceNo}</span></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="mb-2 border-b border-slate-200 pb-1 font-semibold text-slate-700">Billing Breakdown</h4>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Subtotal:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.subtotal)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Zakat:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.zakat)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Discount:</span> <span className="col-span-2 font-medium text-rose-600">{formatCurrency(trx.discount)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ins. Claim:</span> <span className="col-span-2 font-medium text-purple-600">{formatCurrency(trx.insuranceClaim)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Total:</span> <span className="col-span-2 font-bold">{formatCurrency(trx.total)}</span></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="mb-2 border-b border-slate-200 pb-1 font-semibold text-slate-700">Internal Revenue</h4>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Dept Rev:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.deptRevenue)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Sub-dept Rev:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.subDeptRevenue)}</span></div>
                      <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-200 pt-2"><span className="text-slate-500">Processed:</span> <span className="col-span-2 font-medium">{trx.paymentDate}</span></div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          <div className="flex items-center justify-between px-2 pt-4">
            <div className="text-xs text-slate-500">Showing <span className="font-medium text-slate-900">1</span> to <span className="font-medium text-slate-900">5</span> of <span className="font-medium text-slate-900">124</span> transactions</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 border-slate-200 bg-white p-0" disabled><span className="sr-only">Previous Page</span><ChevronDown className="h-4 w-4 rotate-90" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 border-slate-200 bg-indigo-50 p-0 text-indigo-700">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 border-slate-200 bg-white p-0">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 border-slate-200 bg-white p-0">3</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 border-slate-200 bg-white p-0"><span className="sr-only">Next Page</span><ChevronDown className="h-4 w-4 -rotate-90" /></Button>
            </div>
          </div>
        </div>
      </div>

      <EditTransactionDrawer
        transaction={selectedTransaction}
        expanded={drawerExpanded}
        notice={notice}
        onClose={closeEditor}
        onToggleExpand={() => setDrawerExpanded((value) => !value)}
        onUpdate={showUpdateNotice}
      />
    </div>
  );
}
