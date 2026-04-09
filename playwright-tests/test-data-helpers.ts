/**
 * Portal-Gym Playwright Test Utilities
 * 
 * Provides fixtures and helpers for using generated test data in Playwright tests.
 * 
 * Usage:
 *   import { testData } from '../test-data/playwright/test-data-helpers';
 *   
 *   test('tender submission', async ({ page }) => {
 *     const company = testData.getRandomCompany();
 *     await page.fill('[name="company_name"]', company.name);
 *     await page.fill('[name="vat_id"]', company.vat_id);
 *   });
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load fixtures
const fixturesDir = path.join(__dirname, '..', 'test-data', 'fixtures');

function loadFixture<T>(filename: string): T[] {
  const filepath = path.join(fixturesDir, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`Fixture not found: ${filepath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

// Entity types matching the generated fixtures
export interface Company {
  id: string;
  org_id: string;
  name: string;
  legal_form: string;
  vat_id: string | null;
  tax_number: string | null;
  street: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  registration_court: string | null;
  hrb_number: string | null;
  is_buyer: boolean;
  is_supplier: boolean;
}

export interface Tender {
  id: string;
  org_id: string;
  buyer_company_id: string | null;
  tender_id: string;
  title: string;
  description: string | null;
  cpv_codes: string[] | null;
  tender_type: string;
  estimated_value: number | null;
  currency: string;
  publish_date: string;
  deadline_date: string;
  award_date: string | null;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  document_count: number;
}

export interface TenderSubmission {
  id: string;
  org_id: string;
  tender_id: string;
  supplier_company_id: string | null;
  submission_reference: string | null;
  bid_amount: number | null;
  currency: string;
  status: string;
  technical_proposal: string | null;
  financial_proposal: string | null;
  submitted_at: string | null;
}

export interface TaxFiling {
  id: string;
  org_id: string;
  company_id: string;
  filing_reference: string;
  filing_type: string;
  filing_period: string;
  period_start: string;
  period_end: string;
  revenue: number | null;
  vat_amount: number | null;
  tax_payable: number | null;
  status: string;
  elster_tax_number: string | null;
  certificate_id: string | null;
  submitted_at: string | null;
  due_date: string;
}

export interface Disclosure {
  id: string;
  org_id: string;
  company_id: string;
  disclosure_reference: string;
  disclosure_type: string;
  title: string;
  description: string | null;
  status: string;
  publication_date: string | null;
  bundesanzeiger_id: string | null;
  document_count: number;
}

export interface Shipment {
  id: string;
  org_id: string;
  tracking_number: string;
  carrier: string;
  status: string;
  origin: {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  destination: {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  weight_kg: number | null;
  service_type: string;
  pickup_date: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string | null;
}

export interface Employee {
  id: string;
  org_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  hire_date: string;
  status: string;
}

export interface HRSubmission {
  id: string;
  org_id: string;
  employee_id: string;
  submission_type: string;
  status: string;
  reference_number: string | null;
  submitted_at: string | null;
  metadata: Record<string, any>;
  notes: string | null;
}

// Test data manager
class TestDataManager {
  private companies: Company[] = [];
  private tenders: Tender[] = [];
  private tenderSubmissions: TenderSubmission[] = [];
  private taxFilings: TaxFiling[] = [];
  private disclosures: Disclosure[] = [];
  private shipments: Shipment[] = [];
  private employees: Employee[] = [];
  private hrSubmissions: HRSubmission[] = [];

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.companies = loadFixture<Company>('companies.json');
    this.tenders = loadFixture<Tender>('tenders.json');
    this.tenderSubmissions = loadFixture<TenderSubmission>('tender_submissions.json');
    this.taxFilings = loadFixture<TaxFiling>('tax_filings.json');
    this.disclosures = loadFixture<Disclosure>('disclosures.json');
    this.shipments = loadFixture<Shipment>('shipments.json');
    this.employees = loadFixture<Employee>('employees.json');
    this.hrSubmissions = loadFixture<HRSubmission>('hr_submissions.json');
  }

  // Random selection helpers
  private getRandom<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomMultiple<T>(array: T[], count: number): T[] {
    if (array.length === 0) return [];
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  // Company helpers
  getRandomCompany(): Company | null {
    return this.getRandom(this.companies);
  }

  getRandomBuyer(): Company | null {
    const buyers = this.companies.filter(c => c.is_buyer);
    return this.getRandom(buyers);
  }

  getRandomSupplier(): Company | null {
    const suppliers = this.companies.filter(c => c.is_supplier);
    return this.getRandom(suppliers);
  }

  getCompanies(count: number = 5): Company[] {
    return this.getRandomMultiple(this.companies, count);
  }

  getCompanyById(id: string): Company | undefined {
    return this.companies.find(c => c.id === id);
  }

  // Tender helpers
  getRandomTender(): Tender | null {
    return this.getRandom(this.tenders);
  }

  getTendersByStatus(status: string): Tender[] {
    return this.tenders.filter(t => t.status === status);
  }

  getTendersByBuyer(buyerId: string): Tender[] {
    return this.tenders.filter(t => t.buyer_company_id === buyerId);
  }

  getOpenTenders(): Tender[] {
    return this.tenders.filter(t => ['published', 'open', 'closing_soon'].includes(t.status));
  }

  // Tender submission helpers
  getSubmissionsForTender(tenderId: string): TenderSubmission[] {
    return this.tenderSubmissions.filter(s => s.tender_id === tenderId);
  }

  getRandomSubmission(): TenderSubmission | null {
    return this.getRandom(this.tenderSubmissions);
  }

  // Tax filing helpers
  getRandomTaxFiling(): TaxFiling | null {
    return this.getRandom(this.taxFilings);
  }

  getTaxFilingsByCompany(companyId: string): TaxFiling[] {
    return this.taxFilings.filter(t => t.company_id === companyId);
  }

  getTaxFilingsByStatus(status: string): TaxFiling[] {
    return this.taxFilings.filter(t => t.status === status);
  }

  // Disclosure helpers
  getRandomDisclosure(): Disclosure | null {
    return this.getRandom(this.disclosures);
  }

  getDisclosuresByCompany(companyId: string): Disclosure[] {
    return this.disclosures.filter(d => d.company_id === companyId);
  }

  // Shipment helpers
  getRandomShipment(): Shipment | null {
    return this.getRandom(this.shipments);
  }

  getShipmentsByStatus(status: string): Shipment[] {
    return this.shipments.filter(s => s.status === status);
  }

  getShipmentsByCarrier(carrier: string): Shipment[] {
    return this.shipments.filter(s => s.carrier === carrier);
  }

  // Employee helpers
  getRandomEmployee(): Employee | null {
    return this.getRandom(this.employees);
  }

  getEmployeesByDepartment(department: string): Employee[] {
    return this.employees.filter(e => e.department === department);
  }

  getActiveEmployees(): Employee[] {
    return this.employees.filter(e => e.status === 'active');
  }

  // HR submission helpers
  getSubmissionsForEmployee(employeeId: string): HRSubmission[] {
    return this.hrSubmissions.filter(s => s.employee_id === employeeId);
  }

  getSubmissionsByType(type: string): HRSubmission[] {
    return this.hrSubmissions.filter(s => s.submission_type === type);
  }

  // Statistics
  getStats(): Record<string, number> {
    return {
      companies: this.companies.length,
      buyers: this.companies.filter(c => c.is_buyer).length,
      suppliers: this.companies.filter(c => c.is_supplier).length,
      tenders: this.tenders.length,
      tenderSubmissions: this.tenderSubmissions.length,
      taxFilings: this.taxFilings.length,
      disclosures: this.disclosures.length,
      shipments: this.shipments.length,
      employees: this.employees.length,
      hrSubmissions: this.hrSubmissions.length,
    };
  }
}

// Form filling helpers
class FormHelpers {
  constructor(private page: Page) {}

  async fillCompanyFields(company: Company, prefix: string = ''): Promise<void> {
    const p = prefix ? `${prefix}_` : '';
    
    if (company.name) await this.page.fill(`[name="${p}company_name"]`, company.name);
    if (company.legal_form) await this.page.fill(`[name="${p}legal_form"]`, company.legal_form);
    if (company.vat_id) await this.page.fill(`[name="${p}vat_id"]`, company.vat_id);
    if (company.tax_number) await this.page.fill(`[name="${p}tax_number"]`, company.tax_number);
    if (company.street) await this.page.fill(`[name="${p}street"]`, company.street);
    if (company.postcode) await this.page.fill(`[name="${p}postcode"]`, company.postcode);
    if (company.city) await this.page.fill(`[name="${p}city"]`, company.city);
    if (company.state) await this.page.fill(`[name="${p}state"]`, company.state);
    if (company.phone) await this.page.fill(`[name="${p}phone"]`, company.phone);
    if (company.email) await this.page.fill(`[name="${p}email"]`, company.email);
    if (company.website) await this.page.fill(`[name="${p}website"]`, company.website);
  }

  async fillTenderFields(tender: Tender): Promise<void> {
    if (tender.title) await this.page.fill('[name="title"]', tender.title);
    if (tender.description) await this.page.fill('[name="description"]', tender.description);
    if (tender.estimated_value) await this.page.fill('[name="estimated_value"]', tender.estimated_value.toString());
    if (tender.contact_name) await this.page.fill('[name="contact_name"]', tender.contact_name);
    if (tender.contact_email) await this.page.fill('[name="contact_email"]', tender.contact_email);
    if (tender.contact_phone) await this.page.fill('[name="contact_phone"]', tender.contact_phone);
  }

  async fillEmployeeFields(employee: Employee): Promise<void> {
    if (employee.first_name) await this.page.fill('[name="first_name"]', employee.first_name);
    if (employee.last_name) await this.page.fill('[name="last_name"]', employee.last_name);
    if (employee.position) await this.page.fill('[name="position"]', employee.position);
    if (employee.department) await this.page.fill('[name="department"]', employee.department);
    if (employee.employee_number) await this.page.fill('[name="employee_number"]', employee.employee_number);
  }

  async fillShipmentFields(shipment: Shipment): Promise<void> {
    if (shipment.tracking_number) await this.page.fill('[name="tracking_number"]', shipment.tracking_number);
    if (shipment.weight_kg) await this.page.fill('[name="weight_kg"]', shipment.weight_kg.toString());
    if (shipment.notes) await this.page.fill('[name="notes"]', shipment.notes);
    
    // Origin address
    if (shipment.origin?.name) await this.page.fill('[name="origin_name"]', shipment.origin.name);
    if (shipment.origin?.street) await this.page.fill('[name="origin_street"]', shipment.origin.street);
    if (shipment.origin?.city) await this.page.fill('[name="origin_city"]', shipment.origin.city);
    if (shipment.origin?.zip) await this.page.fill('[name="origin_zip"]', shipment.origin.zip);
    
    // Destination address
    if (shipment.destination?.name) await this.page.fill('[name="destination_name"]', shipment.destination.name);
    if (shipment.destination?.street) await this.page.fill('[name="destination_street"]', shipment.destination.street);
    if (shipment.destination?.city) await this.page.fill('[name="destination_city"]', shipment.destination.city);
    if (shipment.destination?.zip) await this.page.fill('[name="destination_zip"]', shipment.destination.zip);
  }
}

// Export singleton instance
export const testData = new TestDataManager();

// Export for direct use
export { TestDataManager, FormHelpers };
