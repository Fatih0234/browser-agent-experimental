"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/csv",
  "text/plain",
];

// Sample fake file content generators
function generateFakePDFContent(): ArrayBuffer {
  // Simple PDF-like content (not a real PDF, but has PDF markers)
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Portal Gym Test Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 

trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
313
%%EOF`;
  return new TextEncoder().encode(content).buffer;
}

function generateFakeCSVContent(): string {
  return `id,name,email,amount,date
1,John Doe,john@example.com,1234.56,2025-01-15
2,Jane Smith,jane@example.com,2345.67,2025-01-16
3,Bob Johnson,bob@example.com,3456.78,2025-01-17
4,Alice Brown,alice@example.com,4567.89,2025-01-18
5,Charlie Wilson,charlie@example.com,5678.90,2025-01-19`;
}

function generateFakeTXTContent(): string {
  return `PORTAL GYM TEST DOCUMENT
==========================

This is a test document generated for the Portal Gym benchmark platform.

Document Information:
- Generated: ${new Date().toISOString()}
- Purpose: Browser automation testing
- Organization: Portal Gym

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua.

END OF DOCUMENT`;
}

export interface SeedResult {
  runId: string;
  organizationsCreated: number;
  casesCreated: number;
  documentsCreated: number;
  notificationsCreated: number;
}

export async function seedScenario(orgId: string): Promise<SeedResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify admin membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can seed scenarios");
  }

  // Create scenario run record
  const { data: run, error: runError } = await supabase
    .from("scenario_runs")
    .insert({
      template_id: null, // Could reference a template
      org_id: orgId,
      run_by: user.id,
      status: "running",
    })
    .select()
    .single();

  if (runError) throw runError;

  const runId = run.id;

  try {
    // Create sample cases
    const casesData = [
      {
        org_id: orgId,
        title: "Tax Filing 2024 - Q1",
        description: "Quarterly tax filing documents for review",
        case_type: "tax",
        priority: "high",
        status: "open",
        created_by: user.id,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        title: "Procurement Request - Office Supplies",
        description: "Annual office supplies procurement",
        case_type: "procurement",
        priority: "medium",
        status: "in_review",
        created_by: user.id,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        title: "Employee Onboarding - Sarah Chen",
        description: "New hire onboarding documentation",
        case_type: "hr",
        priority: "medium",
        status: "draft",
        created_by: user.id,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        title: "Shipping Logistics - March Batch",
        description: "Logistics coordination for March shipments",
        case_type: "logistics",
        priority: "urgent",
        status: "needs_correction",
        created_by: user.id,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        title: "General Inquiry - Partnership Opportunity",
        description: "Partnership proposal from external vendor",
        case_type: "general",
        priority: "low",
        status: "closed",
        created_by: user.id,
        seed_run_id: runId,
      },
    ];

    const { data: createdCases, error: casesError } = await supabase
      .from("cases")
      .insert(casesData)
      .select();

    if (casesError) throw casesError;

    // Create documents with fake files
    const documentsData: any[] = [];
    const versionsData: any[] = [];
    const storagePaths: string[] = [];

    for (const c of createdCases || []) {
      // Create PDF document
      const pdfContent = generateFakePDFContent();
      const pdfPath = `${orgId}/${c.id}/${crypto.randomUUID()}/v1.pdf`;

      const { error: pdfUploadError } = await supabase.storage
        .from("documents")
        .upload(pdfPath, pdfContent, { contentType: "application/pdf" });

      if (!pdfUploadError) {
        storagePaths.push(pdfPath);
        documentsData.push({
          org_id: orgId,
          case_id: c.id,
          name: `${c.title} - Supporting Documents.pdf`,
          description: "Generated PDF document for testing",
          mime_type: "application/pdf",
          created_by: user.id,
          seed_run_id: runId,
        });
      }

      // Create CSV document
      const csvContent = generateFakeCSVContent();
      const csvPath = `${orgId}/${c.id}/${crypto.randomUUID()}/v1.csv`;

      const { error: csvUploadError } = await supabase.storage
        .from("documents")
        .upload(csvPath, new TextEncoder().encode(csvContent), { contentType: "text/csv" });

      if (!csvUploadError) {
        storagePaths.push(csvPath);
        documentsData.push({
          org_id: orgId,
          case_id: c.id,
          name: `${c.title} - Data Export.csv`,
          description: "Generated CSV data for testing",
          mime_type: "text/csv",
          created_by: user.id,
          seed_run_id: runId,
        });
      }

      // Create TXT document
      const txtContent = generateFakeTXTContent();
      const txtPath = `${orgId}/${c.id}/${crypto.randomUUID()}/v1.txt`;

      const { error: txtUploadError } = await supabase.storage
        .from("documents")
        .upload(txtPath, new TextEncoder().encode(txtContent), { contentType: "text/plain" });

      if (!txtUploadError) {
        storagePaths.push(txtPath);
        documentsData.push({
          org_id: orgId,
          case_id: c.id,
          name: `${c.title} - Notes.txt`,
          description: "Generated text notes for testing",
          mime_type: "text/plain",
          created_by: user.id,
          seed_run_id: runId,
        });
      }
    }

    // Insert documents
    const { data: createdDocs, error: docsError } = await supabase
      .from("documents")
      .insert(documentsData)
      .select();

    if (docsError) throw docsError;

    // Create document versions and link
    for (let i = 0; i < (createdDocs || []).length; i++) {
      const doc = createdDocs![i];
      const path = storagePaths[i];
      const { data: stat } = await supabase.storage.from("documents").list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop() || "",
      });
      const fileSize = stat?.[0]?.metadata?.size || 1024;

      const { data: version } = await supabase
        .from("document_versions")
        .insert({
          document_id: doc.id,
          storage_path: path,
          file_size: fileSize,
          version_number: 1,
          created_by: user.id,
          seed_run_id: runId,
        })
        .select()
        .single();

      if (version) {
        await supabase
          .from("documents")
          .update({ latest_version_id: version.id })
          .eq("id", doc.id);
      }
    }

    // Create notifications
    const notificationsData = [
      {
        org_id: orgId,
        type: "info",
        title: "Scenario Data Seeded",
        message: `Successfully seeded ${createdCases?.length || 0} cases with documents`,
        read: false,
        seed_run_id: runId,
      },
      {
        user_id: user.id,
        type: "success",
        title: "Seed Operation Complete",
        message: `Created ${createdDocs?.length || 0} documents across ${createdCases?.length || 0} cases`,
        read: false,
        seed_run_id: runId,
      },
    ];

    const { data: createdNotifications, error: notifError } = await supabase
      .from("notifications")
      .insert(notificationsData)
      .select();

    if (notifError) throw notifError;

    // Log audit event
    await supabase.from("audit_events").insert({
      org_id: orgId,
      user_id: user.id,
      action: "scenario_seed",
      entity_type: "scenario_run",
      entity_id: runId,
      metadata: {
        cases_created: createdCases?.length || 0,
        documents_created: createdDocs?.length || 0,
        notifications_created: createdNotifications?.length || 0,
      },
    });

    // Update scenario run status
    await supabase
      .from("scenario_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        created_count:
          (createdCases?.length || 0) +
          (createdDocs?.length || 0) +
          (createdNotifications?.length || 0),
      })
      .eq("id", runId);

    revalidatePath(`/dashboard`);

    return {
      runId,
      organizationsCreated: 0, // Using existing org
      casesCreated: createdCases?.length || 0,
      documentsCreated: createdDocs?.length || 0,
      notificationsCreated: createdNotifications?.length || 0,
    };
  } catch (error) {
    // Update scenario run to failed
    await supabase
      .from("scenario_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    throw error;
  }
}

export async function resetScenario(runId: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get the scenario run
  const { data: run } = await supabase
    .from("scenario_runs")
    .select("org_id")
    .eq("id", runId)
    .single();

  if (!run) throw new Error("Scenario run not found");

  // Verify admin membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", run.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can reset scenarios");
  }

  // Get all documents to delete from storage
  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("seed_run_id", runId);

  const docIds = documents?.map((d) => d.id) || [];

  if (docIds.length > 0) {
    // Get storage paths
    const { data: versions } = await supabase
      .from("document_versions")
      .select("storage_path")
      .in("document_id", docIds);

    const paths = versions?.map((v) => v.storage_path) || [];

    // Delete from storage
    if (paths.length > 0) {
      await supabase.storage.from("documents").remove(paths);
    }
  }

  // Delete seeded records (in order to respect foreign keys)
  await supabase.from("audit_events").delete().eq("entity_id", runId).eq("action", "scenario_seed");
  await supabase.from("notifications").delete().eq("seed_run_id", runId);
  await supabase.from("document_versions").delete().eq("seed_run_id", runId);
  await supabase.from("documents").delete().eq("seed_run_id", runId);
  await supabase.from("cases").delete().eq("seed_run_id", runId);
  await supabase.from("scenario_runs").delete().eq("id", runId);

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: run.org_id,
    user_id: user.id,
    action: "scenario_reset",
    entity_type: "scenario_run",
    entity_id: runId,
  });

  revalidatePath(`/dashboard`);
}

export async function getScenarioRuns(orgId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  const { data, error } = await supabase
    .from("scenario_runs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}
