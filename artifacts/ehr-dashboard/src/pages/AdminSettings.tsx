import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Activity,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  GitBranch,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

type SubDepartment = {
  id: string;
  name: string;
  active: boolean;
};

type Department = {
  id: string;
  name: string;
  active: boolean;
  subDepartments: SubDepartment[];
};

const INITIAL_DATA: Department[] = [
  {
    id: "d1",
    name: "Cardiology",
    active: true,
    subDepartments: [
      { id: "sd1-1", name: "Outpatient", active: true },
      { id: "sd1-2", name: "Inpatient", active: false },
    ],
  },
  {
    id: "d2",
    name: "Orthopedics",
    active: true,
    subDepartments: [
      { id: "sd2-1", name: "Surgery", active: true },
      { id: "sd2-2", name: "Rehabilitation", active: true },
    ],
  },
  {
    id: "d3",
    name: "Neurology",
    active: false,
    subDepartments: [
      { id: "sd3-1", name: "Consultation", active: true },
    ],
  },
  {
    id: "d4",
    name: "Pediatrics",
    active: true,
    subDepartments: [
      { id: "sd4-1", name: "Vaccination", active: true },
      { id: "sd4-2", name: "ICU", active: false },
    ],
  },
];

export function AdminSettings() {
  const [, setLocation] = useLocation();
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DATA);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    d1: true,
    d2: true,
    d3: false,
    d4: true,
  });

  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editingSubDept, setEditingSubDept] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [addingDept, setAddingDept] = useState(false);
  const [addingSubDeptTo, setAddingSubDeptTo] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");

  const toggleDeptCollapse = (id: string) => {
    setExpandedDepts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleDeptActive = (id: string) => {
    setDepartments(departments.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const handleToggleSubDeptActive = (deptId: string, subId: string) => {
    setDepartments(departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          subDepartments: d.subDepartments.map(sd => sd.id === subId ? { ...sd, active: !sd.active } : sd)
        };
      }
      return d;
    }));
  };

  const handleDeleteDept = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
  };

  const handleDeleteSubDept = (deptId: string, subId: string) => {
    setDepartments(departments.map(d => {
      if (d.id === deptId) {
        return { ...d, subDepartments: d.subDepartments.filter(sd => sd.id !== subId) };
      }
      return d;
    }));
  };

  const saveDeptEdit = (id: string) => {
    if (editValue.trim()) {
      setDepartments(departments.map(d => d.id === id ? { ...d, name: editValue.trim() } : d));
    }
    setEditingDept(null);
  };

  const saveSubDeptEdit = (deptId: string, subId: string) => {
    if (editValue.trim()) {
      setDepartments(departments.map(d => {
        if (d.id === deptId) {
          return {
            ...d,
            subDepartments: d.subDepartments.map(sd => sd.id === subId ? { ...sd, name: editValue.trim() } : sd)
          };
        }
        return d;
      }));
    }
    setEditingSubDept(null);
  };

  const saveNewDept = () => {
    if (addValue.trim()) {
      const newDept: Department = {
        id: `d-${Date.now()}`,
        name: addValue.trim(),
        active: true,
        subDepartments: [],
      };
      setDepartments([...departments, newDept]);
      setExpandedDepts({ ...expandedDepts, [newDept.id]: true });
    }
    setAddingDept(false);
    setAddValue("");
  };

  const saveNewSubDept = (deptId: string) => {
    if (addValue.trim()) {
      setDepartments(departments.map(d => {
        if (d.id === deptId) {
          return {
            ...d,
            subDepartments: [...d.subDepartments, { id: `sd-${Date.now()}`, name: addValue.trim(), active: true }]
          };
        }
        return d;
      }));
    }
    setAddingSubDeptTo(null);
    setAddValue("");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <header className="z-20 flex h-14 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#4982CF]">
            <Activity className="h-6 w-6" />
            <span>MedFinance Pro</span>
          </div>
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="flex items-center h-9 px-3 hover:bg-slate-100 rounded-md">Transactions</Link>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Reports</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Claims</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Settlements</Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search MRN, Name..." className="h-9 w-64 border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:ring-[#4982CF]" />
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
              <DropdownMenuItem onClick={() => setLocation("/admin")}>Admin Settings</DropdownMenuItem>
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sub-Navbar */}
        <aside className="w-60 flex-none border-r border-slate-200 bg-white">
          <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4 text-sm font-bold text-slate-800">
            <Settings className="h-4 w-4 text-[#4982CF]" />
            Admin Settings
          </div>
          <nav className="space-y-1 p-3">
            <Button variant="ghost" className="w-full justify-start gap-3 bg-[#4982CF]/10 text-[#4982CF] hover:bg-[#4982CF]/15">
              <Building2 className="h-4 w-4" />
              Departments
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:bg-transparent" disabled>
              <Stethoscope className="h-4 w-4" />
              Doctors <span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:bg-transparent" disabled>
              <Layers className="h-4 w-4" />
              Services <span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:bg-transparent" disabled>
              <GitBranch className="h-4 w-4" />
              Branches <span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>
            </Button>
          </nav>
        </aside>

        {/* Right Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Departments & Sub-Departments</h1>
                <p className="mt-1 text-sm text-slate-500">Manage hospital departments and their active status for billing.</p>
              </div>
              <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={() => { setAddingDept(true); setAddValue(""); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>

            <div className="space-y-3">
              {departments.map((dept) => (
                <Collapsible key={dept.id} open={expandedDepts[dept.id]} onOpenChange={() => toggleDeptCollapse(dept.id)} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all">
                  <div className="flex items-center gap-4 border-b border-slate-100 p-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                        {expandedDepts[dept.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <div className="flex-1">
                      {editingDept === dept.id ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            autoFocus
                            className="h-8 w-64 font-medium" 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveDeptEdit(dept.id)}
                            onBlur={() => saveDeptEdit(dept.id)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">{dept.name}</span>
                          <Badge className={dept.active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200" : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200"}>
                            {dept.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                        <span className="text-xs font-medium text-slate-500">Status</span>
                        <Switch checked={dept.active} onCheckedChange={() => handleToggleDeptActive(dept.id)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]" onClick={() => { setEditingDept(dept.id); setEditValue(dept.name); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDeleteDept(dept.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="bg-slate-50 p-4">
                      <div className="rounded-lg border border-slate-200 bg-white">
                        {dept.subDepartments.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">No sub-departments found.</div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {dept.subDepartments.map(sub => (
                              <div key={sub.id} className="flex items-center gap-4 p-3 pl-10 hover:bg-slate-50/50">
                                <LayoutGrid className="h-4 w-4 text-slate-300" />
                                <div className="flex-1">
                                  {editingSubDept === sub.id ? (
                                    <Input 
                                      autoFocus
                                      className="h-8 w-56 text-sm" 
                                      value={editValue} 
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && saveSubDeptEdit(dept.id, sub.id)}
                                      onBlur={() => saveSubDeptEdit(dept.id, sub.id)}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                                      <Badge variant="outline" className={sub.active ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"}>
                                        {sub.active ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <Switch className="scale-75" checked={sub.active} onCheckedChange={() => handleToggleSubDeptActive(dept.id, sub.id)} />
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#4982CF]" onClick={() => { setEditingSubDept(sub.id); setEditValue(sub.name); }}>
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => handleDeleteSubDept(dept.id, sub.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {addingSubDeptTo === dept.id && (
                          <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 p-3 pl-10">
                            <LayoutGrid className="h-4 w-4 text-slate-300" />
                            <Input 
                              autoFocus
                              placeholder="New Sub-department Name" 
                              className="h-8 flex-1 text-sm" 
                              value={addValue} 
                              onChange={(e) => setAddValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveNewSubDept(dept.id)}
                            />
                            <Button size="sm" className="h-8 bg-[#4982CF] hover:bg-[#3D73BC]" onClick={() => saveNewSubDept(dept.id)}>Save</Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => { setAddingSubDeptTo(null); setAddValue(""); }}><X className="h-4 w-4"/></Button>
                          </div>
                        )}
                      </div>
                      
                      {addingSubDeptTo !== dept.id && (
                        <Button variant="outline" size="sm" className="mt-3 border-dashed border-slate-300 bg-transparent text-[#4982CF] hover:bg-[#4982CF]/5 hover:border-[#4982CF]/50" onClick={() => { setAddingSubDeptTo(dept.id); setAddValue(""); }}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Sub-Department
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}

              {addingDept && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
                  <div className="flex h-6 w-6 items-center justify-center">
                    <Building2 className="h-4 w-4 text-[#4982CF]" />
                  </div>
                  <Input 
                    autoFocus
                    placeholder="New Department Name" 
                    className="h-9 max-w-sm font-medium" 
                    value={addValue} 
                    onChange={(e) => setAddValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveNewDept()}
                  />
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="border-slate-200" onClick={() => { setAddingDept(false); setAddValue(""); }}>Cancel</Button>
                    <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={saveNewDept}>Save Department</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
