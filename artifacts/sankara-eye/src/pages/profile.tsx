import { useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { UserCircle, Mail, Shield, Building, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [name, setName] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSave = () => {
    updateProfile.mutate({ data: { name } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: "Profile updated successfully" });
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" })
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <Card className="border border-gray-200/80 shadow-md bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden relative select-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-[#ff7a18] opacity-80" />
        <CardHeader className="border-b border-gray-150/60 bg-gradient-to-b from-gray-50/50 to-white/10 pb-6 pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl flex items-center justify-center text-[#ff7a18] border border-orange-100 shadow-inner shrink-0">
              <UserCircle className="h-9 w-9" />
            </div>
            <div>
              <CardTitle className="text-xl font-extrabold text-gray-900 font-['Outfit']">{user?.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className="bg-[#ff7a18] hover:bg-orange-600 text-white border-0 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full select-none shadow-sm shadow-orange-500/5">
                  {user?.role?.replace("_", " ")}
                </Badge>
                {user?.unitName && (
                  <Badge variant="outline" className="text-gray-600 bg-white border-gray-200/85 text-[10px] font-bold uppercase tracking-wider rounded-full select-none">
                    <Building className="h-3 w-3 mr-1 text-[#ff7a18]" /> {user.unitName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-[#ff7a18]" /> Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address (Read-only)</Label>
                <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-200/70 rounded-xl text-gray-500 cursor-not-allowed h-11 text-sm font-semibold">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={updateProfile.isPending || name === user?.name || !name}
              className="mt-2 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white rounded-xl h-11 px-6 font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all border-0 cursor-pointer disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <hr className="border-gray-100" />

          <div className="pt-2">
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/60 rounded-xl h-11 px-6 font-bold shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4 text-red-500" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
