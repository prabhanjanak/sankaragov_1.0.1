import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPublicEyeCall, useListPublicUnits } from "@workspace/api-client-react";
import { INDIA_STATES, BASE_PATH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, Phone, Send, Heart, AlertCircle, Award, HeartHandshake,
  Download, Share2, Activity, ArrowLeft, Clock, ShieldAlert, Sparkles, MapPin, Building2, User, Users, Mail
} from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Indian Mobile Validation Regex: starts with +91 [6-9] followed by 9 digits
const mobileRegex = /^\+91 [6-9]\d{9}$/;

// 🚨 Zod Schema for EMERGENCY quick report — now includes Deceased Person details
const emergencySchema = z.object({
  referrerName: z.string().min(2, "Your name is required"),
  referrerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number"),
  referrerRelationship: z.string().min(2, "Relationship to deceased is required"),
  donorName: z.string().min(2, "Deceased person's full name is required"),
  donorAge: z.coerce.number().min(0, "Age must be positive").max(120, "Age must be under 120"),
  donorGender: z.enum(["male", "female", "other"]),
  timeOfDeath: z.string().min(3, "Approximate time of death is required"),
  causeOfDeath: z.string().min(2, "Cause of death is required"),
  address: z.string().min(5, "Address of eye collection is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  unitId: z.coerce.number().min(1, "Please select the nearest Sankara hospital branch"),
});

// ✍️ Zod Schema for FUTURE eye pledge
const pledgeSchema = z.object({
  pledgerName: z.string().min(2, "Your name is required"),
  pledgerAge: z.coerce.number().min(1, "Enter a valid age").max(120, "Age must be below 120"),
  pledgerGender: z.enum(["male", "female", "other"]),
  pledgerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number"),
  pledgerEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  unitId: z.coerce.number().min(1, "Please select nearest Sankara hospital"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
});

type EmergencyValues = z.infer<typeof emergencySchema>;
type PledgeValues = z.infer<typeof pledgeSchema>;

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

const getMhqUnit = (unitsList: any[]) => {
  if (!unitsList) return null;
  return unitsList.find(u => 
    u.name.toLowerCase().includes("mhq") || 
    u.name.toLowerCase().includes("head quarters") ||
    u.name.toLowerCase().includes("headquarters")
  ) || unitsList[0];
};

// Helper to automatically select the hospital if there is exactly one in the state
const getAutoSelectedUnitForState = (state: string, unitsList: any[]) => {
  if (!unitsList || unitsList.length === 0 || !state) return null;
  const stateLower = state.toLowerCase().trim();
  const stateUnits = unitsList.filter(u => u.state.toLowerCase().trim() === stateLower);
  return stateUnits.length === 1 ? stateUnits[0] : null;
};

export default function Donate() {
  const [successData, setSuccessData] = useState<{ 
    whatsappUrl: string; 
    callId: string; 
    pledgerName?: string;
    pledgeDate?: string;
    unitName?: string;
  } | null>(null);

  const { data: units } = useListPublicUnits();
  const submitCall = useSubmitPublicEyeCall();

  // Scroll to section based on intent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    if (intent === "pledge") {
      setActiveTab("pledge");
    } else if (intent === "emergency") {
      setActiveTab("emergency");
    }
  }, []);

  const [activeTab, setActiveTab] = useState("emergency");

  // 1. Emergency Form Hook
  const emergencyForm = useForm<EmergencyValues>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      referrerName: "",
      referrerMobile: "+91 ",
      referrerRelationship: "",
      donorName: "",
      donorAge: undefined as any,
      donorGender: "male",
      timeOfDeath: "",
      causeOfDeath: "",
      address: "",
      pincode: "",
      state: "",
      district: "",
      unitId: 0,
    },
  });

  // 2. Pledge Form Hook
  const pledgeForm = useForm<PledgeValues>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      pledgerName: "",
      pledgerAge: undefined as any,
      pledgerGender: "male",
      pledgerMobile: "+91 ",
      pledgerEmail: "",
      unitId: 0,
      state: "",
      district: "",
    },
  });

  // Emergency form state/district watchers
  const emergencySelectedState = emergencyForm.watch("state");

  // Automatically select the unit if there is only one hospital in the selected state or route to MHQ if out-of-region (Emergency)
  useEffect(() => {
    if (!units || !emergencySelectedState) return;

    if (isOutOfRegionState(emergencySelectedState)) {
      const mhq = getMhqUnit(units);
      if (mhq) {
        emergencyForm.setValue("unitId", mhq.id, { shouldValidate: true });
      }
      return;
    }

    const autoUnit = getAutoSelectedUnitForState(emergencySelectedState, units);
    if (autoUnit) {
      emergencyForm.setValue("unitId", autoUnit.id, { shouldValidate: true });
    } else {
      // Reset unit selection only if the currently selected unit is NOT in the selected state!
      const currentUnitId = emergencyForm.getValues("unitId");
      const currentUnit = units.find(u => u.id === currentUnitId);
      if (currentUnit && currentUnit.state.toLowerCase().trim() !== emergencySelectedState.toLowerCase().trim()) {
        emergencyForm.setValue("unitId", 0, { shouldValidate: false });
      }
    }
  }, [emergencySelectedState, units, emergencyForm]);

  const emergencyDistricts = useMemo(() => {
    const stateObj = INDIA_STATES.find(s => s.name === emergencySelectedState);
    return stateObj ? stateObj.districts : [];
  }, [emergencySelectedState]);

  // Smart unit filter for emergency form
  const emergencyFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!emergencySelectedState) return units;
    const matched = units.filter(u => u.state === emergencySelectedState);
    return matched.length > 0 ? matched : units;
  }, [units, emergencySelectedState]);

  // Pledge form state/district watchers
  const selectedState = pledgeForm.watch("state");

  // Automatically select the unit if there is only one hospital in the selected state or route to MHQ if out-of-region (Pledge)
  useEffect(() => {
    if (!units || !selectedState) return;

    if (isOutOfRegionState(selectedState)) {
      const mhq = getMhqUnit(units);
      if (mhq) {
        pledgeForm.setValue("unitId", mhq.id, { shouldValidate: true });
      }
      return;
    }

    const autoUnit = getAutoSelectedUnitForState(selectedState, units);
    if (autoUnit) {
      pledgeForm.setValue("unitId", autoUnit.id, { shouldValidate: true });
    } else {
      // Reset unit selection only if the currently selected unit is NOT in the selected state!
      const currentUnitId = pledgeForm.getValues("unitId");
      const currentUnit = units.find(u => u.id === currentUnitId);
      if (currentUnit && currentUnit.state.toLowerCase().trim() !== selectedState.toLowerCase().trim()) {
        pledgeForm.setValue("unitId", 0, { shouldValidate: false });
      }
    }
  }, [selectedState, units, pledgeForm]);

  const districts = useMemo(() => {
    const state = INDIA_STATES.find(s => s.name === selectedState);
    return state ? state.districts : [];
  }, [selectedState]);

  // Smart unit filter for pledge form
  const pledgeFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!selectedState) return units;
    const matched = units.filter(u => u.state === selectedState);
    return matched.length > 0 ? matched : units;
  }, [units, selectedState]);

  const assignedUnit = useMemo(() => {
    const selectedId = emergencyForm.watch("unitId");
    return units?.find(u => u.id === selectedId);
  }, [units, emergencyForm.watch("unitId")]);

  const pledgeAssignedUnit = useMemo(() => {
    const selectedId = pledgeForm.watch("unitId");
    return units?.find(u => u.id === selectedId);
  }, [units, pledgeForm.watch("unitId")]);

  // Handle +91 Input Locking
  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>, setValueFn: (val: string) => void) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      e.target.value = "+91 ";
      setValueFn("+91 ");
      return;
    }

    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    
    if (suffix.startsWith("0")) {
      suffix = suffix.substring(1);
    }
    
    const formatted = prefix + suffix.substring(0, 10);
    e.target.value = formatted;
    setValueFn(formatted);
  };

  // Submit Emergency Call
  const onEmergencySubmit = (data: EmergencyValues) => {
    const payload = {
      referrerName: data.referrerName,
      referrerMobile: data.referrerMobile,
      referrerRelationship: data.referrerRelationship,
      donorName: data.donorName,
      donorAge: data.donorAge,
      donorGender: data.donorGender,
      timeOfDeath: data.timeOfDeath,
      causeOfDeath: data.causeOfDeath,
      state: data.state,
      district: data.district,
      pincode: data.pincode,
      address: data.address,
      unitId: data.unitId,
    };

    submitCall.mutate({ data: payload }, {
      onSuccess: (response) => {
        setSuccessData({ 
          whatsappUrl: response.whatsappUrl, 
          callId: response.eyeCall.callId 
        });
        window.open(response.whatsappUrl, "_blank");
        window.scrollTo(0, 0);
      }
    });
  };

  // Submit Future Pledge Form
  const onPledgeSubmit = (data: PledgeValues) => {
    const selectedUnit = units?.find(u => u.id === data.unitId);
    
    const payload = {
      referrerName: data.pledgerName,
      referrerMobile: data.pledgerMobile,
      referrerRelationship: "Self",
      donorName: data.pledgerName,
      donorAge: data.pledgerAge,
      donorGender: data.pledgerGender,
      timeOfDeath: "Pledge (Future Donation)",
      causeOfDeath: "Pledge (Future Donation)",
      state: data.state,
      district: data.district,
      pincode: "000000",
      address: "Pledge registered online. Certificate generated.",
      unitId: data.unitId,
    };

    submitCall.mutate({ data: payload }, {
      onSuccess: (response) => {
        setSuccessData({
          whatsappUrl: response.whatsappUrl,
          callId: response.eyeCall.callId,
          pledgerName: data.pledgerName,
          pledgeDate: new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' }),
          unitName: selectedUnit?.name || "Sankara Eye Hospital"
        });
        window.scrollTo(0, 0);
      }
    });
  };

  const shareCertificateOnWhatsApp = () => {
    if (!successData) return;
    const message = `*My Eye Donation Pledge — Sankara Eye Foundation*\n\n` +
      `I have proudly pledged to donate my eyes at *${successData.unitName}*!\n` +
      `This noble decision will give the miracle of sight to two blind individuals.\n\n` +
      `🏥 Certificate ID: *${successData.callId}*\n` +
      `📅 Pledge Date: ${successData.pledgeDate}\n\n` +
      `Be a Sight Ambassador too — pledge here: ${window.location.origin}/donate?intent=pledge`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (successData) {
    const isPledgeSuccess = !!successData.pledgerName;

    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50/20 via-white to-orange-100/10 flex flex-col items-center justify-center p-4 print:p-0 select-none">
        
        <style>{`
          @page {
            size: A4 landscape;
            margin: 0;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              width: 297mm !important;
              height: 210mm !important;
            }
            .print-hide { display: none !important; }
            #pledge-certificate-wrapper {
              position: fixed !important;
              top: 0 !important; left: 0 !important;
              width: 297mm !important; height: 210mm !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              background: white !important;
              padding: 8mm !important;
              box-sizing: border-box !important;
            }
            #pledge-certificate {
              width: 281mm !important; height: 194mm !important;
              border: 6px double #b8860b !important;
              outline: 2px solid #d4af37 !important;
              outline-offset: -10px !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
            }
          }
        `}</style>

        {isPledgeSuccess ? (
          <div id="pledge-certificate-wrapper" className="flex flex-col items-center w-full max-w-5xl">
            <div className="print-hide text-center mb-6 max-w-md">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">🎉 Pledge Registered!</h2>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed font-semibold">
                Thank you for your noble commitment, <strong>{successData.pledgerName}</strong>.<br />
                Your Certificate of Appreciation is ready below.
              </p>
            </div>

            <div
              id="pledge-certificate"
              className="w-full border-[6px] border-double border-[#b8860b] outline outline-2 outline-offset-[-10px] outline-[#d4af37] bg-white shadow-2xl overflow-hidden flex flex-col"
              style={{ aspectRatio: "297/210", maxWidth: "900px" }}
            >
              <div className="bg-gradient-to-r from-[#7b0000] via-[#a30000] to-[#7b0000] px-8 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 bg-white/90 rounded-xl px-3 py-1.5">
                  <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em]">Official Document</p>
                  <p className="text-white text-xs font-extrabold tracking-widest uppercase font-['Outfit']">Eye Donation Pledge Registry</p>
                </div>
                <div className="text-right text-[10px] text-white/70 font-mono">
                  <p className="font-bold text-white">{successData.callId}</p>
                  <p>{successData.pledgeDate}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-12 py-4 text-center relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                  <img src={`${BASE_PATH}/logo.png`} alt="" className="w-64 h-64 object-contain" />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                  <Award className="h-8 w-8 text-[#b8860b]" />
                  <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
                </div>

                <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b6914] font-black mb-1">
                  Sankara Eye Foundation — India
                </p>

                <h1 className="font-serif text-4xl md:text-5xl font-black text-gray-900 tracking-wide uppercase leading-tight mb-2">
                  Certificate of Appreciation
                </h1>

                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                  <div className="h-2 w-2 rounded-full bg-[#d4af37]" />
                  <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                </div>

                <p className="text-xs text-gray-500 italic mb-2 font-medium">
                  This certificate is proudly and gratefully presented to our esteemed Sight Ambassador
                </p>

                <h2 className="font-serif text-3xl md:text-4xl font-black text-gray-900 border-b-2 border-[#d4af37] pb-2 px-8 tracking-wide mb-3">
                  {successData.pledgerName}
                </h2>

                <p className="text-sm text-gray-700 font-bold max-w-2xl leading-relaxed mb-1">
                  who has solemnly and compassionately pledged to donate their eyes, bestowing the{" "}
                  <span
                    className="font-black tracking-wide"
                    style={{ background: "linear-gradient(90deg, #b8860b 0%, #f5c842 40%, #d4af37 70%, #a0720a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >GIFT OF VISION</span>{" "}
                  upon two blind individuals — a gift that transcends life itself.
                </p>

                <p className="text-[11px] text-gray-400 italic font-semibold">
                  "Do not deny them sight — let your eyes illuminate lives even after yours."
                </p>
              </div>

              <div className="bg-[#fdf8ec] border-t-2 border-[#d4af37] px-10 py-3 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6914]">Registered Hospital Unit</p>
                  <p className="text-xs font-extrabold text-gray-800">{successData.unitName || "Sankara Eye Hospital"}</p>
                </div>
                <div className="text-center flex flex-col items-center gap-0.5">
                  <img src={`${BASE_PATH}/logo.png`} alt="Sankara" className="h-9 object-contain opacity-60" />
                  <p className="text-[8px] text-[#8b6914] font-semibold tracking-wide">Sri Kanchi Kamakoti Medical Trust</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6914]">Certificate ID</p>
                  <p className="text-xs font-mono font-extrabold text-gray-800 mt-0.5">{successData.callId}</p>
                </div>
              </div>
            </div>

            <div className="print-hide flex flex-col sm:flex-row gap-3 w-full max-w-lg mt-6">
              <Button
                onClick={() => window.print()}
                className="flex-1 h-12 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl shadow-md border-0 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={18} /> Download / Print Certificate
              </Button>
              <Button
                onClick={shareCertificateOnWhatsApp}
                className="flex-1 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl shadow-md border-0 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 size={18} /> Share on WhatsApp
              </Button>
            </div>

            <div className="print-hide flex gap-3 mt-3">
              <Button onClick={() => setSuccessData(null)} variant="ghost" className="text-gray-500 hover:text-gray-900 text-xs font-semibold">
                Register Another Pledge
              </Button>
              <Link href="/">
                <Button variant="ghost" className="text-gray-400 hover:text-gray-900 text-xs font-semibold">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md text-center">
            <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden p-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">Request Logged</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed font-semibold">
                Reference ID: <span className="font-mono font-bold text-gray-900">{successData.callId}</span>.<br/>
                Our coordinator will call you back immediately.
              </p>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 w-full text-left my-6 space-y-2">
                <h4 className="text-xs font-extrabold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity size={14} className="animate-pulse" /> Do This Immediately
                </h4>
                <ul className="text-[12px] text-red-950 space-y-1.5 leading-snug font-semibold list-none pl-0">
                  <li className="flex gap-2"><span className="text-red-500 font-bold">①</span> Switch off ALL ceiling fans in the room right now.</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">②</span> Gently close the deceased's eyes and place wet cotton over the eyelids.</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">③</span> Turn on AC if available to keep the room cool.</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">④</span> Our coordinator will arrive within the 6-hour window.</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button
                  className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl shadow-md font-bold flex items-center justify-center gap-2 cursor-pointer border-0"
                  onClick={() => window.open(successData.whatsappUrl, "_blank")}
                >
                  <Phone size={18} /> Ping Coordinator on WhatsApp
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col select-none relative overflow-x-hidden">
      
      {/* Premium Header */}
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-12 sticky top-0 z-50">
        <a href="https://sankaraeye.com/" target="_blank" rel="noopener noreferrer">
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 md:h-12 object-contain cursor-pointer hover:scale-[1.01] transition-transform duration-300" />
        </a>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl h-9 md:h-10 text-xs font-semibold gap-1.5 cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Button>
        </Link>
      </header>

      {/* Hero Header */}
      <div className="w-full pt-12 pb-8 px-4 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-orange-100/50 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-[10px] md:text-xs font-extrabold text-orange-600 uppercase tracking-widest mb-4 shadow-sm">
          <Activity className="h-3.5 w-3.5 animate-pulse" /> Official Eye Bank Portal
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4 font-['Outfit']">
          Give the Miracle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Sight</span>
        </h1>
        <p className="text-xl md:text-2xl font-extrabold text-[#ff7a18] tracking-wide mb-4">
          "Do not Bury, Do not Burn, Donate Eyes"
        </p>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed font-semibold">
          Every eye donation restores sight to two blind individuals. Whether you need to report a recent death within the critical 6-hour window, or wish to pledge your eyes for the future, use the forms below.
        </p>
      </div>

      {/* WIDESCREEN TAB SWITCHER & FORM FIELDS ALIGNED */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 pb-16 gap-8 md:gap-12 relative z-10">
        
        <div className="w-full max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 max-w-xl mx-auto bg-gray-100/80 p-1.5 rounded-2xl mb-8 border border-gray-200/50 shadow-sm">
              <TabsTrigger value="emergency" className="rounded-xl py-3 text-xs font-black uppercase tracking-wider text-slate-600 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-md cursor-pointer">
                🚨 Report Recent Death
              </TabsTrigger>
              <TabsTrigger value="pledge" className="rounded-xl py-3 text-xs font-black uppercase tracking-wider text-slate-600 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md cursor-pointer">
                ✍️ Pledge Your Eyes
              </TabsTrigger>
            </TabsList>
            
            {/* EMERGENCY FORM */}
            <TabsContent value="emergency" className="mt-0 animate-fadeIn">
              <Card className="border border-red-200/60 shadow-[0_8px_35px_rgb(0,0,0,0.04)] rounded-3xl bg-gradient-to-b from-red-50/40 to-white overflow-hidden relative transition-all duration-300 hover:shadow-[0_12px_45px_rgb(239,68,68,0.08)]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
                <CardContent className="p-6 md:p-10 space-y-6">
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 leading-snug">Report Recent Death</h2>
                      <p className="text-[10px] md:text-xs text-red-600 font-extrabold tracking-widest uppercase">Callback Request</p>
                    </div>
                  </div>

                  <a href="tel:1919" className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer text-left border-0 w-full decoration-none group">
                    <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
                      <Phone className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/90">Time Critical: Retrieval inside 6h</p>
                      <p className="text-lg md:text-2xl font-extrabold tracking-tight">Call 1919 Toll-Free</p>
                    </div>
                  </a>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold tracking-widest uppercase font-mono">OR LOG REQUEST</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <form onSubmit={emergencyForm.handleSubmit(onEmergencySubmit)} className="space-y-6">
                    
                    {/* SECTION 1: REFERRER / CONTACT DETAILS */}
                    <div className="border border-red-100/80 rounded-2xl p-5 space-y-4 bg-red-50/10">
                      <h3 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2 border-b border-red-50 pb-2">
                        <Phone className="h-4 w-4" /> Referrer / Contact Person Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Your Full Name *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-red-500 transition-colors z-10">
                              <User className="h-4 w-4" />
                            </div>
                            <Input placeholder="e.g. Ramesh Kumar" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-red-500 transition-all shadow-sm" {...emergencyForm.register("referrerName")} />
                          </div>
                          {emergencyForm.formState.errors.referrerName && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.referrerName.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Contact Number *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-red-500 transition-colors z-10">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input type="tel" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-semibold tracking-wide focus:ring-2 focus:ring-red-500 transition-all shadow-sm" onChange={(e) => handleMobileInput(e, (v) => emergencyForm.setValue("referrerMobile", v, { shouldValidate: true }))} value={emergencyForm.watch("referrerMobile")} />
                          </div>
                          {emergencyForm.formState.errors.referrerMobile && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.referrerMobile.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Relationship *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-red-500 transition-colors z-10">
                              <Users className="h-4 w-4" />
                            </div>
                            <Input placeholder="e.g. Son, Daughter, Doctor" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-red-500 transition-all shadow-sm" {...emergencyForm.register("referrerRelationship")} />
                          </div>
                          {emergencyForm.formState.errors.referrerRelationship && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.referrerRelationship.message}</p>}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: DECEASED PERSON DETAILS (4-Column Layout) */}
                    <div className="border border-orange-100 rounded-2xl p-5 space-y-4 bg-orange-50/10">
                      <h3 className="text-xs font-black text-[#ff7a18] uppercase tracking-widest flex items-center gap-2 border-b border-orange-50 pb-2">
                        <HeartHandshake className="h-4 w-4" /> Deceased Person Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Deceased Full Name *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                              <User className="h-4 w-4" />
                            </div>
                            <Input placeholder="Full Name of Deceased" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm" {...emergencyForm.register("donorName")} />
                          </div>
                          {emergencyForm.formState.errors.donorName && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.donorName.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Age *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                              <Activity className="h-4 w-4" />
                            </div>
                            <Input type="number" placeholder="Age" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm" {...emergencyForm.register("donorAge")} />
                          </div>
                          {emergencyForm.formState.errors.donorAge && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.donorAge.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Gender *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                              <Users className="h-4 w-4" />
                            </div>
                            <Select onValueChange={(val) => emergencyForm.setValue("donorGender", val as any)} value={emergencyForm.watch("donorGender")}>
                              <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm">
                                <SelectValue placeholder="Gender" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-150">
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Time of Death *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                              <Clock className="h-4 w-4" />
                            </div>
                            <Input placeholder="e.g. 10:30 AM" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm" {...emergencyForm.register("timeOfDeath")} />
                          </div>
                          {emergencyForm.formState.errors.timeOfDeath && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.timeOfDeath.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Cause of Death *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                            <Input placeholder="e.g. Cardiac arrest" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm" {...emergencyForm.register("causeOfDeath")} />
                          </div>
                          {emergencyForm.formState.errors.causeOfDeath && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.causeOfDeath.message}</p>}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: RETRIEVAL LOCATION (4-Column Layout) */}
                    <div className="border border-green-100 rounded-2xl p-5 space-y-4 bg-green-50/5">
                      <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-50 pb-2">
                        <MapPin className="h-4 w-4" /> Retrieval Location & Branch Assignment
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5 md:col-span-3">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Address of Eye Collection *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-emerald-500 transition-colors z-10">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <Input placeholder="e.g. 12, Gandhi Nagar, Near City Hospital" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" {...emergencyForm.register("address")} />
                          </div>
                          {emergencyForm.formState.errors.address && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.address.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Pincode (6 digits) *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-emerald-500 transition-colors z-10">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <Input placeholder="e.g. 641035" maxLength={6} className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" {...emergencyForm.register("pincode")} />
                          </div>
                          {emergencyForm.formState.errors.pincode && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.pincode.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">State *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-emerald-500 transition-colors z-10">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <Select
                              onValueChange={(val) => {
                                emergencyForm.setValue("state", val, { shouldValidate: true });
                                emergencyForm.setValue("district", "", { shouldValidate: false });
                                emergencyForm.setValue("unitId", 0, { shouldValidate: false });
                              }}
                              value={emergencyForm.watch("state")}
                            >
                              <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-150">
                                {INDIA_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          {emergencyForm.formState.errors.state && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.state.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">District *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-emerald-500 transition-colors z-10">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <Select
                              disabled={!emergencySelectedState}
                              onValueChange={(val) => emergencyForm.setValue("district", val, { shouldValidate: true })}
                              value={emergencyForm.watch("district")}
                            >
                              <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-sm disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm">
                                <SelectValue placeholder="Select District" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-150">
                                {emergencyDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          {emergencyForm.formState.errors.district && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.district.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Nearest Hospital Unit *</Label>
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-emerald-500 transition-colors z-10">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <Select
                              onValueChange={(val) => emergencyForm.setValue("unitId", Number(val), { shouldValidate: true })}
                              value={emergencyForm.watch("unitId")?.toString() || ""}
                            >
                              <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm">
                                <SelectValue placeholder="Select nearest branch" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-150">
                                {emergencyFilteredUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          {emergencyForm.formState.errors.unitId && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.unitId.message}</p>}
                          
                          {emergencySelectedState && isOutOfRegionState(emergencySelectedState) ? (
                            <div className="mt-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex gap-3 text-left shadow-sm animate-fadeIn">
                              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Sankara Branch Not Present In This State</p>
                                <p className="text-xs text-amber-950 font-bold mt-0.5 leading-normal">
                                  Sankara Eye Hospital does not have a branch in <strong>{emergencySelectedState}</strong>. Your request is automatically routed to our <strong>SEFI Mission Head Quarters (MHQ)</strong>.
                                </p>
                                <p className="text-[10px] text-amber-700 font-semibold mt-1.5 leading-normal">
                                  Our national coordinators will coordinate with local partner eye banks or government hospitals in your region to assist you.
                                </p>
                              </div>
                            </div>
                          ) : assignedUnit ? (
                            <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex gap-3 text-left shadow-sm animate-fadeIn">
                              <Building2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Nearest Branch Assigned</p>
                                <p className="text-xs font-extrabold text-slate-800 mt-0.5">{assignedUnit.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">{assignedUnit.address}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg border-0 text-base font-extrabold flex items-center justify-center gap-2 mt-4 transition-all cursor-pointer">
                      {submitCall.isPending ? "Logging Emergency Request..." : <><Send size={18} /> Dispatch Team &amp; Call Me Back</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* PLEDGE FORM */}
            <TabsContent value="pledge" className="mt-0 animate-fadeIn">
              <Card className="border border-orange-200/60 shadow-[0_8px_35px_rgb(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden relative transition-all duration-300 hover:shadow-[0_12px_45px_rgb(255,122,24,0.08)]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-yellow-400" />
                <CardContent className="p-6 md:p-10 space-y-6">
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 leading-snug">Pledge Your Eyes</h2>
                      <p className="text-[10px] md:text-xs text-orange-600 font-extrabold tracking-widest uppercase">Register Future Donation</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed border-b border-gray-50 pb-4 font-semibold">Join 100,000+ ambassadors. Submit your details below to instantly generate your personalized digital Sight Certificate.</p>

                  <form onSubmit={pledgeForm.handleSubmit(onPledgeSubmit)} className="space-y-6 pt-2">
                    
                    {/* Demographics grid (4-Column Layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Full Name *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <User className="h-4 w-4" />
                          </div>
                          <Input placeholder="Your Name" className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" {...pledgeForm.register("pledgerName")} />
                        </div>
                        {pledgeForm.formState.errors.pledgerName && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerName.message}</p>}
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Age *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <Activity className="h-4 w-4" />
                          </div>
                          <Input type="number" placeholder="Age" className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" {...pledgeForm.register("pledgerAge")} />
                        </div>
                        {pledgeForm.formState.errors.pledgerAge && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerAge.message}</p>}
                      </div>
                      
                      <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Gender *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <Users className="h-4 w-4" />
                          </div>
                          <Select onValueChange={(val) => pledgeForm.setValue("pledgerGender", val as any)} value={pledgeForm.watch("pledgerGender")}>
                            <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all">
                              <SelectValue placeholder="Sex" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Contact details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Mobile Number *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <Phone className="h-4 w-4" />
                          </div>
                          <Input 
                            type="tel"
                            className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-semibold tracking-wide transition-all"
                            {...pledgeForm.register("pledgerMobile", {
                              onChange: (e) => handleMobileInput(e, (v) => pledgeForm.setValue("pledgerMobile", v, { shouldValidate: true }))
                            })} 
                            value={pledgeForm.watch("pledgerMobile")}
                          />
                        </div>
                        {pledgeForm.formState.errors.pledgerMobile && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerMobile.message}</p>}
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Email (Optional)</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <Mail className="h-4 w-4" />
                          </div>
                          <Input type="email" placeholder="name@email.com" className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" {...pledgeForm.register("pledgerEmail")} />
                        </div>
                        {pledgeForm.formState.errors.pledgerEmail && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerEmail.message}</p>}
                      </div>
                    </div>

                    {/* Assignment details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Nearest Sankara Hospital Unit *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <Select onValueChange={(val) => pledgeForm.setValue("unitId", Number(val))} value={pledgeForm.watch("unitId")?.toString() || ""}>
                            <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 text-sm shadow-sm font-medium transition-all">
                              <SelectValue placeholder="Select closest hospital unit" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150">
                              {pledgeFilteredUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {pledgeForm.formState.errors.unitId && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.unitId.message}</p>}
                        
                        {selectedState && isOutOfRegionState(selectedState) ? (
                          <div className="mt-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex gap-3 text-left shadow-sm animate-fadeIn">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Sankara Branch Not Present In This State</p>
                              <p className="text-xs text-amber-950 font-bold mt-0.5 leading-normal">
                                Sankara Eye Hospital does not have a branch in <strong>{selectedState}</strong>. Your pledge is automatically routed to our <strong>SEFI Mission Head Quarters (MHQ)</strong>.
                              </p>
                              <p className="text-[10px] text-amber-700 font-semibold mt-1.5 leading-normal">
                                Our national coordinators will coordinate with local partner eye banks or government hospitals in your region to assist you.
                              </p>
                            </div>
                          </div>
                        ) : pledgeAssignedUnit ? (
                          <div className="mt-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex gap-3 text-left shadow-sm animate-fadeIn">
                            <Building2 className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-orange-800">Nearest Branch Assigned</p>
                              <p className="text-xs font-extrabold text-slate-800 mt-0.5">{pledgeAssignedUnit.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">{pledgeAssignedUnit.address}</p>
                            </div>
                          </div>
                        ) : null}

                        {selectedState && pledgeFilteredUnits.length > 0 && pledgeFilteredUnits.length < (units?.length ?? 99) && (
                          <p className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 rounded-lg px-2 py-0.5 mt-1 flex items-center gap-1 w-fit shadow-sm">
                            <CheckCircle2 size={10} /> Showing {pledgeFilteredUnits.length} Sankara branch(es)
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">State *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <Select onValueChange={(val) => { pledgeForm.setValue("state", val); pledgeForm.setValue("district", ""); }} value={pledgeForm.watch("state")}>
                            <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150">{INDIA_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {pledgeForm.formState.errors.state && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.state.message}</p>}
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">District *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors z-10">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <Select disabled={!selectedState} onValueChange={(val) => pledgeForm.setValue("district", val)} value={pledgeForm.watch("district")}>
                            <SelectTrigger className="pl-10 h-11 rounded-xl border-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all">
                              <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150">{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {pledgeForm.formState.errors.district && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.district.message}</p>}
                      </div>
                    </div>

                    <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white rounded-2xl shadow-lg border-0 font-extrabold flex items-center justify-center gap-2 mt-4 transition-all cursor-pointer">
                      {submitCall.isPending ? "Registering Pledge..." : <><CheckCircle2 size={18} /> Complete Eye Pledge & Get Certificate</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* ========================================================
            FULL PAGE GUIDELINES & PROTOCOLS (To fill the page beautifully)
            ======================================================== */}
        <div className="mt-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">Essential Guidelines & Protocols</h3>
            <p className="text-sm text-gray-500 mt-2 font-medium">Important clinical instructions regarding the eye donation procedure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white border border-red-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-red-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><Clock size={20} className="animate-pulse" /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Critical 6-Hour Window</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                Eye retrieval must be performed strictly within 6 hours of death. Immediate notification to our hotline is absolutely crucial to guarantee the restoration of sight.
              </p>
            </div>

            <div className="bg-white border border-orange-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-amber-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600"><ShieldAlert size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Immediate Actions Required</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                As soon as a death occurs, switch off all ceiling fans in the room immediately to prevent the corneas from drying out. Close the eyelids and cover them with a clean, damp cloth or wet cotton.
              </p>
            </div>

            <div className="bg-white border border-amber-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-yellow-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Sparkles size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Zero Disfigurement</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                The surgical retrieval is clean, completely free of charge, and takes only 20 minutes in a standard room. It leaves absolutely no scars, ensuring full respect for the deceased.
              </p>
            </div>

            <div className="bg-white border border-green-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-600"><CheckCircle2 size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Age & Cataracts Allowed</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                Anyone can donate their eyes. Poor eyesight, wearing spectacles, history of cataract surgery, religion, and blood group do not restrict an individual from giving the gift of sight.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50/50 to-orange-100/20 border border-orange-200/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden md:col-span-2 lg:col-span-2 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#ff7a18] to-[#ff9f43] group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white rounded-xl text-orange-600 shadow-sm"><Heart size={20} className="animate-pulse" /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Illuminate Two Lives</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-semibold">
                Corneal blindness causes severe suffering, but it is curable through transplantation. Your noble decision restores the miracle of sight to <span className="font-bold text-gray-950">not one, but two blind individuals</span> plunged into darkness. Do not deny them life—let your eyes live even after you.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 md:h-12 border-t border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white z-10 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 font-bold tracking-wide">
          <Heart className="h-3.5 w-3.5 text-[#ff7a18] fill-[#ff7a18] animate-pulse" />
          <span>Sankara Eye Foundation - India</span>
        </div>
        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} Sri Kanchi Kamakoti Medical Trust. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}
