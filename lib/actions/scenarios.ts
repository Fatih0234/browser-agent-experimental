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
  companiesCreated: number;
  tendersCreated: number;
  submissionsCreated: number;
  taxFilingsCreated: number;
  disclosuresCreated: number;
  reconciliationMatchesCreated: number;
  customsDeclarationsCreated: number;
  customsDocumentsCreated: number;
  customsExceptionsCreated: number;
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

    const { data: createdShipmentInvoices } = await supabase.from("shipment_invoices").insert(invoicesData).select();

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

    // ============================================
    // SEED RECONCILIATION: matches for shipment invoices + marketplace orders
    // ============================================
    const reconciliationData: Array<{
      org_id: string;
      invoice_source: string;
      invoice_id: string;
      invoice_amount: number;
      expected_amount: number | null;
      currency: string;
      status: string;
      match_type: string | null;
      flagged_reason: string | null;
      notes: string | null;
      matched_by: string;
      matched_at: string;
      seed_run_id: string;
    }> = [];

    // Reconciliation matches for shipment invoices (create 2: 1 matched, 1 flagged)
    const shipInvList = createdShipmentInvoices || [];
    if (shipInvList.length >= 1) {
      reconciliationData.push({
        org_id: orgId,
        invoice_source: "shipment",
        invoice_id: shipInvList[0].id,
        invoice_amount: Number(shipInvList[0].amount),
        expected_amount: Number(shipInvList[0].amount),
        currency: "EUR",
        status: "matched",
        match_type: "exact",
        flagged_reason: null,
        notes: "Verified against carrier confirmation",
        matched_by: user.id,
        matched_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        seed_run_id: runId,
      });
    }
    if (shipInvList.length >= 2) {
      const inv = shipInvList[1];
      const expectedAmt = Number(inv.amount) - 5.0;
      reconciliationData.push({
        org_id: orgId,
        invoice_source: "shipment",
        invoice_id: inv.id,
        invoice_amount: Number(inv.amount),
        expected_amount: expectedAmt,
        currency: "EUR",
        status: "flagged",
        match_type: null,
        flagged_reason: "Amount mismatch: invoice exceeds agreed rate by €5.00",
        notes: "Awaiting carrier clarification",
        matched_by: user.id,
        matched_at: new Date(Date.now() - 86400000).toISOString(),
        seed_run_id: runId,
      });
    }

    // Reconciliation matches for marketplace orders (create 2: 1 matched, 1 flagged)
    const orderList = createdOrders || [];
    if (orderList.length >= 1) {
      reconciliationData.push({
        org_id: orgId,
        invoice_source: "marketplace",
        invoice_id: orderList[0].id,
        invoice_amount: Number(orderList[0].total_amount),
        expected_amount: Number(orderList[0].total_amount),
        currency: "EUR",
        status: "matched",
        match_type: "exact",
        flagged_reason: null,
        notes: null,
        matched_by: user.id,
        matched_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        seed_run_id: runId,
      });
    }
    if (orderList.length >= 3) {
      const order = orderList[2];
      reconciliationData.push({
        org_id: orgId,
        invoice_source: "marketplace",
        invoice_id: order.id,
        invoice_amount: Number(order.total_amount),
        expected_amount: Number(order.total_amount) + 12.5,
        currency: "EUR",
        status: "flagged",
        match_type: null,
        flagged_reason: "Revenue below expected: possible return not yet processed",
        notes: null,
        matched_by: user.id,
        matched_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        seed_run_id: runId,
      });
    }

    const { data: createdReconciliationMatches } = reconciliationData.length > 0
      ? await supabase.from("reconciliation_matches").insert(reconciliationData).select()
      : { data: [] };

    // ============================================
    // SEED CUSTOMS & EXPORT: 12 declarations + 24 documents + 2 exceptions
    // ============================================
    const declarationTemplates = [
      { declaration_type: "export", status: "draft", origin_country: "DE", destination_country: "US", transport_mode: "air", hs_code: "8471.30", commodity_description: "Laptop computers, portable", quantity: 10, unit_of_measure: "PCS", declared_value_eur: 12500.00, incoterms: "DAP", exporter_name: "Muster GmbH", importer_name: "ACME Corp", customs_office: "Zollamt Frankfurt Flughafen" },
      { declaration_type: "export", status: "draft", origin_country: "DE", destination_country: "GB", transport_mode: "road", hs_code: "3004.90", commodity_description: "Medicinal products, mixed", quantity: 200, unit_of_measure: "KGM", declared_value_eur: 8750.00, incoterms: "DDP", exporter_name: "Pharma GmbH", importer_name: "UK Healthcare Ltd", customs_office: "Zollamt Aachen" },
      { declaration_type: "import", status: "draft", origin_country: "CN", destination_country: "DE", transport_mode: "sea", hs_code: "6204.62", commodity_description: "Women's trousers, cotton", quantity: 500, unit_of_measure: "PCS", declared_value_eur: 4200.00, incoterms: "CIF", exporter_name: "Shenzhen Fashion Co", importer_name: "Mode GmbH", customs_office: "Zollamt Hamburg Hafen" },
      { declaration_type: "export", status: "submitted", origin_country: "DE", destination_country: "JP", transport_mode: "air", hs_code: "9022.19", commodity_description: "X-ray apparatus, medical", quantity: 2, unit_of_measure: "PCS", declared_value_eur: 95000.00, incoterms: "CIP", exporter_name: "Medical Tech AG", importer_name: "Tokyo Health KK", customs_office: "Zollamt München Flughafen" },
      { declaration_type: "export", status: "submitted", origin_country: "DE", destination_country: "AU", transport_mode: "sea", hs_code: "8703.23", commodity_description: "Motor vehicles, cylinder 1500-3000cc", quantity: 5, unit_of_measure: "PCS", declared_value_eur: 187500.00, incoterms: "FOB", exporter_name: "Auto Export AG", importer_name: "Sydney Motors Pty", customs_office: "Zollamt Bremerhaven" },
      { declaration_type: "import", status: "submitted", origin_country: "TR", destination_country: "DE", transport_mode: "road", hs_code: "0805.10", commodity_description: "Oranges, fresh", quantity: 20000, unit_of_measure: "KGM", declared_value_eur: 14000.00, incoterms: "EXW", exporter_name: "Antalya Fresh Ltd", importer_name: "Früchte Import GmbH", customs_office: "Zollamt Kehl" },
      { declaration_type: "transit", status: "under_review", origin_country: "CH", destination_country: "PL", transport_mode: "road", hs_code: "2710.19", commodity_description: "Petroleum oils, not crude", quantity: 50000, unit_of_measure: "LTR", declared_value_eur: 62500.00, incoterms: "CPT", exporter_name: "Swiss Petro AG", importer_name: "Polska Oil Sp.", customs_office: "Zollamt Lörrach" },
      { declaration_type: "export", status: "under_review", origin_country: "DE", destination_country: "IN", transport_mode: "sea", hs_code: "8408.90", commodity_description: "Compression-ignition engines", quantity: 50, unit_of_measure: "PCS", declared_value_eur: 145000.00, incoterms: "CFR", exporter_name: "Maschinenbau GmbH", importer_name: "Bharat Machinery Ltd", customs_office: "Zollamt Hamburg Hafen" },
      { declaration_type: "export", status: "cleared", origin_country: "DE", destination_country: "US", transport_mode: "air", hs_code: "9021.10", commodity_description: "Orthopaedic implants", quantity: 100, unit_of_measure: "PCS", declared_value_eur: 78000.00, incoterms: "DAP", exporter_name: "MedDevice GmbH", importer_name: "MedSupply Inc", customs_office: "Zollamt Frankfurt Flughafen" },
      { declaration_type: "import", status: "cleared", origin_country: "KR", destination_country: "DE", transport_mode: "sea", hs_code: "8542.31", commodity_description: "Electronic integrated circuits, processors", quantity: 10000, unit_of_measure: "PCS", declared_value_eur: 55000.00, incoterms: "CIF", exporter_name: "Samsung Electronics", importer_name: "Chip Import AG", customs_office: "Zollamt Hamburg Hafen" },
      { declaration_type: "export", status: "exception", origin_country: "DE", destination_country: "RU", transport_mode: "road", hs_code: "8542.32", commodity_description: "Dual-use electronic components", quantity: 500, unit_of_measure: "PCS", declared_value_eur: 42000.00, incoterms: "DAP", exporter_name: "Tech Export GmbH", importer_name: "Moskovskiy Tech", customs_office: "Zollamt Frankfurt (Oder)", notes: "Requires export license verification" },
      { declaration_type: "import", status: "exception", origin_country: "BR", destination_country: "DE", transport_mode: "sea", hs_code: "0901.11", commodity_description: "Coffee, not roasted, not decaffeinated", quantity: 5000, unit_of_measure: "KGM", declared_value_eur: 18500.00, incoterms: "CIF", exporter_name: "Fazenda Brasil SA", importer_name: "Kaffee Import GmbH", customs_office: "Zollamt Hamburg Hafen", notes: "Phytosanitary certificate missing" },
    ] as const;

    const customsDeclarationsData = declarationTemplates.map((tmpl) => ({
      org_id: orgId,
      created_by: user.id,
      seed_run_id: runId,
      ...tmpl,
    }));

    const { data: createdCustomsDeclarations } = await supabase
      .from("customs_declarations")
      .insert(customsDeclarationsData)
      .select();

    // Seed 2 documents per declaration (commercial_invoice + packing_list)
    const customsDocumentsData: any[] = [];
    const customsStoragePaths: string[] = [];

    for (const decl of createdCustomsDeclarations || []) {
      for (const docType of ["commercial_invoice", "packing_list"] as const) {
        const pdfContent = generateFakePDFContent();
        const path = `${orgId}/customs/${decl.id}/${crypto.randomUUID()}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(path, pdfContent, { contentType: "application/pdf" });
        if (!uploadErr) {
          customsStoragePaths.push(path);
          customsDocumentsData.push({
            org_id: orgId,
            declaration_id: decl.id,
            document_type: docType,
            filename: `${docType.replace(/_/g, "-")}-${decl.reference_number}.pdf`,
            storage_path: path,
            uploaded_by: user.id,
            seed_run_id: runId,
          });
        }
      }
    }

    const { data: createdCustomsDocuments } = customsDocumentsData.length > 0
      ? await supabase.from("customs_documents").insert(customsDocumentsData).select()
      : { data: [] };

    // Seed 1 exception per declaration with exception status
    const exceptionDeclarations = (createdCustomsDeclarations || []).filter(
      (d: { status: string }) => d.status === "exception"
    );
    const customsExceptionsData = exceptionDeclarations.map((decl: { id: string }, idx: number) => ({
      org_id: orgId,
      declaration_id: decl.id,
      exception_code: idx === 0 ? "EXP-LIC-001" : "PHY-CERT-002",
      description: idx === 0
        ? "Export license required for dual-use goods under EC regulation 2021/821"
        : "Phytosanitary certificate missing — required for plant product imports",
      severity: idx === 0 ? "high" : "medium",
      status: "open",
      seed_run_id: runId,
    }));

    const { data: createdCustomsExceptions } = customsExceptionsData.length > 0
      ? await supabase.from("customs_exceptions").insert(customsExceptionsData).select()
      : { data: [] };

    // ============================================
    // SEED TENDER DESK: 5 companies + 8 tenders + 12 submissions
    // ============================================
    const companiesData = [
      {
        org_id: orgId,
        name: "Müller GmbH",
        legal_form: "GmbH",
        vat_id: "DE123456789",
        tax_number: "123/456/7890",
        street: "Industriestraße 15",
        postcode: "10115",
        city: "Berlin",
        state: "BE",
        country: "DE",
        phone: "+49 30 12345678",
        email: "info@mueller-gmbh.de",
        website: "www.mueller-gmbh.de",
        registration_court: "Amtsgericht Berlin",
        hrb_number: "HRB 123456",
        is_buyer: true,
        is_supplier: true,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        name: "Schmidt & Co. KG",
        legal_form: "KG",
        vat_id: "DE987654321",
        tax_number: "987/654/3210",
        street: "Hafenstraße 42",
        postcode: "20095",
        city: "Hamburg",
        state: "HH",
        country: "DE",
        phone: "+49 40 98765432",
        email: "kontakt@schmidt-kg.de",
        website: "www.schmidt-kg.de",
        registration_court: "Amtsgericht Hamburg",
        hrb_number: "HRA 654321",
        is_buyer: false,
        is_supplier: true,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        name: "Bauer AG",
        legal_form: "AG",
        vat_id: "DE456789123",
        tax_number: "456/789/1234",
        street: "Maximilianstraße 88",
        postcode: "80331",
        city: "München",
        state: "BY",
        country: "DE",
        phone: "+49 89 45678901",
        email: "investor@bauer-ag.de",
        website: "www.bauer-ag.de",
        registration_court: "Amtsgericht München",
        hrb_number: "HRB 789012",
        is_buyer: true,
        is_supplier: false,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        name: "Weber Solutions GmbH",
        legal_form: "GmbH",
        vat_id: "DE789123456",
        tax_number: "789/123/4567",
        street: "Kaiserstraße 25",
        postcode: "60311",
        city: "Frankfurt",
        state: "HE",
        country: "DE",
        phone: "+49 69 78912345",
        email: "info@weber-solutions.de",
        website: "www.weber-solutions.de",
        registration_court: "Amtsgericht Frankfurt",
        hrb_number: "HRB 345678",
        is_buyer: false,
        is_supplier: true,
        seed_run_id: runId,
      },
      {
        org_id: orgId,
        name: "Hoffmann Industries AG",
        legal_form: "AG",
        vat_id: "DE321654987",
        tax_number: "321/654/9876",
        street: "Rheinstraße 100",
        postcode: "40213",
        city: "Düsseldorf",
        state: "NW",
        country: "DE",
        phone: "+49 211 32165498",
        email: "geschaeftsfuehrung@hoffmann-industries.de",
        website: "www.hoffmann-industries.de",
        registration_court: "Amtsgericht Düsseldorf",
        hrb_number: "HRB 567890",
        is_buyer: true,
        is_supplier: false,
        seed_run_id: runId,
      },
    ];

    const { data: createdCompanies } = await supabase.from("companies").insert(companiesData).select();

    // Create tenders (8 tenders with various statuses)
    const tenderStatuses = ["published", "open", "open", "closing_soon", "closed", "closed", "awarded", "cancelled"] as const;
    const tenderTypes = ["open", "open", "restricted", "open", "negotiated", "open", "restricted", "open"] as const;
    const cpvCodes = [
      ["45233141-5"], // Construction work for buildings
      ["30125100-9"], // IT software
      ["33141000-0"], // Medical equipment
      ["45233220-7"], // Road construction
      ["30120000-6"], // Computer equipment
      ["33110000-5"], // Laboratory equipment
      ["45234100-8"], // Building installation work
      ["30192110-4"], // Office software
    ];
    const tenderTitles = [
      "Neubau Verwaltungsgebäude - Bauleistungen",
      "Softwarelizenzierung und Wartung ERP-System",
      "Medizinische Geräte für Klinikum",
      "Straßensanierung Hauptstraße - Abschnitt A",
      "IT-Hardware Beschaffung Workstations",
      "Laborausstattung Forschungszentrum",
      "HVAC-Installation Neubau Produktionshalle",
      "Bürosoftware Suite - Lizenzverlängerung",
    ];
    const estimatedValues = [450000, 85000, 125000, 280000, 45000, 95000, 175000, 25000];

    const tendersData = (createdCompanies || []).filter(c => c.is_buyer).flatMap((buyer, buyerIdx) => {
      const buyerTenders = [];
      for (let i = 0; i < (buyerIdx === 0 ? 3 : 2); i++) {
        const idx = buyerIdx * 2 + i;
        if (idx >= 8) break;
        const daysOffset = idx * 5;
        buyerTenders.push({
          org_id: orgId,
          buyer_company_id: buyer.id,
          tender_id: `TD-2024-${String(1000 + idx).padStart(4, "0")}`,
          title: tenderTitles[idx],
          description: `Ausschreibung für ${tenderTitles[idx].toLowerCase()}. Alle Details in den Anlagen.`,
          cpv_codes: cpvCodes[idx],
          tender_type: tenderTypes[idx],
          estimated_value: estimatedValues[idx],
          currency: "EUR",
          publish_date: new Date(Date.now() - (20 + daysOffset) * 86400000).toISOString().split("T")[0],
          deadline_date: new Date(Date.now() + (30 - daysOffset) * 86400000).toISOString().split("T")[0],
          award_date: tenderStatuses[idx] === "awarded" ? new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0] : null,
          status: tenderStatuses[idx],
          contact_name: `Herr ${["Müller", "Schmidt", "Bauer", "Weber", "Hoffmann"][idx % 5]}`,
          contact_email: `ausschreibung${idx + 1}@${buyer.name.toLowerCase().replace(/[^a-z]/g, "")}.de`,
          contact_phone: buyer.phone,
          document_count: 3,
          seed_run_id: runId,
        });
      }
      return buyerTenders;
    });

    const { data: createdTenders } = await supabase.from("tenders").insert(tendersData).select();

    // Create submissions (12 submissions)
    const submissionStatuses = ["draft", "submitted", "submitted", "under_review", "under_review", "accepted", "accepted", "rejected", "rejected", "draft", "submitted", "under_review"] as const;
    const supplierCompanies = (createdCompanies || []).filter(c => c.is_supplier);
    
    const submissionsData: any[] = [];
    let submissionIdx = 0;
    
    for (const tender of (createdTenders || []).filter(t => t.status !== "cancelled" && t.status !== "published")) {
      for (let i = 0; i < (tender.status === "awarded" ? 3 : 2); i++) {
        if (submissionIdx >= 12) break;
        const supplier = supplierCompanies[submissionIdx % supplierCompanies.length];
        const bidAmount = tender.estimated_value * (0.85 + Math.random() * 0.25); // 85-110% of estimated value
        
        submissionsData.push({
          org_id: orgId,
          tender_id: tender.id,
          supplier_company_id: supplier.id,
          submission_reference: submissionStatuses[submissionIdx] !== "draft" ? `BID-2024-${String(1000 + submissionIdx).padStart(4, "0")}` : null,
          bid_amount: Math.round(bidAmount * 100) / 100,
          currency: "EUR",
          status: submissionStatuses[submissionIdx],
          technical_proposal: `Technisches Konzept für ${tender.title}. Umfassende Lösung mit garantierter Qualität.`,
          financial_proposal: `Finanzierungsvorschlag: ${Math.round(bidAmount * 100) / 100} EUR inkl. aller Nebenkosten.`,
          submitted_at: submissionStatuses[submissionIdx] !== "draft" ? new Date(Date.now() - (submissionIdx + 1) * 2 * 86400000).toISOString() : null,
          seed_run_id: runId,
        });
        submissionIdx++;
      }
    }

    const { data: createdSubmissions } = await supabase.from("tender_submissions").insert(submissionsData).select();

    // ============================================
    // SEED TAX & DISCLOSURE: 6 filings + 4 disclosures
    // ============================================
    const taxFilingTypes = ["USt-Voranmeldung", "USt-Erklärung", "Gewerbesteuer", "Körperschaftsteuer", "USt-Voranmeldung", "Gewerbesteuer"] as const;
    const filingStatuses = ["draft", "submitted", "accepted", "rejected", "correction_needed", "submitted"] as const;
    const filingPeriods = ["03/2024", "2023-Q4", "2023", "2023", "02/2024", "2023"];
    const revenues = [125000, 450000, 890000, 1200000, 98000, 750000];
    const vatAmounts = [23750, 85500, null, null, 18620, null];
    const taxPayables = [null, null, 45000, 85000, null, 38000];

    const taxFilingsData = (createdCompanies || []).slice(0, 3).flatMap((company, idx) => {
      const filings = [];
      for (let i = 0; i < 2; i++) {
        const filingIdx = idx * 2 + i;
        if (filingIdx >= 6) break;
        filings.push({
          org_id: orgId,
          company_id: company.id,
          filing_reference: `${taxFilingTypes[filingIdx].split("-")[0] || taxFilingTypes[filingIdx].substring(0, 3)}-2024-${String(100 + filingIdx).padStart(3, "0")}`,
          filing_type: taxFilingTypes[filingIdx],
          filing_period: filingPeriods[filingIdx],
          period_start: filingPeriods[filingIdx].includes("/") 
            ? `2024-${filingPeriods[filingIdx].split("/")[0]}-01`
            : `${filingPeriods[filingIdx].split("-")[0]}-01-01`,
          period_end: filingPeriods[filingIdx].includes("/")
            ? `2024-${filingPeriods[filingIdx].split("/")[0]}-31`
            : `${filingPeriods[filingIdx].split("-")[0]}-12-31`,
          revenue: revenues[filingIdx],
          vat_amount: vatAmounts[filingIdx],
          tax_payable: taxPayables[filingIdx],
          status: filingStatuses[filingIdx],
          elster_tax_number: company.tax_number,
          certificate_id: filingStatuses[filingIdx] !== "draft" ? `CERT-${company.vat_id}-2024` : null,
          submitted_at: filingStatuses[filingIdx] !== "draft" ? new Date(Date.now() - (filingIdx + 1) * 5 * 86400000).toISOString() : null,
          due_date: new Date(Date.now() + (30 + filingIdx * 10) * 86400000).toISOString().split("T")[0],
          seed_run_id: runId,
        });
      }
      return filings;
    });

    const { data: createdTaxFilings } = await supabase.from("tax_filings").insert(taxFilingsData).select();

    // Create disclosures (4 disclosures)
    const disclosureTypes = ["annual_financial_statements", "change_notification", "annual_financial_statements", "change_notification"] as const;
    const disclosureStatuses = ["published", "submitted", "draft", "rejected"] as const;
    const disclosureTitles = [
      "Jahresabschluss 2023 Müller GmbH",
      "Änderung Geschäftsführung Bauer AG",
      "Jahresabschluss 2023 Weber Solutions GmbH",
      "Nachtrag zur Satzung Hoffmann Industries",
    ];

    const disclosuresData = (createdCompanies || []).slice(0, 4).map((company, idx) => ({
      org_id: orgId,
      company_id: company.id,
      disclosure_reference: `${disclosureTypes[idx] === "annual_financial_statements" ? "HB" : "ÄM"}-2024-${String(100 + idx).padStart(3, "0")}`,
      disclosure_type: disclosureTypes[idx],
      title: disclosureTitles[idx],
      description: `Offenlegung gemäß HGB für ${company.name}. ${disclosureTypes[idx] === "annual_financial_statements" ? "Jahresabschluss mit Lagebericht." : "Wesentliche Änderung der Unternehmensstruktur."}`,
      status: disclosureStatuses[idx],
      publication_date: disclosureStatuses[idx] === "published" ? new Date(Date.now() - idx * 15 * 86400000).toISOString().split("T")[0] : null,
      bundesanzeiger_id: disclosureStatuses[idx] === "published" ? `BAnz${new Date().getFullYear()}${String(10000 + idx).padStart(5, "0")}` : null,
      document_count: 2,
      seed_run_id: runId,
    }));

    const { data: createdDisclosures } = await supabase.from("disclosures").insert(disclosuresData).select();

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
        companies_created: createdCompanies?.length || 0,
        tenders_created: createdTenders?.length || 0,
        submissions_created: createdSubmissions?.length || 0,
        tax_filings_created: createdTaxFilings?.length || 0,
        disclosures_created: createdDisclosures?.length || 0,
        reconciliation_matches_created: createdReconciliationMatches?.length || 0,
        customs_declarations_created: createdCustomsDeclarations?.length || 0,
        customs_documents_created: createdCustomsDocuments?.length || 0,
        customs_exceptions_created: createdCustomsExceptions?.length || 0,
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
          (createdHrSubmissions?.length || 0) +
          (createdCompanies?.length || 0) +
          (createdTenders?.length || 0) +
          (createdSubmissions?.length || 0) +
          (createdTaxFilings?.length || 0) +
          (createdDisclosures?.length || 0) +
          (createdReconciliationMatches?.length || 0) +
          (createdCustomsDeclarations?.length || 0) +
          (createdCustomsDocuments?.length || 0) +
          (createdCustomsExceptions?.length || 0),
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
      companiesCreated: createdCompanies?.length || 0,
      tendersCreated: createdTenders?.length || 0,
      submissionsCreated: createdSubmissions?.length || 0,
      taxFilingsCreated: createdTaxFilings?.length || 0,
      disclosuresCreated: createdDisclosures?.length || 0,
      reconciliationMatchesCreated: createdReconciliationMatches?.length || 0,
      customsDeclarationsCreated: createdCustomsDeclarations?.length || 0,
      customsDocumentsCreated: createdCustomsDocuments?.length || 0,
      customsExceptionsCreated: createdCustomsExceptions?.length || 0,
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
  // Portal module tables - Tender Desk (delete children first)
  await supabase.from("tender_documents").delete().eq("seed_run_id", runId);
  await supabase.from("tender_submissions").delete().eq("seed_run_id", runId);
  await supabase.from("tenders").delete().eq("seed_run_id", runId);
  // Portal module tables - Tax & Disclosure (delete children first)
  await supabase.from("tax_filing_documents").delete().eq("seed_run_id", runId);
  await supabase.from("tax_filings").delete().eq("seed_run_id", runId);
  await supabase.from("disclosure_documents").delete().eq("seed_run_id", runId);
  await supabase.from("disclosures").delete().eq("seed_run_id", runId);
  // Companies (shared across Tender and Tax modules)
  await supabase.from("companies").delete().eq("seed_run_id", runId);
  // Portal module tables - HR
  await supabase.from("hr_submissions").delete().eq("seed_run_id", runId);
  await supabase.from("employees").delete().eq("seed_run_id", runId);
  // Portal module tables - Marketplace
  await supabase.from("marketplace_reports").delete().eq("seed_run_id", runId);
  await supabase.from("marketplace_orders").delete().eq("seed_run_id", runId);
  await supabase.from("marketplace_listings").delete().eq("seed_run_id", runId);
  // Portal module tables - Reconciliation
  await supabase.from("reconciliation_matches").delete().eq("seed_run_id", runId);
  // Portal module tables - Customs (storage cleanup + FK order)
  const { data: custDocs } = await supabase
    .from("customs_documents")
    .select("storage_path")
    .eq("seed_run_id", runId);
  if (custDocs && custDocs.length > 0) {
    await supabase.storage.from("documents").remove(custDocs.map((d: { storage_path: string }) => d.storage_path));
  }
  await supabase.from("customs_exceptions").delete().eq("seed_run_id", runId);
  await supabase.from("customs_documents").delete().eq("seed_run_id", runId);
  await supabase.from("customs_declarations").delete().eq("seed_run_id", runId);
  // Portal module tables - Logistics
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
