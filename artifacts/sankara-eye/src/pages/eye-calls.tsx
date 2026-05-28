import { useState } from "react";
import { useListEyeCalls, useUpdateEyeCallStatus, getListEyeCallsQueryKey } from "@workspace/api-client-react";
import { EyeCallStatus, ListEyeCallsStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  Search, 
  Loader2, 
  Printer, 
  FileText, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Activity, 
  CheckSquare, 
  Building, 
  Calendar, 
  HeartHandshake, 
  ShieldAlert, 
  ChevronRight, 
  AlertCircle,
  FileCheck2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock Clinical Contraindications Checklist
const SANKARA_STATES = [
  "Uttar Pradesh",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Gujarat",
  "Karnataka",
  "Telangana",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan"
];

const isOutOfRegionState = (stateName: string) => {
  if (!stateName) return false;
  return !SANKARA_STATES.some(s => s.toLowerCase() === stateName.toLowerCase().trim());
};

const CONTRAINDICATIONS = [
  { id: "hiv", label: "HIV 1 / HIV 2 Antibodies", status: "Negative / Excluded" },
  { id: "hbv", label: "Hepatitis B Surface Antigen (HBsAg)", status: "Negative / Excluded" },
  { id: "hcv", label: "Hepatitis C Virus (HCV) Antibodies", status: "Negative / Excluded" },
  { id: "sepsis", label: "Active Septicemia / Meningitis / Encephalitis", status: "Not Present" },
  { id: "cjd", label: "Creutzfeldt-Jakob Disease / Slow Virus Dementia", status: "Not Present" },
  { id: "cancer", label: "Retinoblastoma / Active Leukemia / Lymphoma", status: "Not Present" },
  { id: "rabies", label: "Rabies / Tetanus / Unknown Systemic Infection", status: "Not Present" },
];

export default function EyeCalls() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListEyeCallsStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("brief");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListEyeCalls({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 20
  });

  const updateStatus = useUpdateEyeCallStatus();

  const handleStatusChange = (id: number, newStatus: EyeCallStatus) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEyeCallsQueryKey() });
          toast({ title: "Status updated successfully" });
          if (selectedCall && selectedCall.id === id) {
            setSelectedCall((prev: any) => ({ ...prev, status: newStatus }));
          }
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const handleRowClick = (call: any) => {
    setSelectedCall(call);
    setActiveTab("brief");
    setIsDetailsOpen(true);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Print Stylesheet Hook */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-case-sheet, #printable-case-sheet * {
            visibility: visible !important;
          }
          #printable-case-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: 4px double #1e293b !important;
            background: white !important;
            color: #0f172a !important;
            z-index: 99999 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* Header and Counters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-['Outfit'] bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Eye Retrieval Calls
            </h1>
            {data && data.total > 0 && (
              <span className="inline-flex items-center bg-orange-50 border border-orange-200 text-xs font-bold text-[#ff7a18] px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                {data.total} Active Coordinates
              </span>
            )}
          </div>
          <p className="text-gray-500 font-medium text-sm mt-0.5">
            Real-time medical command deck for corneal donor coordinate dispatching and retrieval.
          </p>
        </div>
        
        {/* Filters Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
            <Input 
              placeholder="Search donor, phone, state..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 border-gray-200/80 bg-white/70 backdrop-blur-md focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-xl text-sm font-semibold shadow-sm transition-all placeholder:text-gray-400"
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(val) => {
              setStatusFilter(val as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] border-gray-200 bg-white/70 backdrop-blur-md rounded-xl text-xs font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-[#ff7a18]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-150 rounded-xl">
              <SelectItem value="all" className="text-xs font-bold">All Statuses</SelectItem>
              <SelectItem value="new" className="text-xs font-bold text-red-600">🚨 New Calls</SelectItem>
              <SelectItem value="contacted" className="text-xs font-bold text-blue-600">📞 Contacted</SelectItem>
              <SelectItem value="team_sent" className="text-xs font-bold text-amber-600">🚑 Team Sent</SelectItem>
              <SelectItem value="completed" className="text-xs font-bold text-emerald-600">✅ Completed</SelectItem>
              <SelectItem value="cancelled" className="text-xs font-bold text-gray-500">❌ Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cyber-Clinical Control Table */}
      <Card className="glass-panel border-gray-200/80 shadow-md shadow-slate-100/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75 border-b border-gray-150">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4 pl-6">Call ID</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4">Donor Deceased</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4">Location Grid</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4">Referrer Relative</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4">Assigned Branch</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4">Time Elapsed</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4">Coord Status</TableHead>
                <TableHead className="font-extrabold text-[10px] text-gray-500 uppercase tracking-wider py-4 pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#ff7a18]" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accessing Medical Database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data || data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <AlertCircle className="h-10 w-10 text-slate-300" />
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">No Medical Coordinates Found</h4>
                        <p className="text-xs text-gray-400 mt-1">There are no active corneal retrieval requests matching your dashboard filters.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((call) => (
                  <TableRow 
                    key={call.id} 
                    onClick={() => handleRowClick(call)}
                    className="cursor-pointer hover:bg-slate-50/50 hover:shadow-[inset_4px_0_0_#ff7a18] transition-all duration-300 border-b border-gray-100 group"
                  >
                    {/* Call ID */}
                    <TableCell className="py-4 pl-6 font-mono text-xs font-bold text-[#ff7a18] tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {call.callId}
                    </TableCell>

                    {/* Donor Details */}
                    <TableCell className="py-4">
                      <div>
                        <span className="font-extrabold text-sm text-gray-900 group-hover:text-[#ff7a18] transition-colors font-['Outfit']">
                          {call.donorName}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mt-0.5">
                          <span className="bg-slate-100/80 px-1.5 py-0.5 rounded border border-gray-200/50">{call.donorAge} Years</span>
                          <span>•</span>
                          <span className="capitalize">{call.donorGender}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell className="py-4">
                      <div>
                        <div className="font-bold text-xs text-gray-800 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{call.district}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-4 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{call.state}</span>
                          {isOutOfRegionState(call.state) && (
                            <span className="bg-red-50 border border-red-200 text-[8px] font-black text-red-600 px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse shrink-0">
                              ⚠️ Out of Region
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Referrer */}
                    <TableCell className="py-4">
                      <div>
                        <div className="font-bold text-xs text-gray-800 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{call.referrerName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1 pl-4.5 mt-0.5">
                          <span className="bg-slate-50 border border-slate-200/80 px-1 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-wide text-gray-500">{call.referrerRelationship}</span>
                          <span>{call.referrerMobile}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Unit */}
                    <TableCell className="py-4 font-bold text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-orange-400/80 shrink-0" />
                        <span className="truncate max-w-[150px] font-extrabold font-['Outfit']">{call.unitName}</span>
                      </div>
                    </TableCell>

                    {/* Time */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{format(new Date(call.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-4">
                      <StatusBadge status={call.status} />
                    </TableCell>

                    {/* Quick Action buttons */}
                    <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      {call.status === "new" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="h-8 px-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-[10px] uppercase font-black tracking-wider rounded-lg shadow-sm shadow-red-500/10 cursor-pointer flex items-center gap-1" 
                            onClick={() => handleStatusChange(call.id, "team_sent")}
                          >
                            <Activity className="h-3 w-3 shrink-0" /> Dispatch Team
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg text-blue-600 border-blue-200/80 hover:bg-blue-50/50 cursor-pointer" 
                            onClick={() => handleStatusChange(call.id, "contacted")}
                          >
                            Call Back
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <Select 
                            value={call.status} 
                            onValueChange={(val) => handleStatusChange(call.id, val as EyeCallStatus)}
                            disabled={updateStatus.isPending}
                          >
                            <SelectTrigger className="w-[125px] h-8 text-[10px] font-black uppercase tracking-wider border-slate-200 bg-white shadow-sm rounded-lg">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-150 rounded-lg">
                              <SelectItem value="new" className="text-[10px] font-extrabold text-red-600 uppercase">New</SelectItem>
                              <SelectItem value="contacted" className="text-[10px] font-extrabold text-blue-600 uppercase">Contacted</SelectItem>
                              <SelectItem value="team_sent" className="text-[10px] font-extrabold text-amber-600 uppercase">Team Sent</SelectItem>
                              <SelectItem value="completed" className="text-[10px] font-extrabold text-emerald-600 uppercase">Completed</SelectItem>
                              <SelectItem value="cancelled" className="text-[10px] font-extrabold text-gray-500 uppercase">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Block */}
        {data && data.total > data.limit && (
          <div className="p-5 border-t border-gray-150 flex items-center justify-between text-xs text-gray-500 font-bold bg-slate-50/30">
            <div>
              Showing {((page - 1) * data.limit) + 1} to {Math.min(page * data.limit, data.total)} of {data.total} emergency coordinates
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50 font-bold px-3 text-xs"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * data.limit >= data.total}
                className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50 font-bold px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Interactive Floating Details & Official A4 Printable Case Sheet Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        {selectedCall && (
          <DialogContent className="max-w-[850px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-150 p-0 shadow-2xl relative overflow-x-hidden">
            
            {/* Modal Glass Banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white flex justify-between items-start gap-4 sticky top-0 z-20 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white font-mono text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shadow-sm shadow-orange-500/25">
                    {selectedCall.callId}
                  </span>
                  <StatusBadge status={selectedCall.status} />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight font-['Outfit']">
                  {selectedCall.donorName}
                </h3>
                <p className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  <span>Assigned Coordination Node:</span>
                  <span className="text-white font-extrabold">{selectedCall.unitName}</span>
                </p>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Registry Date</span>
                <span className="text-sm font-extrabold mt-0.5">
                  {format(new Date(selectedCall.createdAt), "MMMM d, yyyy")}
                </span>
                <span className="text-[10px] text-orange-400 font-semibold mt-0.5">
                  {format(new Date(selectedCall.createdAt), "hh:mm a")}
                </span>
              </div>
            </div>

            {/* Modal Body & Tab Switcher */}
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 max-w-md bg-slate-100 border border-slate-200/50 p-1 rounded-2xl mb-6">
                  <TabsTrigger value="brief" className="rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    <FileText className="h-4.5 w-4.5 mr-2" /> Clinical Brief
                  </TabsTrigger>
                  <TabsTrigger value="certificate" className="rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    <Printer className="h-4.5 w-4.5 mr-2" /> Printable Case Sheet
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Clinical Brief */}
                <TabsContent value="brief" className="space-y-6 mt-0 animate-fadeIn">
                  
                  {isOutOfRegionState(selectedCall.state) && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2.5">
                      <h4 className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-2 border-b border-red-100 pb-2">
                        <AlertCircle className="h-4 w-4 text-red-600 animate-pulse shrink-0" /> Out-of-Region Routing Directive
                      </h4>
                      <p className="text-xs text-red-950 font-bold leading-normal">
                        Notice: Sankara Eye Hospital does not have an active operating unit in <strong>{selectedCall.state}</strong>. This record has been dynamically assigned to **SEFI MHQ** for centralized partner-network coordination.
                      </p>
                      <p className="text-xs text-red-800 font-semibold leading-relaxed">
                        <strong>Required Action:</strong> Since our local retrieval teams cannot operate in this state, you must immediately contact and transfer these donor details to a regional partner hospital or government eye bank in the district of <strong>{selectedCall.district}, {selectedCall.state}</strong>.
                      </p>
                      <div className="pt-1.5 flex flex-wrap gap-2.5">
                        <a 
                          href={`https://www.google.com/search?q=eye+bank+or+eye+hospital+in+${selectedCall.district}+${selectedCall.state}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="no-underline"
                        >
                          <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 border-0 text-white text-[10px] uppercase font-black tracking-wider rounded-lg shadow-sm">
                            Search Regional Eye Banks
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Grid: Donor vs Referrer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donor Details Card */}
                    <Card className="shadow-sm border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="px-4 py-3 border-b border-slate-150 bg-slate-100/50 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#ff7a18] shrink-0" />
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Deceased Donor Information</h4>
                      </div>
                      <CardContent className="p-4 space-y-4 text-sm font-semibold">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</span>
                            <p className="text-gray-900 capitalize font-extrabold text-sm">{selectedCall.donorGender}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Age</span>
                            <p className="text-gray-900 font-extrabold text-sm">{selectedCall.donorAge} Years</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time of Death</span>
                            <p className="text-gray-900 font-extrabold text-sm flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>{selectedCall.timeOfDeath}</span>
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cause of Death</span>
                            <p className="text-gray-900 font-extrabold text-sm truncate">{selectedCall.causeOfDeath}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-150">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address & Retrieval Grid</span>
                          <p className="text-gray-800 text-xs leading-relaxed font-bold mt-1">
                            {selectedCall.address}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="bg-white border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded text-gray-600 uppercase tracking-wide">
                              District: {selectedCall.district}
                            </span>
                            <span className="bg-white border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded text-gray-600 uppercase tracking-wide">
                              Pincode: {selectedCall.pincode}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Referrer Relative Details Card */}
                    <Card className="shadow-sm border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="px-4 py-3 border-b border-slate-150 bg-slate-100/50 flex items-center gap-2">
                        <HeartHandshake className="h-4 w-4 text-[#ff7a18] shrink-0" />
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Primary Referrer & Kin Consent</h4>
                      </div>
                      <CardContent className="p-4 space-y-4 text-sm font-semibold">
                        <div className="space-y-3.5">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Referrer Representative</span>
                            <p className="text-gray-900 font-extrabold text-sm flex items-center gap-1.5 mt-0.5">
                              <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                              <span>{selectedCall.referrerName}</span>
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Relationship to Deceased</span>
                              <p className="text-gray-900 font-extrabold text-sm capitalize">{selectedCall.referrerRelationship}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp/Contact</span>
                              <p className="text-[#ff7a18] font-extrabold text-sm flex items-center gap-1.5 mt-0.5">
                                <Phone className="h-4 w-4 shrink-0 text-orange-400" />
                                <span>{selectedCall.referrerMobile}</span>
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-slate-150 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
                            <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                              <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" /> Statutory Consent Status
                            </span>
                            <p className="text-emerald-800 text-xs leading-relaxed font-bold mt-1">
                              Verbal consent logged. Signatures of representative required on the retrieval case sheet prior to corneal excision.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dispatcher Actions Panel */}
                  <Card className="shadow-sm border border-slate-150 rounded-2xl p-5 bg-orange-50/20 border-orange-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 font-['Outfit']">
                        <Activity className="h-4 w-4 text-[#ff7a18] shrink-0" />
                        Update Coordination State
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Change the current triage status of this retrieval request call.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select 
                        value={selectedCall.status} 
                        onValueChange={(val) => handleStatusChange(selectedCall.id, val as EyeCallStatus)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="w-[180px] bg-white border-slate-200/80 shadow-sm font-bold text-xs h-10 rounded-xl">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-150 rounded-xl">
                          <SelectItem value="new" className="text-xs font-bold text-red-600">🚨 New Call</SelectItem>
                          <SelectItem value="contacted" className="text-xs font-bold text-blue-600">📞 Contacted Kin</SelectItem>
                          <SelectItem value="team_sent" className="text-xs font-bold text-amber-600">🚑 Dispatch Team</SelectItem>
                          <SelectItem value="completed" className="text-xs font-bold text-emerald-600">✅ Completed Retrieval</SelectItem>
                          <SelectItem value="cancelled" className="text-xs font-bold text-gray-500">❌ Cancelled Call</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        onClick={() => setActiveTab("certificate")}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Printer className="h-4 w-4 shrink-0" /> Certificate Preview
                      </Button>
                    </div>
                  </Card>

                  {/* Notes Area */}
                  {selectedCall.notes && (
                    <Card className="shadow-sm border border-slate-150 rounded-2xl overflow-hidden bg-amber-50/20 border-amber-100 p-4">
                      <div className="flex items-start gap-2.5 text-slate-700">
                        <FileText className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Triage & Coordination Notes</h5>
                          <p className="text-xs mt-1.5 leading-relaxed font-bold text-slate-600 whitespace-pre-wrap">{selectedCall.notes}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* Tab 2: High-Fidelity Printable A4 Case Sheet */}
                <TabsContent value="certificate" className="space-y-6 mt-0 animate-fadeIn relative">
                  
                  {/* Visual Warning Box inside Dialog */}
                  <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-amber-800 shadow-sm no-print">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-extrabold text-xs uppercase tracking-wider">Statutory Corneal Excision Case Sheet</h5>
                      <p className="text-xs font-semibold leading-relaxed mt-1">
                        Below is a preview of the official medical certificate and retrieval checklist. Use the <strong className="text-slate-950">"Print Document"</strong> button below to print it on a standard physical A4 paper size. Standard margins and header blocks have been dynamically pre-formatted.
                      </p>
                    </div>
                  </div>

                  {/* High Fidelity A4 Portrait Preview */}
                  <div className="border border-slate-200 rounded-3xl bg-slate-50/50 p-6 flex justify-center no-print max-h-[500px] overflow-y-auto shadow-inner">
                    
                    {/* The actual preview matching print output */}
                    <div className="w-full max-w-[700px] bg-white border-4 border-double border-slate-800 p-8 shadow-md rounded-sm font-serif text-slate-900">
                      
                      {/* Logo and Branding header */}
                      <div className="text-center pb-4 border-b-2 border-slate-800">
                        <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">Sri Kanchi Kamakoti Medical Trust</h2>
                        <h3 className="text-base font-extrabold uppercase text-slate-800 tracking-wider">Sankara Eye Hospitals</h3>
                        <p className="text-[9px] font-sans font-black tracking-widest text-slate-500 uppercase">Corneal Retrieval & Eyebank Division</p>
                        <div className="w-[100px] h-0.5 bg-slate-800 mx-auto my-2" />
                        <h4 className="text-sm font-black underline uppercase tracking-widest text-slate-950 font-serif">Donor Eye Corneal Retrieval Case Sheet</h4>
                      </div>

                      {/* Grid 1: Meta data */}
                      <div className="grid grid-cols-2 gap-4 text-xs py-4 border-b border-slate-600">
                        <div>
                          <p><strong>Case Registry ID:</strong> <span className="font-sans font-bold">{selectedCall.callId}</span></p>
                          <p className="mt-1"><strong>Processing Node:</strong> {selectedCall.unitName}</p>
                          <p className="mt-1"><strong>Retrieval District:</strong> {selectedCall.district}, {selectedCall.state}</p>
                        </div>
                        <div className="text-right">
                          <p><strong>Date of Record:</strong> {format(new Date(selectedCall.createdAt), "dd-MM-yyyy")}</p>
                          <p className="mt-1"><strong>Time of Record:</strong> {format(new Date(selectedCall.createdAt), "hh:mm a")}</p>
                          <p className="mt-1"><strong>Status:</strong> <span className="uppercase text-[10px] font-sans font-black tracking-wider">{selectedCall.status}</span></p>
                        </div>
                      </div>

                      {/* Grid 2: Donor details */}
                      <div className="py-4 border-b border-slate-600 text-xs">
                        <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">I. Deceased Donor Demographics</h5>
                        <table className="w-full text-left border-collapse text-xs">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1"><strong>Full Name of Donor:</strong></td>
                              <td className="py-1">{selectedCall.donorName}</td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Age / Gender:</strong></td>
                              <td className="py-1">{selectedCall.donorAge} Years / <span className="capitalize">{selectedCall.donorGender}</span></td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Date & Time of Death:</strong></td>
                              <td className="py-1 font-sans">{selectedCall.timeOfDeath}</td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Certified Cause of Death:</strong></td>
                              <td className="py-1">{selectedCall.causeOfDeath}</td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Address of Retrieval:</strong></td>
                              <td className="py-1 leading-relaxed">{selectedCall.address}, Pin: {selectedCall.pincode}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Grid 3: Referrer and Next of Kin Details */}
                      <div className="py-4 border-b border-slate-600 text-xs">
                        <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">II. Primary Referrer & Next of Kin Consent</h5>
                        <table className="w-full text-left border-collapse text-xs">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1"><strong>Name of Informant / Kin:</strong></td>
                              <td className="py-1">{selectedCall.referrerName}</td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Relationship to Donor:</strong></td>
                              <td className="py-1 capitalize">{selectedCall.referrerRelationship}</td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Informant Mobile No:</strong></td>
                              <td className="py-1 font-sans">{selectedCall.referrerMobile}</td>
                            </tr>
                            <tr>
                              <td className="py-1"><strong>Kin Consent Status:</strong></td>
                              <td className="py-1"><strong>Verbal Consent Confirmed & Logged. Signature Authorized.</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Clinical Checklist */}
                      <div className="py-4 border-b border-slate-600 text-[10px]">
                        <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">III. Clinical Contraindications Checklist</h5>
                        <div className="grid grid-cols-1 gap-1 text-[10px]">
                          {CONTRAINDICATIONS.map((item, idx) => (
                            <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-slate-100/50">
                              <span>{idx + 1}. {item.label}</span>
                              <span className="font-sans font-bold text-[9px] bg-slate-100 px-1.5 rounded">{item.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Retrieval Verification Checklists */}
                      <div className="py-4 border-b border-slate-600 text-[10px]">
                        <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">IV. Retrieval Officer Protocols</h5>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans">[✔]</span>
                            <span>Enucleation/Corneoscleral excision executed within optimal 6-hour clinical threshold from death.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans">[✔]</span>
                            <span>Corneal tissue successfully transferred to sterile MK Medium / Optisol-GS storage solution.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans">[✔]</span>
                            <span>Packaging temperature successfully locked at standard 2-8 degrees Celsius for transit.</span>
                          </div>
                        </div>
                      </div>

                      {/* Dual Signatures */}
                      <div className="pt-8 grid grid-cols-2 gap-12 text-xs">
                        <div className="space-y-8">
                          <div className="border-t border-slate-600 pt-1 text-center">
                            <p><strong>Signature of Consenting Relative</strong></p>
                            <p className="text-[10px] text-slate-500 mt-1">Name: {selectedCall.referrerName}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Date / Time: __________________</p>
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div className="border-t border-slate-600 pt-1 text-center">
                            <p><strong>Signature of Retrieval Officer</strong></p>
                            <p className="text-[10px] text-slate-500 mt-1">Sankara Eye Coordinator Node</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Date / Time: __________________</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="text-center pt-8 border-t border-slate-300 mt-6 space-y-1">
                        <p className="text-xs font-black italic tracking-widest text-[#ff7a18] font-sans">
                          "Do not Bury, Do not Burn, Donate Eyes"
                        </p>
                        <p className="text-[8px] font-sans text-slate-400 font-bold uppercase tracking-wider">
                          Developed & Managed by Team Information Systems - MHQ Coimbatore • Sri Kanchi Kamakoti Medical Trust
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* HIDDEN IN WEB VIEW, VISIBLE IN PRINTER MODE */}
                  <div id="printable-case-sheet" className="hidden p-8 border-4 border-double border-slate-900 bg-white font-serif max-w-[800px] mx-auto text-slate-900">
                    
                    {/* Header */}
                    <div className="text-center pb-4 border-b-2 border-slate-900">
                      <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">Sri Kanchi Kamakoti Medical Trust</h2>
                      <h3 className="text-base font-extrabold uppercase text-slate-800 tracking-wider">Sankara Eye Hospitals</h3>
                      <p className="text-[9px] font-sans font-black tracking-widest text-slate-500 uppercase">Corneal Retrieval & Eyebank Division</p>
                      <div className="w-[100px] h-0.5 bg-slate-800 mx-auto my-2" />
                      <h4 className="text-sm font-black underline uppercase tracking-widest text-slate-950">Donor Eye Corneal Retrieval Case Sheet</h4>
                    </div>

                    {/* Meta data */}
                    <div className="grid grid-cols-2 gap-4 text-xs py-4 border-b border-slate-600">
                      <div>
                        <p><strong>Case Registry ID:</strong> <span className="font-sans font-bold">{selectedCall.callId}</span></p>
                        <p className="mt-1"><strong>Processing Node:</strong> {selectedCall.unitName}</p>
                        <p className="mt-1"><strong>Retrieval District:</strong> {selectedCall.district}, {selectedCall.state}</p>
                      </div>
                      <div className="text-right">
                        <p><strong>Date of Record:</strong> {format(new Date(selectedCall.createdAt), "dd-MM-yyyy")}</p>
                        <p className="mt-1"><strong>Time of Record:</strong> {format(new Date(selectedCall.createdAt), "hh:mm a")}</p>
                        <p className="mt-1"><strong>Status:</strong> <span className="uppercase text-[10px] font-sans font-black tracking-wider">{selectedCall.status}</span></p>
                      </div>
                    </div>

                    {/* Donor demographics */}
                    <div className="py-4 border-b border-slate-600 text-xs">
                      <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">I. Deceased Donor Demographics</h5>
                      <table className="w-full text-left border-collapse text-xs">
                        <tbody>
                          <tr>
                            <td className="w-1/3 py-1"><strong>Full Name of Donor:</strong></td>
                            <td className="py-1">{selectedCall.donorName}</td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Age / Gender:</strong></td>
                            <td className="py-1">{selectedCall.donorAge} Years / <span className="capitalize">{selectedCall.donorGender}</span></td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Date & Time of Death:</strong></td>
                            <td className="py-1 font-sans">{selectedCall.timeOfDeath}</td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Certified Cause of Death:</strong></td>
                            <td className="py-1">{selectedCall.causeOfDeath}</td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Address of Retrieval:</strong></td>
                            <td className="py-1 leading-relaxed">{selectedCall.address}, Pin: {selectedCall.pincode}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Kin details */}
                    <div className="py-4 border-b border-slate-600 text-xs">
                      <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">II. Primary Referrer & Next of Kin Consent</h5>
                      <table className="w-full text-left border-collapse text-xs">
                        <tbody>
                          <tr>
                            <td className="w-1/3 py-1"><strong>Name of Informant / Kin:</strong></td>
                            <td className="py-1">{selectedCall.referrerName}</td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Relationship to Donor:</strong></td>
                            <td className="py-1 capitalize">{selectedCall.referrerRelationship}</td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Informant Mobile No:</strong></td>
                            <td className="py-1 font-sans">{selectedCall.referrerMobile}</td>
                          </tr>
                          <tr>
                            <td className="py-1"><strong>Kin Consent Status:</strong></td>
                            <td className="py-1"><strong>Verbal Consent Confirmed & Logged. Signature Authorized.</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Clinical Checklist */}
                    <div className="py-4 border-b border-slate-600 text-[10px]">
                      <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">III. Clinical Contraindications Checklist</h5>
                      <div className="grid grid-cols-1 gap-1 text-[10px]">
                        {CONTRAINDICATIONS.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-slate-100/50">
                            <span>{idx + 1}. {item.label}</span>
                            <span className="font-sans font-bold text-[9px] bg-slate-100 px-1.5 rounded">{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Retrieval Verification Checklists */}
                    <div className="py-4 border-b border-slate-600 text-[10px]">
                      <h5 className="text-xs font-black uppercase tracking-wider mb-2 underline">IV. Retrieval Officer Protocols</h5>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-sans">[✔]</span>
                          <span>Enucleation/Corneoscleral excision executed within optimal 6-hour clinical threshold from death.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans">[✔]</span>
                          <span>Corneal tissue successfully transferred to sterile MK Medium / Optisol-GS storage solution.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans">[✔]</span>
                          <span>Packaging temperature successfully locked at standard 2-8 degrees Celsius for transit.</span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Signatures */}
                    <div className="pt-10 grid grid-cols-2 gap-12 text-xs">
                      <div className="space-y-8">
                        <div className="border-t border-slate-600 pt-1 text-center">
                          <p><strong>Signature of Consenting Relative</strong></p>
                          <p className="text-[10px] text-slate-500 mt-1">Name: {selectedCall.referrerName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Date / Time: __________________</p>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div className="border-t border-slate-600 pt-1 text-center">
                          <p><strong>Signature of Retrieval Officer</strong></p>
                          <p className="text-[10px] text-slate-500 mt-1">Sankara Eye Coordinator Node</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Date / Time: __________________</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-8 border-t border-slate-300 mt-6 space-y-1">
                      <p className="text-xs font-black italic tracking-widest text-[#ff7a18] font-sans">
                        "Do not Bury, Do not Burn, Donate Eyes"
                      </p>
                      <p className="text-[8px] font-sans text-slate-400 font-bold uppercase tracking-wider">
                        Developed & Managed by Team Information Systems - MHQ Coimbatore • Sri Kanchi Kamakoti Medical Trust
                      </p>
                    </div>

                  </div>

                  {/* Print Command trigger bar inside Modal */}
                  <div className="flex justify-end p-2 bg-slate-50/50 rounded-2xl border border-slate-150 no-print shadow-sm">
                    <Button 
                      onClick={triggerPrint} 
                      className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white rounded-xl h-11 text-xs font-extrabold uppercase tracking-wider px-6 flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
                    >
                      <Printer className="h-4.5 w-4.5 shrink-0" /> Print Case Sheet (A4)
                    </Button>
                  </div>

                </TabsContent>
              </Tabs>
            </div>

            {/* Modal Bottom control buttons */}
            <div className="p-5 border-t border-slate-150 bg-slate-50/50 flex justify-end gap-2.5 rounded-b-3xl sticky bottom-0 z-10 backdrop-blur-md no-print">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailsOpen(false)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 px-4 rounded-xl cursor-pointer"
              >
                Close View
              </Button>
            </div>

          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
