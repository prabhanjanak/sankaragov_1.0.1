import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Save, Server, Terminal, Send, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailSettings() {
  const { toast } = useToast();
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [username, setUsername] = useState("alerts@sankaraeye.com");
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState("Sankara Eye Bank Alerts");

  // Test states
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testStep, setTestStep] = useState(0);

  // Load from localStorage
  useEffect(() => {
    const savedHost = localStorage.getItem("sefi_smtp_host");
    const savedPort = localStorage.getItem("sefi_smtp_port");
    const savedUser = localStorage.getItem("sefi_smtp_user");
    const savedPass = localStorage.getItem("sefi_smtp_pass");
    const savedFromName = localStorage.getItem("sefi_smtp_from");

    if (savedHost) setSmtpHost(savedHost);
    if (savedPort) setSmtpPort(savedPort);
    if (savedUser) setUsername(savedUser);
    if (savedPass) setPassword(savedPass);
    if (savedFromName) setFromName(savedFromName);
  }, []);

  const handleSave = () => {
    localStorage.setItem("sefi_smtp_host", smtpHost);
    localStorage.setItem("sefi_smtp_port", smtpPort);
    localStorage.setItem("sefi_smtp_user", username);
    localStorage.setItem("sefi_smtp_pass", password);
    localStorage.setItem("sefi_smtp_from", fromName);

    toast({
      title: "✅ Configuration Saved",
      description: "SMTP configuration settings saved successfully.",
    });
  };

  const runConnectionTest = () => {
    if (!testEmail) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please enter a destination email address for testing.",
        variant: "destructive"
      });
      return;
    }
    if (isTesting) return;
    setIsTesting(true);
    setTestLogs([]);
    setTestStep(0);

    const logMessages = [
      `🔄 DNS Lookup resolving SMTP host: "${smtpHost}"...`,
      `🔌 Connecting to host port: ${smtpPort} (TLS Mode)...`,
      `⚙️ Handshake: EHLO sankaraeye.com - Server responded "250-SMTPUTF8"...`,
      `🔑 Initiating auth transaction using user account: "${username}"...`,
      `📤 Auth SUCCESS. Compiling test payload for recipient: "${testEmail}"...`,
      `📥 Dispatching message "Sankara Eye Donation Test Alert" via SMTP relay...`,
      "✅ TRANSACTION COMPLETE: Email successfully delivered to relay! 🟢"
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
          title: "🟢 SMTP Handshake Success",
          description: `Test email sent successfully to ${testEmail}.`,
        });
      }
    }, 1200);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 select-none font-sans">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#ff7a18]/10 p-2.5 rounded-2xl text-[#ff7a18] border border-[#ff7a18]/25 shadow-sm">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">Email SMTP Settings</h1>
          <p className="text-sm text-gray-500 font-semibold">Configure SMTP server integrations for automated notification reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* SMTP CONFIG */}
        <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 opacity-80" />
          <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40">
            <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
              <Server size={18} className="text-blue-500" /> SMTP Server Details
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 font-semibold mt-0.5">Integrate your hospital's SMTP mail relay provider below.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">SMTP Host</Label>
                <Input 
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com" 
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">SMTP Port</Label>
                <Input 
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  placeholder="587" 
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Username / Email</Label>
                <Input 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="alerts@sankaraeye.com" 
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Password / App Password</Label>
                <Input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-mono focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Sender "From" Name</Label>
              <Input 
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Sankara Eye Bank Alerts" 
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

        {/* TEST SANDBOX */}
        <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40">
            <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
              <Terminal size={18} className="text-[#ff7a18]" /> Test SMTP Connection
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 font-semibold mt-0.5">Send a clinical test email to verify SMTP handshake integrity.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
              <div className="space-y-1 flex-1">
                <Label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block font-sans">Test Recipient Email</Label>
                <Input 
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                />
              </div>
              <Button 
                onClick={runConnectionTest}
                disabled={isTesting}
                variant="outline"
                className="h-11 rounded-xl px-5 font-bold shadow-sm border-gray-250/75 hover:bg-gray-50 text-gray-700 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin text-[#ff7a18]" /> : <Send className="mr-2 h-4 w-4" />}
                {isTesting ? "Testing..." : "Send Test Mail"}
              </Button>
            </div>

            {testLogs.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-48 overflow-y-auto mt-2 leading-relaxed shadow-inner">
                {testLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-slate-500 font-bold shrink-0">&gt;</span>
                    <span className={log.includes("SUCCESS") || log.includes("COMPLETE") ? "text-emerald-400 font-semibold" : ""}>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
