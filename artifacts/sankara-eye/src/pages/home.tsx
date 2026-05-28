import React, { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BASE_PATH, INDIA_STATES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPublicEyeCall, useListPublicUnits } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  Eye, Clock, Phone, Heart, ArrowRight, ShieldAlert, HeartHandshake,
  Award, CheckCircle2, Info, Users, AlertCircle, MapPin, Building2, User, Send,
  Activity, Sparkles
} from "lucide-react";

// ─── Validation ──────────────────────────────────────────────────────────────
const mobileRegex = /^\+91 [6-9]\d{9}$/;

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

type EmergencyValues = z.infer<typeof emergencySchema>;

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

export default function Home() {
  const { user } = useAuth();
  const isSignedIn = !!user;

  const { data: units } = useListPublicUnits();
  const submitCall = useSubmitPublicEyeCall();

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

  const emergencySelectedState = emergencyForm.watch("state");

  // Automatically select the unit if there is only one hospital in the selected state or route to MHQ if out-of-region
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

  const emergencyFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!emergencySelectedState) return units;
    const stateMatched = units.filter(u => u.state === emergencySelectedState);
    return stateMatched.length > 0 ? stateMatched : units;
  }, [units, emergencySelectedState]);

  const assignedUnit = useMemo(() => {
    const selectedId = emergencyForm.watch("unitId");
    return units?.find(u => u.id === selectedId);
  }, [units, emergencyForm.watch("unitId")]);

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      emergencyForm.setValue("referrerMobile", "+91 ", { shouldValidate: true });
      return;
    }
    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    if (suffix.startsWith("0")) suffix = suffix.substring(1);
    emergencyForm.setValue("referrerMobile", prefix + suffix.substring(0, 10), { shouldValidate: true });
  };

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
        window.open(response.whatsappUrl, "_blank");
        emergencyForm.reset();
        alert("Emergency Request Logged! Connecting you to our coordinator on WhatsApp.");
      }
    });
  };

  const errs = emergencyForm.formState.errors;

  return (
    <div className="min-h-screen w-full bg-white font-sans select-none overflow-x-hidden">

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <a href="https://sankaraeye.com/" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:scale-[1.02] transition-transform">
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 md:h-11 w-auto object-contain" />
        </a>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl text-xs font-semibold">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl text-xs font-medium">
                Coordinator Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#fff8f2] via-white to-[#fff3e6] min-h-[85vh] py-16">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[160px] opacity-50 pointer-events-none -z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-100 rounded-full blur-[120px] opacity-40 pointer-events-none -z-0" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-10 flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            {/* Urgent Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-lg animate-pulse">
              <ShieldAlert className="h-4 w-4" />
              Time Critical — Act Within 6 Hours of Death
            </div>

            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Give the Miracle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] via-[#ff9f43] to-[#ffb347]">Sight</span>
              </h1>
              <p className="text-xl md:text-2xl font-extrabold text-[#ff7a18] tracking-wide mt-2">
                "Do not Bury, Do not Burn, Donate Eyes"
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
                Every eye donation restores sight to two blind individuals. Eye retrieval must happen within <strong className="text-red-600">6 hours of death</strong>.
              </p>
            </div>

            {/* Helpline */}
            <a href="tel:1919" className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group mb-4">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <Phone className="h-6 w-6 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Eye Bank Helpline</p>
                <p className="text-xl font-extrabold tracking-tight">Call Toll-Free: 1919</p>
              </div>
            </a>

            {/* WIDE EMERGENCY FORM */}
            <Card className="w-full max-w-5xl border border-red-200/60 shadow-[0_8px_35px_rgb(0,0,0,0.06)] rounded-3xl bg-white overflow-hidden relative text-left transition-all duration-300 hover:shadow-[0_12px_45px_rgb(239,68,68,0.08)]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
              <CardContent className="p-6 md:p-10 space-y-8">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">Eye Donation</h2>
                      <p className="text-xs text-red-600 font-extrabold tracking-widest uppercase mt-0.5">Report a Recent Death</p>
                    </div>
                  </div>
                  <div className="bg-red-50 text-red-800 text-[10px] md:text-xs font-bold px-4 py-2 rounded-xl text-right max-w-[200px] shadow-sm border border-red-100/30">
                    We will dispatch a medical team instantly. Fill out this form accurately.
                  </div>
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
                        {errs.referrerName && <p className="text-[10px] text-red-500 font-semibold">{errs.referrerName.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Contact Number *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-red-500 transition-colors z-10">
                            <Phone className="h-4 w-4" />
                          </div>
                          <Input type="tel" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-semibold tracking-wide focus:ring-2 focus:ring-red-500 transition-all shadow-sm" onChange={handleMobileInput} value={emergencyForm.watch("referrerMobile")} />
                        </div>
                        {errs.referrerMobile && <p className="text-[10px] text-red-500 font-semibold">{errs.referrerMobile.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Relationship *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-red-500 transition-colors z-10">
                            <Users className="h-4 w-4" />
                          </div>
                          <Input placeholder="e.g. Son, Daughter, Doctor" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-red-500 transition-all shadow-sm" {...emergencyForm.register("referrerRelationship")} />
                        </div>
                        {errs.referrerRelationship && <p className="text-[10px] text-red-500 font-semibold">{errs.referrerRelationship.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: DECEASED PERSON DETAILS */}
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
                        {errs.donorName && <p className="text-[10px] text-red-500 font-semibold">{errs.donorName.message}</p>}
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Age *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                            <Activity className="h-4 w-4" />
                          </div>
                          <Input type="number" placeholder="Age" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm" {...emergencyForm.register("donorAge")} />
                        </div>
                        {errs.donorAge && <p className="text-[10px] text-red-500 font-semibold">{errs.donorAge.message}</p>}
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
                        {errs.timeOfDeath && <p className="text-[10px] text-red-500 font-semibold">{errs.timeOfDeath.message}</p>}
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Cause of Death *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-[#ff7a18] transition-colors z-10">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <Input placeholder="e.g. Cardiac arrest" className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-[#ff7a18] transition-all shadow-sm" {...emergencyForm.register("causeOfDeath")} />
                        </div>
                        {errs.causeOfDeath && <p className="text-[10px] text-red-500 font-semibold">{errs.causeOfDeath.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: RETRIEVAL LOCATION */}
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
                        {errs.address && <p className="text-[10px] text-red-500 font-semibold">{errs.address.message}</p>}
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Pincode (6 digits) *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-emerald-500 transition-colors z-10">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <Input placeholder="e.g. 641035" maxLength={6} className="pl-10 h-11 rounded-xl border-gray-200 bg-white text-base font-medium focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" {...emergencyForm.register("pincode")} />
                        </div>
                        {errs.pincode && <p className="text-[10px] text-red-500 font-semibold">{errs.pincode.message}</p>}
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
                        {errs.state && <p className="text-[10px] text-red-500 font-semibold">{errs.state.message}</p>}
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
                        {errs.district && <p className="text-[10px] text-red-500 font-semibold">{errs.district.message}</p>}
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
                        {errs.unitId && <p className="text-[10px] text-red-500 font-semibold">{errs.unitId.message}</p>}
                        
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

                  <div className="pt-4">
                    <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg border-0 text-base font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer">
                      {submitCall.isPending ? "Logging Request..." : <><Send size={18} /> Dispatch Team &amp; Call Me Back</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* PLEDGE EYE CTA */}
            <div className="mt-12 text-center flex flex-col items-center">
              <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-4">Want to become a sight ambassador?</p>
              <Link href="/donate?intent=pledge">
                <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] p-[2px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0">
                  <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] rounded-[14px] px-10 py-5 text-white">
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                    <Award className="h-7 w-7 z-10" />
                    <span className="text-xl font-extrabold z-10 tracking-tight">Pledge Your Eyes</span>
                    <ArrowRight className="h-6 w-6 z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-16 w-full max-w-4xl border-t border-gray-200/60 pt-10">
              {[
                { label: "Sight Restored", value: "2 Lives", icon: <Eye className="h-5 w-5 text-orange-500" /> },
                { label: "Critical Window", value: "6 Hours", icon: <Clock className="h-5 w-5 text-red-500" /> },
                { label: "Pledgers", value: "1 Lakh+", icon: <Users className="h-5 w-5 text-orange-500" /> },
                { label: "Retrieval Time", value: "20 Mins", icon: <Heart className="h-5 w-5 text-orange-500" /> },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-orange-50 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-extrabold text-gray-900">{s.value}</span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── BELOW FOLD: Guidelines ──────────────────────────── */}
      <section className="w-full bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">
              Essential <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Guidelines</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto font-medium">
              Important clinical instructions that every family must know when considering eye donation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <ShieldAlert size={22} className="text-orange-600" />, bg: "bg-orange-50", border: "border-orange-100", color: "from-orange-500 to-orange-400",
                title: "Switch Off Fans", desc: "Turn off all ceiling fans in the room the moment death occurs. Switch on AC if available."
              },
              {
                icon: <CheckCircle2 size={22} className="text-green-600" />, bg: "bg-green-50", border: "border-green-100", color: "from-green-500 to-emerald-400",
                title: "Close Eyes & Wet Cotton", desc: "Gently close the deceased's eyes and place clean, wet cotton pads over the closed eyelids."
              },
              {
                icon: <Info size={22} className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-100", color: "from-blue-500 to-blue-400",
                title: "Age, Sex & Religion", desc: "Anyone can donate eyes regardless of age, sex, blood group, or religion."
              },
              {
                icon: <Sparkles size={22} className="text-amber-600" />, bg: "bg-amber-50", border: "border-amber-100", color: "from-amber-500 to-yellow-400",
                title: "Zero Disfigurement", desc: "The surgical retrieval takes only 20 minutes and leaves absolutely no facial disfigurement."
              },
              {
                icon: <Heart size={22} className="text-red-600" />, bg: "bg-red-50", border: "border-red-100", color: "from-red-500 to-red-400",
                title: "Ethical & Free", desc: "Donated eyes are never sold. They are used purely to restore vision free of charge."
              },
              {
                icon: <Eye size={22} className="text-purple-600" />, bg: "bg-purple-50", border: "border-purple-100", color: "from-purple-500 to-purple-400",
                title: "Illuminate Two Lives", desc: "One donation gives sight to TWO blind individuals through corneal transplantation."
              },
            ].map((item, i) => (
              <div key={i} className={`relative bg-white ${item.border} border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${item.color} group-hover:w-2 transition-all`} />
                <div className={`${item.bg} h-11 w-11 rounded-2xl flex items-center justify-center mb-4`}>{item.icon}</div>
                <h4 className="font-extrabold text-gray-900 text-[15px] mb-2">{item.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-semibold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-5 px-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
          <Heart className="h-3.5 w-3.5 text-[#ff7a18] fill-[#ff7a18] animate-pulse" />
          Sankara Eye Foundation — India
        </div>
        <p className="text-[10px] text-gray-400 font-bold">
          © {new Date().getFullYear()} Sri Kanchi Kamakoti Medical Trust. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
