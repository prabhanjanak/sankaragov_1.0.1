import { Card, CardContent } from "@/components/ui/card";
import { useListEyeCalls } from "@workspace/api-client-react";
import { Bell, Clock, AlertCircle, Loader2, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Notifications() {
  // Polling every 15 seconds to simulate real-time notifications
  const { data: callsResponse, isLoading } = useListEyeCalls(
    { status: "new", limit: 20 }
  );

  const newCalls = callsResponse?.data || [];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 p-2.5 rounded-xl relative">
          <Bell className="h-6 w-6 text-orange-600" />
          {newCalls && newCalls.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Active Alerts</h1>
          <p className="text-sm text-gray-500 font-medium">Real-time emergency eye donation alerts</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7a18] mx-auto" />
            <span className="text-xs text-gray-500 font-bold mt-2 block">Scanning radar frequency...</span>
          </div>
        ) : newCalls && newCalls.length > 0 ? (
          newCalls.map((call) => (
            <Link key={call.id} href="/eye-calls">
              <Card className="border border-red-200/80 shadow-md hover:shadow-lg hover:scale-[1.015] hover:border-red-500/35 transition-all duration-300 bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden group relative select-none cursor-pointer">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-400 animate-pulse" />
                <div className="bg-red-50/40 px-4 py-3 border-b border-red-100/60 flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 text-red-700 font-black text-xs uppercase tracking-wider font-['Outfit']">
                    <AlertCircle size={16} className="animate-pulse text-red-600" /> Critical Emergency Call: {call.callId}
                  </div>
                  <div className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <Clock size={12} /> {formatDistanceToNow(new Date(call.createdAt!), { addSuffix: true })}
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">{call.referrerName}</h3>
                    <p className="text-xs text-gray-500 font-medium font-mono mt-0.5">{call.referrerMobile}</p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                      <MapPin size={12} className="text-[#ff7a18]" /> Location: {call.district}, {call.state}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex bg-gradient-to-r from-red-600 to-rose-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider group-hover:scale-105 transition-all shadow-md shadow-red-500/10 cursor-pointer">
                      Dispatch Coordinator &rarr;
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="bg-white/70 backdrop-blur-md border border-gray-250/70 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center select-none shadow-sm">
            <div className="bg-[#ff7a18]/5 p-4.5 rounded-2xl mb-4 border border-[#ff7a18]/10 text-[#ff7a18] shadow-inner">
              <Bell className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 font-['Outfit']">Radar Frequency Clear</h3>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xs font-semibold leading-relaxed">No new active emergency dispatches detected. The hospital network is running completely smoothly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
