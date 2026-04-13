import React, { useState } from "react";
import { 
  Search, Filter, ChevronDown, ChevronUp, Printer, Edit, RotateCcw,
  Activity, Users, CreditCard, DollarSign, Wallet, Building2, UserCircle,
  Calendar, FileText, Bell, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

// Mock Data
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
    subtotal: 1200.00,
    zakat: 0,
    discount: 50.00,
    insuranceClaim: 950.00,
    coPayment: 200.00,
    total: 1150.00,
    status: "Paid",
    paymentMode: "Insurance",
    doctorRevenue: 400.00,
    hospitalShare: 750.00,
    deptRevenue: 500.00,
    subDeptRevenue: 250.00,
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
    subtotal: 4500.00,
    zakat: 0,
    discount: 200.00,
    insuranceClaim: 0,
    coPayment: 0,
    total: 4300.00,
    status: "Pending",
    paymentMode: "Pending",
    doctorRevenue: 1500.00,
    hospitalShare: 2800.00,
    deptRevenue: 2000.00,
    subDeptRevenue: 800.00,
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
    subtotal: 350.00,
    zakat: 0,
    discount: 0,
    insuranceClaim: 280.00,
    coPayment: 70.00,
    total: 350.00,
    status: "Paid",
    paymentMode: "Card",
    doctorRevenue: 150.00,
    hospitalShare: 200.00,
    deptRevenue: 200.00,
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
    subtotal: 200.00,
    zakat: 0,
    discount: 0,
    insuranceClaim: 180.00,
    coPayment: 20.00,
    total: 200.00,
    status: "Partial",
    paymentMode: "Cash",
    doctorRevenue: 80.00,
    hospitalShare: 120.00,
    deptRevenue: 120.00,
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
    subtotal: 850.00,
    zakat: 0,
    discount: 100.00,
    insuranceClaim: 600.00,
    coPayment: 150.00,
    total: 750.00,
    status: "Paid",
    paymentMode: "Online",
    doctorRevenue: 100.00,
    hospitalShare: 650.00,
    deptRevenue: 400.00,
    subDeptRevenue: 250.00,
    paymentDate: "2023-10-24 11:45 AM",
    createdBy: "k.williams",
  }
];

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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function Dashboard() {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* 1. Top Navbar (Fixed) */}
      <header className="flex-none h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg tracking-tight">
            <Activity className="w-6 h-6" />
            <span>MedFinance Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Button variant="ghost" className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 h-9 px-3">Transactions</Button>
            <Button variant="ghost" className="hover:bg-slate-100 h-9 px-3">Reports</Button>
            <Button variant="ghost" className="hover:bg-slate-100 h-9 px-3">Claims</Button>
            <Button variant="ghost" className="hover:bg-slate-100 h-9 px-3">Settlements</Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <Input 
              placeholder="Search MRN, Name..." 
              className="w-64 h-9 pl-9 bg-slate-50 border-slate-200 text-sm focus-visible:ring-indigo-500" 
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-700">
            <Bell className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-full border border-slate-200">
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

      {/* 2. Sticky Filter Bar & Summary Cards */}
      <div className="flex-none bg-white border-b border-slate-200 z-10 shadow-sm relative">
        
        {/* Filters */}
        <div className="p-3 px-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              Transaction Filters
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-slate-200 bg-white">Clear All</Button>
              <Button size="sm" className="h-8 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white">Apply Filters</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <Select defaultValue="today">
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Date Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cardio">Cardiology</SelectItem>
                <SelectItem value="ortho">Orthopedics</SelectItem>
                <SelectItem value="neuro">Neurology</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Sub-dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="opd">Outpatient</SelectItem>
                <SelectItem value="ipd">Inpatient</SelectItem>
                <SelectItem value="er">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Consultant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dr-chen">Dr. Robert Chen</SelectItem>
                <SelectItem value="dr-wong">Dr. Emily Wong</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Visit Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Visit</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
              </SelectContent>
            </Select>
            <Input className="h-8 text-xs bg-white border-slate-200" placeholder="Search Procedure..." />
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="p-3 px-4 bg-white grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SUMMARY_STATS.map((stat, i) => {
            const Icon = stat.icon;
            const isPositive = stat.trend.startsWith('+');
            return (
              <Card key={i} className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{stat.title}</p>
                    <p className="text-lg font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 3. Transaction List (Scrollable Area) */}
      <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
        <div className="max-w-[1600px] mx-auto space-y-3 pb-8">
          
          {/* Header Row for alignment context */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 rounded-md border border-slate-200">
            <div className="col-span-4">Visit Information</div>
            <div className="col-span-4">Billing & Status</div>
            <div className="col-span-3">Shares & Revenue</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Cards */}
          {TRANSACTIONS.map((trx) => (
            <Collapsible
              key={trx.id}
              open={expandedRows[trx.id]}
              onOpenChange={() => toggleRow(trx.id)}
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200"
            >
              {/* Main Card Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:items-center relative">
                
                {/* Column 1: Visit Info */}
                <div className="col-span-1 lg:col-span-4 flex gap-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 font-medium text-xs">
                      {trx.patientName.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 truncate">{trx.patientName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200">{trx.mrn}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1 truncate"><UserCircle className="w-3 h-3 text-slate-400" /> {trx.doctor}</div>
                      <div className="flex items-center gap-1 truncate"><Building2 className="w-3 h-3 text-slate-400" /> {trx.department}</div>
                      <div className="col-span-2 text-[11px] text-slate-500 truncate" title={trx.procedureName}>Proc: {trx.procedureName}</div>
                    </div>
                  </div>
                </div>

                {/* Mobile Divider */}
                <div className="lg:hidden h-px bg-slate-100 my-2"></div>

                {/* Column 2: Billing Info */}
                <div className="col-span-1 lg:col-span-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(trx.total)}</span>
                      <StatusBadge status={trx.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <PaymentModeBadge mode={trx.paymentMode} />
                      <span className="text-[10px] text-slate-500 font-mono">{trx.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-1 text-xs border-l border-slate-100 pl-3">
                    <div className="flex justify-between text-slate-500"><span>Subtotal:</span> <span className="font-medium text-slate-700">{formatCurrency(trx.subtotal)}</span></div>
                    {trx.discount > 0 && <div className="flex justify-between text-rose-500"><span>Discount:</span> <span>-{formatCurrency(trx.discount)}</span></div>}
                    <div className="flex justify-between text-indigo-600"><span>Co-Pay:</span> <span className="font-medium">{formatCurrency(trx.coPayment)}</span></div>
                  </div>
                </div>

                {/* Mobile Divider */}
                <div className="lg:hidden h-px bg-slate-100 my-2"></div>

                {/* Column 3: Shares & Revenue */}
                <div className="col-span-1 lg:col-span-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs border-l-0 lg:border-l lg:border-slate-100 lg:pl-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hospital Share</span>
                    <span className="font-medium text-slate-700">{formatCurrency(trx.hospitalShare)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Doctor Rev.</span>
                    <span className="font-medium text-slate-700">{formatCurrency(trx.doctorRevenue)}</span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Date</span>
                    <span className="text-slate-600 flex items-center gap-1"><Calendar className="w-3 h-3" /> {trx.paymentDate.split(' ')[0]}</span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Created By</span>
                    <span className="text-slate-600">{trx.createdBy}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 lg:col-span-1 flex items-center justify-end gap-1 absolute top-4 right-4 lg:relative lg:top-auto lg:right-auto">
                  <div className="flex lg:flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Print Receipt">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem><Edit className="w-3 h-3 mr-2" /> Edit Transaction</DropdownMenuItem>
                        <DropdownMenuItem><FileText className="w-3 h-3 mr-2" /> View Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600"><RotateCcw className="w-3 h-3 mr-2" /> Process Refund</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expand Toggle */}
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute bottom-1 right-1/2 translate-x-1/2 h-5 text-[10px] text-slate-400 hover:text-slate-600 lg:hidden"
                  >
                    {expandedRows[trx.id] ? "Less Details" : "More Details"}
                    {expandedRows[trx.id] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              {/* Collapsible Expanded Content */}
              <CollapsibleContent>
                <div className="bg-slate-50 border-t border-slate-100 p-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Patient & Visit Ext. */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-1 mb-2">Patient & Insurance</h4>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Phone:</span> <span className="col-span-2 font-medium">{trx.phone}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ref By:</span> <span className="col-span-2 font-medium">{trx.referredBy}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ins. Co:</span> <span className="col-span-2 font-medium">{trx.insuranceCompany}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ins. No:</span> <span className="col-span-2 font-medium font-mono">{trx.insuranceNo}</span></div>
                    </div>
                    
                    {/* Full Billing Ext. */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-1 mb-2">Billing Breakdown</h4>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Subtotal:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.subtotal)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Zakat:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.zakat)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Discount:</span> <span className="col-span-2 font-medium text-rose-600">{formatCurrency(trx.discount)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Ins. Claim:</span> <span className="col-span-2 font-medium text-purple-600">{formatCurrency(trx.insuranceClaim)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Total:</span> <span className="col-span-2 font-bold">{formatCurrency(trx.total)}</span></div>
                    </div>

                    {/* Revenue Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-1 mb-2">Internal Revenue</h4>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Dept Rev:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.deptRevenue)}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Sub-dept Rev:</span> <span className="col-span-2 font-medium">{formatCurrency(trx.subDeptRevenue)}</span></div>
                      <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-slate-200"><span className="text-slate-500">Processed:</span> <span className="col-span-2 font-medium">{trx.paymentDate}</span></div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 px-2">
            <div className="text-xs text-slate-500">
              Showing <span className="font-medium text-slate-900">1</span> to <span className="font-medium text-slate-900">5</span> of <span className="font-medium text-slate-900">124</span> transactions
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 bg-white" disabled>
                <span className="sr-only">Previous Page</span>
                <ChevronDown className="w-4 h-4 rotate-90" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 bg-indigo-50 text-indigo-700">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 bg-white">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 bg-white">3</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 bg-white">
                <span className="sr-only">Next Page</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
