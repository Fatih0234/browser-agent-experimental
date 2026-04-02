"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/lib/org-context";
import {
  seedScenario,
  resetScenario,
  getScenarioRuns,
  type SeedResult,
} from "@/lib/actions/scenarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Play, RotateCcw, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  running: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function AdminSeedPage() {
  const { currentOrg, isAdmin } = useOrg();
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetRunId, setResetRunId] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const data = await getScenarioRuns(currentOrg.id);
      setRuns(data);
    } catch (error) {
      console.error("Error loading runs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  async function executeSeed() {
    if (!currentOrg) return;
    setShowSeedDialog(false);
    setIsSeeding(true);
    try {
      const result = await seedScenario(currentOrg.id);
      setLastResult(result);
      toast.success(`Seeded ${result.casesCreated} cases with ${result.documentsCreated} documents`);
      await loadRuns();
    } catch (error: any) {
      console.error("Error seeding:", error);
      toast.error(error.message || "Failed to seed scenario");
    } finally {
      setIsSeeding(false);
    }
  }

  async function executeReset() {
    if (!resetRunId) return;
    setShowResetDialog(false);
    try {
      await resetScenario(resetRunId);
      toast.success("Scenario data reset successfully");
      setLastResult(null);
      await loadRuns();
    } catch (error: any) {
      console.error("Error resetting:", error);
      toast.error(error.message || "Failed to reset scenario");
    } finally {
      setResetRunId(null);
    }
  }

  function handleSeedClick() {
    setShowSeedDialog(true);
  }

  function handleResetClick(runId: string) {
    setResetRunId(runId);
    setShowResetDialog(true);
  }

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <CardTitle>Admin Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-600">
              Only organization admins can access scenario management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Scenario Management</h2>
        <p className="text-slate-600">
          Seed and reset scenario data for {currentOrg.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Seed Scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              Create sample data including:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>5 sample cases (different types and statuses)</li>
              <li>3 documents per case (PDF, CSV, TXT)</li>
              <li>Real file uploads to storage</li>
              <li>Notifications for tracking</li>
            </ul>
            <Button
              onClick={handleSeedClick}
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Seed Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Last Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cases Created</span>
                  <span className="font-medium">{lastResult.casesCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Documents Created</span>
                  <span className="font-medium">{lastResult.documentsCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Notifications</span>
                  <span className="font-medium">{lastResult.notificationsCreated}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No seed operation performed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No scenario runs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{run.id.slice(0, 8)}...</span>
                      <Badge className={statusColors[run.status] || "bg-slate-100"}>
                        {run.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Created: {new Date(run.created_at).toLocaleString()}
                      {run.completed_at && (
                        <>
                          {" "}
                          • Completed: {new Date(run.completed_at).toLocaleString()}
                        </>
                      )}
                      {run.created_count > 0 && (
                        <>
                          {" "}
                          • {run.created_count} items created
                        </>
                      )}
                    </p>
                  </div>
                  {run.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetClick(run.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2 text-red-500" />
                      Reset
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-slate-600">
            <strong>Reset Safety:</strong> When you reset a scenario, only the data
            created during that specific seed operation will be deleted. Non-seeded
            data (manually created cases, documents, etc.) will be preserved.
          </p>
          <p className="text-slate-600">
            <strong>Audit Trail:</strong> All seed and reset operations are logged
            to the audit log for accountability.
          </p>
        </CardContent>
      </Card>

      {/* Seed Confirmation Dialog */}
      <AlertDialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Scenario Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create 5 sample cases with 3 documents each (PDF, CSV, TXT).
              Real files will be uploaded to storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSeedDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeSeed}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Reset Scenario Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete ALL seeded data for this run. Non-seeded data
              (manually created cases, documents) will be preserved.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResetDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeReset} className="bg-red-600 hover:bg-red-700">
              Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
