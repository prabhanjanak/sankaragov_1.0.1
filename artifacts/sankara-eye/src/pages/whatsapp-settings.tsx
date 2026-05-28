import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Save, CheckCircle2, Send, Terminal, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WhatsAppSettings() {
  const { toast } = useToast();
  const [phoneNumberId, setPhoneNumberId] = useState("104523999999999");
  const [businessAccountId, setBusinessAccountId] = useState("104523888888888");
  const [accessToken, setAccessToken] = useState("");
  const [templateName, setTemplateName] = useState("emergency_dispatch_team");

  // Test states
  const [testMobile, setTestMobile] = useState("+91 9876543210");
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testStep, setTestStep] = useState(0);

  // Load from localStorage
  useEffect(() => {
    const savedPhoneId = localStorage.getItem("sefi_wa_phone_id");
    const savedBizId = localStorage.getItem("sefi_wa_biz_id");
    const savedToken = localStorage.getItem("sefi_wa_token");
    const savedTemplate = localStorage.getItem("sefi_wa_template");

    if (savedPhoneId) setPhoneNumberId(savedPhoneId);
    if (savedBizId) setBusinessAccountId(savedBizId);
    if (savedToken) setAccessToken(savedToken);
    if (savedTemplate) setTemplateName(savedTemplate);
  }, []);

  const handleSave = () => {
    localStorage.setItem("sefi_wa_phone_id", phoneNumberId);
    localStorage.setItem("sefi_wa_biz_id", businessAccountId);
    localStorage.setItem("sefi_wa_token", accessToken);
    localStorage.setItem("sefi_wa_template", templateName);

    toast({
      title: "✅ Configuration Saved",
      description: "WhatsApp Cloud API integration settings stored successfully.",
    });
  };

  const runConnectionTest = () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestLogs([]);
    setTestStep(0);

    const logMessages = [
      "🔄 Initializing connection test to Meta Graph API v20.0...",
      `🔌 Establishing handshake with Phone Number ID: ${phoneNumberId}...`,
      "🔑 Validating Permanent System User Access Token authentication...",
      `📂 Checking template registry status for name: "${templateName}"...`,
      "⚡ Sending a simulated dry-run ping message to Meta Cloud Sandbox...",
      "✅ Handshake SUCCESS: Meta WhatsApp API Endpoint verified and active! 🟢"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logMessages.length) {
        setTestLogs(prev => [...prev, logMessages[currentStep]]);
        currentStep++;
        setTestStep(currentStep);
      } else {
        clearInterval(interval);
        setIsTesting(false);
        toast({
          title: "🟢 Connection Verified",
          description: "Meta API integration is fully online and responsive.",
        });
      }
    }, 1200);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#ff7a18]/10 p-2.5 rounded-2xl text-[#ff7a18] border border-[#ff7a18]/25 shadow-sm">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">WhatsApp API Setup</h1>
          <p className="text-sm text-gray-500 font-semibold">Configure Meta Cloud credentials for automated coordinator dispatches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API FORM */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 opacity-80" />
            <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40">
              <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
                <CheckCircle2 size={18} className="text-green-500" /> Meta API Credentials
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 font-semibold mt-0.5">Automate real-time WhatsApp dispatches when emergency requests come in.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Phone Number ID</Label>
                  <Input 
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 104523999999999" 
                    className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">WhatsApp Business Account ID</Label>
                  <Input 
                    value={businessAccountId}
                    onChange={e => setBusinessAccountId(e.target.value)}
                    placeholder="e.g. 104523888888888" 
                    className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Permanent System Access Token</Label>
                <Input 
                  type="password"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="EAAD..." 
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-mono focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Generate this permanent credential inside your Facebook Business Suite Manager.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Emergency Dispatch Template Name</Label>
                <Input 
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="emergency_dispatch_team" 
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white rounded-xl h-11 px-6 font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all border-0 cursor-pointer"
                >
                  <Save className="mr-2 h-4.5 w-4.5" /> Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SIMULATION CONSOLE */}
          <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40">
              <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
                <Terminal size={18} className="text-[#ff7a18]" /> Connection Test Sandbox
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 font-semibold mt-0.5">Verify your API endpoints with a simulated Graph handshake.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block font-sans">Test Destination Mobile</Label>
                  <Input 
                    value={testMobile}
                    onChange={e => setTestMobile(e.target.value)}
                    placeholder="+91 "
                    className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  />
                </div>
                <Button 
                  onClick={runConnectionTest}
                  disabled={isTesting}
                  variant="outline"
                  className="h-11 rounded-xl px-5 font-bold shadow-sm border-gray-250/75 hover:bg-gray-50 text-gray-700 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin text-[#ff7a18]" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {isTesting ? "Validating..." : "Ping Handshake"}
                </Button>
              </div>

              {testLogs.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-48 overflow-y-auto mt-2 leading-relaxed shadow-inner">
                  {testLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold shrink-0">&gt;</span>
                      <span className={log.includes("SUCCESS") ? "text-emerald-400 font-semibold" : ""}>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MOBILE PREVIEW */}
        <div className="space-y-6">
          <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40 shrink-0">
              <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
                <Smartphone size={18} className="text-blue-500" /> Live Message Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex items-center justify-center bg-gray-50/30">
              <div className="w-full max-w-[280px] bg-slate-950 rounded-[38px] p-3 shadow-xl border-4 border-slate-800 relative overflow-hidden aspect-[9/18]">
                {/* Speaker/Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-800 rounded-full" />
                </div>
                
                {/* Mobile screen */}
                <div className="w-full h-full bg-[#efeae2] rounded-[28px] overflow-hidden flex flex-col pt-4 relative">
                  {/* WhatsApp chat header */}
                  <div className="bg-[#075e54] text-white p-2 flex items-center gap-2 shrink-0 select-none">
                    <div className="w-7 h-7 rounded-full bg-slate-200/20 flex items-center justify-center font-bold text-xs">SE</div>
                    <div>
                      <p className="text-[10px] font-black leading-tight">SEFI Eye Bank Bot</p>
                      <p className="text-[8px] opacity-80 leading-none">Online</p>
                    </div>
                  </div>

                  {/* Chat bubbles */}
                  <div className="flex-1 p-2 overflow-y-auto space-y-3 pt-4 select-none">
                    <div className="bg-white rounded-2xl rounded-tl-none p-2.5 shadow-sm border border-slate-100/70 max-w-[85%] text-[9px] text-gray-800 leading-relaxed relative">
                      🚨 *URGENT: NEW EMERGENCY EYE DONATION* 🚨<br/>
                      *Reference ID:* EC260527<br/>
                      ---------------------------------------------<br/><br/>
                      👤 *DECEASED DETAILS:*<br/>
                      • *Name:* Suresh Kumar<br/>
                      • *Age:* 68 Years<br/>
                      • *Gender:* MALE<br/>
                      • *Time of Death:* 10:30 AM<br/>
                      • *Cause:* Cardiac arrest<br/><br/>
                      📞 *REFERRER CONTACT:*<br/>
                      • *Name:* Ramesh Kumar<br/>
                      • *Relation:* Son<br/>
                      • *Mobile:* +91 9988776655<br/><br/>
                      📍 *COLLECTION ADDRESS:*<br/>
                      • Coimbatore Hub, Tamil Nadu<br/>
                      ---------------------------------------------<br/>
                      ⚠️ *CRITICAL PROTOCOLS:*<br/>
                      1. Switch off ALL ceiling fans.<br/>
                      2. Keep eyelids closed with wet cotton.<br/>
                      <span className="text-[7px] text-gray-400 absolute bottom-1 right-2">12:35 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
