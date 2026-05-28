import { useState } from "react";
import {
  useListUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  Unit,
  UnitInput,
  UnitUpdate,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Phone, Building, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnitFormState {
  name: string;
  state: string;
  district: string;
  address: string;
  coordinatorName: string;
  coordinatorWhatsapp: string;
  isActive: boolean;
}

const initialFormState: UnitFormState = {
  name: "",
  state: "",
  district: "",
  address: "",
  coordinatorName: "",
  coordinatorWhatsapp: "",
  isActive: true,
};

export default function Units() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "eye_bank_head";

  const { data: units, isLoading } = useListUnits();
  const createUnitMutation = useCreateUnit();
  const updateUnitMutation = useUpdateUnit();
  const deleteUnitMutation = useDeleteUnit();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<UnitFormState>(initialFormState);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formError, setFormError] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setFormState(initialFormState);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormState({
      name: unit.name,
      state: unit.state,
      district: unit.district,
      address: unit.address || "",
      coordinatorName: unit.coordinatorName,
      coordinatorWhatsapp: unit.coordinatorWhatsapp,
      isActive: unit.isActive,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenDelete = (unit: Unit) => {
    setDeletingUnit(unit);
    setIsDeleteOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formState.name.trim()) {
      setFormError("Hospital branch name is required");
      return false;
    }
    if (!formState.state.trim()) {
      setFormError("State is required");
      return false;
    }
    if (!formState.district.trim()) {
      setFormError("District is required");
      return false;
    }
    if (!formState.coordinatorName.trim()) {
      setFormError("Coordinator name is required");
      return false;
    }
    const whatsapp = formState.coordinatorWhatsapp.trim();
    if (!whatsapp) {
      setFormError("WhatsApp contact is required");
      return false;
    }
    if (!/^\d{10}$/.test(whatsapp)) {
      setFormError("WhatsApp contact must be exactly 10 digits");
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    try {
      const payload = {
        name: formState.name.trim(),
        state: formState.state.trim(),
        district: formState.district.trim(),
        address: formState.address.trim() || undefined,
        coordinatorName: formState.coordinatorName.trim(),
        coordinatorWhatsapp: formState.coordinatorWhatsapp.trim(),
        isActive: formState.isActive,
      };

      if (editingUnit) {
        await updateUnitMutation.mutateAsync({
          id: editingUnit.id,
          data: payload as UnitUpdate,
        });
        toast({
          title: "Unit Updated",
          description: `Successfully updated branch "${formState.name}".`,
        });
      } else {
        await createUnitMutation.mutateAsync({
          data: payload as UnitInput,
        });
        toast({
          title: "Unit Registered",
          description: `Successfully registered branch "${formState.name}".`,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err?.data?.error || err?.message || "Failed to save unit settings. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;
    try {
      await deleteUnitMutation.mutateAsync({ id: deletingUnit.id });
      toast({
        title: "Unit Deleted",
        description: `Successfully removed branch "${deletingUnit.name}".`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDeleteOpen(false);
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.data?.error || err?.message || "Failed to delete hospital unit.",
        variant: "destructive",
      });
    }
  };

  const isSaving = createUnitMutation.isPending || updateUnitMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hospital Units</h1>
          <p className="text-gray-500">Manage Sankara Eye Hospital branches nationwide.</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white shadow-sm transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Unit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl w-full" />
          ))
        ) : !units || units.length === 0 ? (
          <Card className="col-span-full border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center gap-4 bg-gray-50/50 rounded-2xl">
            <Building className="h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">No Units Registered</h3>
              <p className="text-gray-500 mt-1">Get started by creating your first hospital unit.</p>
            </div>
            {isAdmin && (
              <Button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 text-white mt-2">
                <Plus className="mr-2 h-4 w-4" /> Add Unit
              </Button>
            )}
          </Card>
        ) : (
          units.map((unit) => (
            <Card key={unit.id} className="shadow-sm border border-gray-200/80 rounded-2xl hover:shadow-md hover:scale-[1.015] hover:border-orange-500/25 transition-all duration-300 bg-white/70 backdrop-blur-md flex flex-col overflow-hidden group relative select-none">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-[#ff7a18] opacity-80" />
              <CardHeader className="pb-3 flex flex-row justify-between items-start gap-4 bg-gradient-to-b from-gray-50/50 to-white/10 pt-5">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base font-extrabold leading-tight text-gray-900 font-['Outfit'] group-hover:text-[#ff7a18] transition-colors">{unit.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="inline-flex items-center bg-slate-50 border border-gray-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600 uppercase tracking-wide">{unit.district}, {unit.state}</span>
                  </div>
                </div>
                <Badge
                  className={`border-0 select-none font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-full ${
                    unit.isActive
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-sm shadow-emerald-500/5"
                      : "bg-gray-150/70 text-gray-500 hover:bg-gray-150/70"
                  }`}
                >
                  {unit.isActive ? "Active Hub" : "Suspended"}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-gray-200/50 shadow-sm">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-white p-2 rounded-lg text-[#ff7a18] shadow-sm border border-orange-100/50">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Coordinator</div>
                      <div className="font-extrabold text-gray-800">{unit.coordinatorName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-white p-2 rounded-lg text-[#ff7a18] shadow-sm border border-orange-100/50">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">WhatsApp Contact</div>
                      <div className="font-extrabold text-gray-800">{unit.coordinatorWhatsapp}</div>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-2 border-t border-gray-150/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(unit)}
                      className="w-full text-xs font-extrabold border-gray-200/75 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 rounded-xl h-10 shadow-sm cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-gray-500" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDelete(unit)}
                      className="w-full text-xs font-extrabold border-red-200/50 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1.5 rounded-xl h-10 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* CREATE & EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[480px] rounded-2xl bg-white border border-gray-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingUnit ? "Edit Hospital Unit" : "Add Hospital Unit"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              {editingUnit
                ? "Modify the coordinator, contact details, and state of this hospital branch."
                : "Register a new branch of Sankara Eye Hospital into the coordination system."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3">
              <AlertDescription className="text-sm font-medium leading-snug">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="unit-name" className="text-sm font-semibold text-gray-700">
                Hospital Branch Name
              </Label>
              <Input
                id="unit-name"
                placeholder="e.g. Sankara Eye Hospital Coimbatore"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg"
                disabled={isSaving}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="unit-state" className="text-sm font-semibold text-gray-700">
                  State
                </Label>
                <Input
                  id="unit-state"
                  placeholder="e.g. Tamil Nadu"
                  value={formState.state}
                  onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg"
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-district" className="text-sm font-semibold text-gray-700">
                  District
                </Label>
                <Input
                  id="unit-district"
                  placeholder="e.g. Coimbatore"
                  value={formState.district}
                  onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg"
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-address" className="text-sm font-semibold text-gray-700">
                Detailed Address
              </Label>
              <Textarea
                id="unit-address"
                placeholder="Hospital address, pincode..."
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg resize-none min-h-[70px]"
                disabled={isSaving}
              />
            </div>

            <hr className="border-gray-100 my-1" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="unit-coord" className="text-sm font-semibold text-gray-700">
                  Coordinator Name
                </Label>
                <Input
                  id="unit-coord"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={formState.coordinatorName}
                  onChange={(e) => setFormState({ ...formState, coordinatorName: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg"
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-whatsapp" className="text-sm font-semibold text-gray-700">
                  WhatsApp Contact (10 digits)
                </Label>
                <Input
                  id="unit-whatsapp"
                  placeholder="e.g. 9876543210"
                  type="tel"
                  maxLength={10}
                  value={formState.coordinatorWhatsapp}
                  onChange={(e) => setFormState({ ...formState, coordinatorWhatsapp: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg"
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-0.5">
                <Label htmlFor="unit-active" className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Unit Active Status
                </Label>
                <p className="text-xs text-gray-500">Only active units receive eye donation coordinate logs.</p>
              </div>
              <Switch
                id="unit-active"
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState({ ...formState, isActive: checked })}
                disabled={isSaving}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : editingUnit ? (
                  "Save Changes"
                ) : (
                  "Add Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl bg-white border border-gray-150">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm mt-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 mt-2">Delete Hospital Unit?</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm leading-snug">
              Are you sure you want to permanently delete branch <span className="font-semibold text-gray-900">"{deletingUnit?.name}"</span>?
              This action cannot be undone and will affect associated users and records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
              disabled={deleteUnitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-all"
              disabled={deleteUnitMutation.isPending}
            >
              {deleteUnitMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              ) : (
                "Delete Branch"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
