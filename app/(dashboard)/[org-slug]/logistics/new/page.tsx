"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { createShipment, type ShipmentCarrier, type ShipmentServiceType } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function AddressFields({
  prefix,
  label,
  values,
  onChange,
}: {
  prefix: string;
  label: string;
  values: { name: string; street: string; city: string; zip: string; country: string };
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-slate-800">{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor={`${prefix}-name`}>Company / Name</Label>
          <Input
            id={`${prefix}-name`}
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Acme GmbH"
            required
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor={`${prefix}-street`}>Street & Number</Label>
          <Input
            id={`${prefix}-street`}
            value={values.street}
            onChange={(e) => onChange("street", e.target.value)}
            placeholder="Musterstraße 12"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${prefix}-zip`}>ZIP Code</Label>
          <Input
            id={`${prefix}-zip`}
            value={values.zip}
            onChange={(e) => onChange("zip", e.target.value)}
            placeholder="10115"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${prefix}-city`}>City</Label>
          <Input
            id={`${prefix}-city`}
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Berlin"
            required
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor={`${prefix}-country`}>Country</Label>
          <Input
            id={`${prefix}-country`}
            value={values.country}
            onChange={(e) => onChange("country", e.target.value)}
            placeholder="DE"
            required
          />
        </div>
      </div>
    </div>
  );
}

const emptyAddress = { name: "", street: "", city: "", zip: "", country: "DE" };

export default function NewShipmentPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [carrier, setCarrier] = useState<ShipmentCarrier>("dhl");
  const [serviceType, setServiceType] = useState<ShipmentServiceType>("standard");
  const [weightKg, setWeightKg] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [origin, setOrigin] = useState({ ...emptyAddress });
  const [destination, setDestination] = useState({ ...emptyAddress });

  function updateOrigin(field: string, value: string) {
    setOrigin((prev) => ({ ...prev, [field]: value }));
  }

  function updateDestination(field: string, value: string) {
    setDestination((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setIsSubmitting(true);
    try {
      const shipment = await createShipment(currentOrg.id, {
        carrier,
        origin,
        destination,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        service_type: serviceType,
        pickup_date: pickupDate || undefined,
        estimated_delivery: estimatedDelivery || undefined,
        notes: notes || undefined,
      });
      toast.success(`Shipment created: ${shipment.tracking_number}`);
      router.push(`/${currentOrg.slug}/logistics/${shipment.id}`);
    } catch {
      toast.error("Failed to create shipment");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentOrg) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/logistics`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">New Shipment</h2>
          <p className="text-slate-600">Create a new shipment booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Carrier & Service</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Select value={carrier} onValueChange={(v) => setCarrier(v as ShipmentCarrier)}>
                <SelectTrigger id="carrier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dpd">DPD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type</Label>
              <Select value={serviceType} onValueChange={(v) => setServiceType(v as ShipmentServiceType)}>
                <SelectTrigger id="service-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="2.50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-date">Pickup Date</Label>
              <Input
                id="pickup-date"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-delivery">Estimated Delivery</Label>
              <Input
                id="estimated-delivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-8">
            <AddressFields prefix="origin" label="Origin" values={origin} onChange={updateOrigin} />
            <AddressFields prefix="destination" label="Destination" values={destination} onChange={updateDestination} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional shipping notes or instructions..."
              className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Shipment"
            )}
          </Button>
          <Link href={`/${currentOrg.slug}/logistics`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
