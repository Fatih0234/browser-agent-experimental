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
  shipmentsCreated: number;
  listingsCreated: number;
  ordersCreated: number;
  employeesCreated: number;
  hrSubmissionsCreated: number;
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

    // ============================================
    // SEED LOGISTICS: 6 shipments + 3 invoices
    // ============================================
    const shipmentStatuses = ["booked", "booked", "in_transit", "in_transit", "delivered", "delivered"] as const;
    const carriers = ["dhl", "ups", "fedex", "dpd", "dhl", "ups"] as const;
    const shipmentsData = shipmentStatuses.map((status, i) => ({
      org_id: orgId,
      tracking_number: `${["JD", "1Z", "FX", "DP", "JD", "1Z"][i]}${String(Math.floor(Math.random() * 1e12)).padStart(12, "0")}`,
      carrier: carriers[i],
      status,
      origin: { name: "Portal Gym GmbH", street: "Musterstraße 1", city: "Berlin", zip: "10115", country: "DE" },
      destination: { name: `Kunde ${i + 1}`, street: `Lieferstraße ${i + 10}`, city: ["München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf"][i], zip: ["80331", "20095", "50667", "60311", "70173", "40213"][i], country: "DE" },
      weight_kg: (1 + i * 0.75).toFixed(2),
      service_type: ["standard", "express", "standard", "economy", "overnight", "standard"][i],
      pickup_date: new Date(Date.now() - (i + 1) * 2 * 86400000).toISOString().split("T")[0],
      estimated_delivery: new Date(Date.now() + (5 - i) * 86400000).toISOString().split("T")[0],
      actual_delivery: status === "delivered" ? new Date(Date.now() - 86400000).toISOString().split("T")[0] : null,
      created_by: user.id,
      seed_run_id: runId,
    }));

    const { data: createdShipments } = await supabase.from("shipments").insert(shipmentsData).select();

    // Invoices for delivered shipments
    const invoicesData = (createdShipments || [])
      .filter((s) => s.status === "delivered")
      .map((s, i) => ({
        org_id: orgId,
        shipment_id: s.id,
        invoice_number: `INV-${new Date().getFullYear()}-${String(1000 + i).padStart(4, "0")}`,
        amount: (18.5 + i * 4.75).toFixed(2),
        currency: "EUR",
        issued_date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
        seed_run_id: runId,
      }));

    await supabase.from("shipment_invoices").insert(invoicesData);

    // ============================================
    // SEED MARKETPLACE: 2 channels × 4 listings × 6 orders
    // ============================================
    const marketplaces = ["amazon", "ebay"] as const;
    const listingTitles = [
      "Stehlampe LED Dimmbar 150cm",
      "Kaffeemaschine Vollautomatisch",
      "Laptoptasche 15 Zoll Business",
      "Bluetooth Headset Office Pro",
    ];
    const listingStatuses = ["active", "active", "active", "inactive"] as const;
    const prices = [89.99, 349.0, 54.99, 129.0];

    const listingsData = marketplaces.flatMap((mp, mpi) =>
      listingTitles.map((title, li) => ({
        org_id: orgId,
        marketplace: mp,
        external_id: `${mp.toUpperCase()}-${String(mpi * 100 + li + 1).padStart(6, "0")}`,
        title,
        status: listingStatuses[li],
        price: prices[li],
        stock_qty: [12, 3, 45, 0][li],
        seed_run_id: runId,
      }))
    );

    const { data: createdListings } = await supabase.from("marketplace_listings").insert(listingsData).select();

    const orderStatuses = ["pending", "shipped", "delivered", "returned", "pending", "delivered"] as const;
    const customerNames = ["Hans Müller", "Anna Schmidt", "Klaus Weber", "Maria Fischer", "Peter Wagner", "Sabine Koch"];
    const ordersData = (createdListings || []).flatMap((listing) =>
      orderStatuses.map((status, oi) => ({
        org_id: orgId,
        marketplace: listing.marketplace,
        order_number: `${listing.marketplace.toUpperCase()}-ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        listing_id: listing.id,
        quantity: 1 + (oi % 3),
        total_amount: (listing.price * (1 + oi % 3)).toFixed(2),
        currency: "EUR",
        status,
        customer_name: customerNames[oi],
        ordered_at: new Date(Date.now() - oi * 3 * 86400000).toISOString(),
        seed_run_id: runId,
      }))
    );

    const { data: createdOrders } = await supabase.from("marketplace_orders").insert(ordersData).select();

    // Seed 2 stored reports (CSV content as text)
    const reportsCsvContent = ["amazon", "ebay"].map((mp) => {
      const header = "order_number,customer_name,quantity,total_amount,currency,status,ordered_at";
      const rows = (createdOrders || [])
        .filter((o) => o.marketplace === mp)
        .slice(0, 5)
        .map((o) => `${o.order_number},"${o.customer_name}",${o.quantity},${o.total_amount},${o.currency},${o.status},${o.ordered_at}`)
        .join("\n");
      return { mp, csv: `${header}\n${rows}` };
    });

    for (const { mp, csv } of reportsCsvContent) {
      const path = `${orgId}/reports/${mp}-orders-seed.csv`;
      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(path, new TextEncoder().encode(csv), { contentType: "text/csv", upsert: true });

      if (!uploadErr) {
        const now = new Date();
        await supabase.from("marketplace_reports").insert({
          org_id: orgId,
          marketplace: mp,
          report_type: "orders",
          period_start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0],
          period_end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0],
          storage_path: path,
          seed_run_id: runId,
        });
      }
    }

    // ============================================
    // SEED HR: 8 employees + 6 submissions
    // ============================================
    const employeesData = [
      { first_name: "Anna", last_name: "Bauer", position: "Software Engineer", department: "Engineering", hire_date: "2021-03-15", status: "active" },
      { first_name: "Klaus", last_name: "Richter", position: "Marketing Manager", department: "Marketing", hire_date: "2019-07-01", status: "active" },
      { first_name: "Maria", last_name: "Hoffmann", position: "Accountant", department: "Finance", hire_date: "2020-01-10", status: "active" },
      { first_name: "Thomas", last_name: "Koch", position: "Sales Rep", department: "Sales", hire_date: "2022-09-20", status: "on_leave" },
      { first_name: "Sarah", last_name: "Wolf", position: "HR Specialist", department: "HR", hire_date: "2018-05-14", status: "active" },
      { first_name: "Michael", last_name: "Braun", position: "DevOps Engineer", department: "Engineering", hire_date: "2023-01-03", status: "active" },
      { first_name: "Julia", last_name: "Schulz", position: "Product Manager", department: "Product", hire_date: "2020-11-22", status: "active" },
      { first_name: "Stefan", last_name: "Meyer", position: "Sales Manager", department: "Sales", hire_date: "2017-04-08", status: "terminated" },
    ].map((e, i) => ({
      ...e,
      org_id: orgId,
      employee_number: `EMP-${String(1000 + i).padStart(4, "0")}`,
      seed_run_id: runId,
    }));

    const { data: createdEmployees } = await supabase.from("employees").insert(employeesData).select();

    const hrSubmissionsData: any[] = [];
    if (createdEmployees && createdEmployees.length >= 6) {
      const submissionTemplates = [
        { employee_idx: 0, type: "sick_note", status: "approved", reference_number: `AU-${new Date().getFullYear()}-100001`, metadata: { start_date: "2026-03-10", end_date: "2026-03-14", diagnosis_code: "J06.9" } },
        { employee_idx: 1, type: "sick_note", status: "submitted", reference_number: `AU-${new Date().getFullYear()}-100002`, metadata: { start_date: "2026-04-01", end_date: "2026-04-03", diagnosis_code: "M54.5" } },
        { employee_idx: 2, type: "kurzarbeit", status: "in_review", reference_number: `KUG-${new Date().getFullYear()}-200001`, metadata: { start_date: "2026-04-01", affected_employees: "12", reason: "Seasonal downturn in orders" } },
        { employee_idx: 3, type: "kurzarbeit", status: "rejected", reference_number: `KUG-${new Date().getFullYear()}-200002`, metadata: { start_date: "2026-02-01", affected_employees: "5", reason: "Production slowdown" } },
        { employee_idx: 4, type: "hiring_support", status: "approved", reference_number: `EFZ-${new Date().getFullYear()}-300001`, metadata: { position_title: "Junior Engineer", start_date: "2026-05-01", grant_type: "Eingliederungszuschuss" } },
        { employee_idx: 5, type: "hiring_support", status: "draft", reference_number: null, metadata: { position_title: "Sales Trainee", start_date: "2026-06-01" } },
      ] as const;

      for (const tmpl of submissionTemplates) {
        hrSubmissionsData.push({
          org_id: orgId,
          employee_id: createdEmployees[tmpl.employee_idx].id,
          submission_type: tmpl.type,
          status: tmpl.status,
          reference_number: tmpl.reference_number,
          submitted_at: tmpl.status !== "draft" ? new Date(Date.now() - 7 * 86400000).toISOString() : null,
          metadata: tmpl.metadata,
          created_by: user.id,
          seed_run_id: runId,
        });
      }
    }

    const { data: createdHrSubmissions } = await supabase.from("hr_submissions").insert(hrSubmissionsData).select();

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
        shipments_created: createdShipments?.length || 0,
        listings_created: createdListings?.length || 0,
        orders_created: createdOrders?.length || 0,
        employees_created: createdEmployees?.length || 0,
        hr_submissions_created: createdHrSubmissions?.length || 0,
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
          (createdNotifications?.length || 0) +
          (createdShipments?.length || 0) +
          (createdListings?.length || 0) +
          (createdOrders?.length || 0) +
          (createdEmployees?.length || 0) +
          (createdHrSubmissions?.length || 0),
      })
      .eq("id", runId);

    revalidatePath(`/dashboard`);

    return {
      runId,
      organizationsCreated: 0,
      casesCreated: createdCases?.length || 0,
      documentsCreated: createdDocs?.length || 0,
      notificationsCreated: createdNotifications?.length || 0,
      shipmentsCreated: createdShipments?.length || 0,
      listingsCreated: createdListings?.length || 0,
      ordersCreated: createdOrders?.length || 0,
      employeesCreated: createdEmployees?.length || 0,
      hrSubmissionsCreated: createdHrSubmissions?.length || 0,
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
  // Portal module tables
  await supabase.from("hr_submissions").delete().eq("seed_run_id", runId);
  await supabase.from("employees").delete().eq("seed_run_id", runId);
  await supabase.from("marketplace_reports").delete().eq("seed_run_id", runId);
  await supabase.from("marketplace_orders").delete().eq("seed_run_id", runId);
  await supabase.from("marketplace_listings").delete().eq("seed_run_id", runId);
  await supabase.from("shipment_invoices").delete().eq("seed_run_id", runId);
  await supabase.from("shipments").delete().eq("seed_run_id", runId);
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
