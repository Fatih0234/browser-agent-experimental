"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { createDeclaration, type DeclarationType } from "@/lib/actions/customs";
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
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

const DECLARATION_TYPES: { value: DeclarationType; label: string; description: string }[] = [
  { value: "export", label: "Export", description: "Goods leaving the customs territory for a third country." },
  { value: "import", label: "Import", description: "Goods entering the customs territory from a third country." },
  { value: "transit", label: "Transit", description: "Goods moving through the customs territory under suspension." },
];

export default function NewDeclarationPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: routing
  const [declarationType, setDeclarationType] = useState<DeclarationType | "">("");
  const [originCountry, setOriginCountry] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [transportMode, setTransportMode] = useState("");

  // Step 2: goods
  const [hsCode, setHsCode] = useState("");
  const [commodityDescription, setCommodityDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [incoterms, setIncoterms] = useState("");

  // Step 3: parties
  const [exporterName, setExporterName] = useState("");
  const [importerName, setImporterName] = useState("");
  const [customsOffice, setCustomsOffice] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!currentOrg || !declarationType) return;
    setIsSubmitting(true);
    try {
      const declaration = await createDeclaration(currentOrg.id, {
        declaration_type: declarationType,
        origin_country: originCountry || undefined,
        destination_country: destinationCountry || undefined,
        transport_mode: transportMode as "air" | "sea" | "road" | "rail" | undefined || undefined,
        hs_code: hsCode || undefined,
        commodity_description: commodityDescription || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        unit_of_measure: unitOfMeasure || undefined,
        declared_value_eur: declaredValue ? Number(declaredValue) : undefined,
        currency: currency || "EUR",
        incoterms: incoterms || undefined,
        exporter_name: exporterName || undefined,
        importer_name: importerName || undefined,
        customs_office: customsOffice || undefined,
        notes: notes || undefined,
      });
      toast.success("Declaration created successfully");
      router.push(`/${currentOrg.slug}/customs/${declaration.id}`);
    } catch {
      toast.error("Failed to create declaration");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentOrg) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/customs`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">New Declaration</h2>
          <p className="text-slate-600">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-slate-900" : "bg-slate-200"}`}
          />
        ))}
      </div>

      {/* Step 1: Declaration type & routing */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Declaration Type & Routing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {DECLARATION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setDeclarationType(t.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    declarationType === t.value
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-medium text-slate-900">{t.label}</p>
                  <p className="text-sm text-slate-500 mt-1">{t.description}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="origin-country">Origin Country</Label>
                <Input
                  id="origin-country"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value.toUpperCase())}
                  placeholder="DE"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination-country">Destination Country</Label>
                <Input
                  id="destination-country"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value.toUpperCase())}
                  placeholder="US"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport-mode">Transport Mode</Label>
              <Select value={transportMode} onValueChange={(v) => { if (v) setTransportMode(v); }}>
                <SelectTrigger id="transport-mode">
                  <SelectValue placeholder="Select transport mode..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="air">Air</SelectItem>
                  <SelectItem value="sea">Sea</SelectItem>
                  <SelectItem value="road">Road</SelectItem>
                  <SelectItem value="rail">Rail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button onClick={() => setStep(2)} disabled={!declarationType}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Goods details */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Goods Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hs-code">HS / CN Code</Label>
              <Input
                id="hs-code"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                placeholder="8471.30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commodity-description">
                Commodity Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="commodity-description"
                value={commodityDescription}
                onChange={(e) => setCommodityDescription(e.target.value)}
                placeholder="Laptop computers, portable"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-of-measure">Unit</Label>
                <Input
                  id="unit-of-measure"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  placeholder="PCS"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="declared-value">Declared Value</Label>
                <Input
                  id="declared-value"
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(v) => { if (v) setCurrency(v); }}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incoterms">Incoterms</Label>
              <Select value={incoterms} onValueChange={(v) => { if (v) setIncoterms(v); }}>
                <SelectTrigger id="incoterms">
                  <SelectValue placeholder="Select incoterms..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXW">EXW — Ex Works</SelectItem>
                  <SelectItem value="FCA">FCA — Free Carrier</SelectItem>
                  <SelectItem value="CPT">CPT — Carriage Paid To</SelectItem>
                  <SelectItem value="CIP">CIP — Carriage and Insurance Paid To</SelectItem>
                  <SelectItem value="DAP">DAP — Delivered at Place</SelectItem>
                  <SelectItem value="DDP">DDP — Delivered Duty Paid</SelectItem>
                  <SelectItem value="FOB">FOB — Free on Board</SelectItem>
                  <SelectItem value="CFR">CFR — Cost and Freight</SelectItem>
                  <SelectItem value="CIF">CIF — Cost, Insurance and Freight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!commodityDescription}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Parties */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Exporter, Importer & Office</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exporter-name">Exporter Name</Label>
              <Input
                id="exporter-name"
                value={exporterName}
                onChange={(e) => setExporterName(e.target.value)}
                placeholder="Muster GmbH, Frankfurt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importer-name">Importer Name</Label>
              <Input
                id="importer-name"
                value={importerName}
                onChange={(e) => setImporterName(e.target.value)}
                placeholder="ACME Corp, New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customs-office">Customs Office</Label>
              <Input
                id="customs-office"
                value={customsOffice}
                onChange={(e) => setCustomsOffice(e.target.value)}
                placeholder="Zollamt Frankfurt Flughafen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for the customs officer..."
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & submit */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review & Submit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <dl className="text-sm space-y-3">
              <div>
                <dt className="text-slate-500">Declaration Type</dt>
                <dd className="font-medium capitalize">{declarationType}</dd>
              </div>
              {originCountry && (
                <div>
                  <dt className="text-slate-500">Origin → Destination</dt>
                  <dd className="font-medium">{originCountry} → {destinationCountry || "—"}</dd>
                </div>
              )}
              {transportMode && (
                <div>
                  <dt className="text-slate-500">Transport Mode</dt>
                  <dd className="font-medium capitalize">{transportMode}</dd>
                </div>
              )}
              {hsCode && (
                <div>
                  <dt className="text-slate-500">HS Code</dt>
                  <dd className="font-mono font-medium">{hsCode}</dd>
                </div>
              )}
              {commodityDescription && (
                <div>
                  <dt className="text-slate-500">Commodity</dt>
                  <dd className="font-medium">{commodityDescription}</dd>
                </div>
              )}
              {declaredValue && (
                <div>
                  <dt className="text-slate-500">Declared Value</dt>
                  <dd className="font-medium">{declaredValue} {currency}</dd>
                </div>
              )}
              {incoterms && (
                <div>
                  <dt className="text-slate-500">Incoterms</dt>
                  <dd className="font-medium">{incoterms}</dd>
                </div>
              )}
              {exporterName && (
                <div>
                  <dt className="text-slate-500">Exporter</dt>
                  <dd className="font-medium">{exporterName}</dd>
                </div>
              )}
              {importerName && (
                <div>
                  <dt className="text-slate-500">Importer</dt>
                  <dd className="font-medium">{importerName}</dd>
                </div>
              )}
              {customsOffice && (
                <div>
                  <dt className="text-slate-500">Customs Office</dt>
                  <dd className="font-medium">{customsOffice}</dd>
                </div>
              )}
            </dl>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />Submit Declaration</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
