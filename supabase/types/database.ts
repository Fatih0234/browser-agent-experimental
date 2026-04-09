export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          org_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_user_id: string | null
          case_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          org_id: string
          priority: string
          seed_run_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          case_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          org_id: string
          priority?: string
          seed_run_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          case_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          org_id?: string
          priority?: string
          seed_run_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string
          country: string
          created_at: string
          email: string | null
          hrb_number: string | null
          id: string
          is_buyer: boolean
          is_supplier: boolean
          legal_form: string
          name: string
          org_id: string
          phone: string | null
          postcode: string
          registration_court: string | null
          seed_run_id: string | null
          state: string
          street: string
          tax_number: string | null
          updated_at: string
          vat_id: string | null
          website: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          email?: string | null
          hrb_number?: string | null
          id?: string
          is_buyer?: boolean
          is_supplier?: boolean
          legal_form: string
          name: string
          org_id: string
          phone?: string | null
          postcode: string
          registration_court?: string | null
          seed_run_id?: string | null
          state: string
          street: string
          tax_number?: string | null
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          email?: string | null
          hrb_number?: string | null
          id?: string
          is_buyer?: boolean
          is_supplier?: boolean
          legal_form?: string
          name?: string
          org_id?: string
          phone?: string | null
          postcode?: string
          registration_court?: string | null
          seed_run_id?: string | null
          state?: string
          street?: string
          tax_number?: string | null
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosure_documents: {
        Row: {
          created_at: string
          description: string | null
          disclosure_id: string
          document_type: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          org_id: string
          seed_run_id: string | null
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          disclosure_id: string
          document_type: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          org_id: string
          seed_run_id?: string | null
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          disclosure_id?: string
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          org_id?: string
          seed_run_id?: string | null
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_documents_disclosure_id_fkey"
            columns: ["disclosure_id"]
            isOneToOne: false
            referencedRelation: "disclosures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_documents_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosures: {
        Row: {
          bundesanzeiger_id: string | null
          company_id: string
          created_at: string
          description: string | null
          disclosure_reference: string
          disclosure_type: string
          document_count: number
          id: string
          org_id: string
          publication_date: string | null
          seed_run_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bundesanzeiger_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          disclosure_reference: string
          disclosure_type: string
          document_count?: number
          id?: string
          org_id: string
          publication_date?: string | null
          seed_run_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bundesanzeiger_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          disclosure_reference?: string
          disclosure_type?: string
          document_count?: number
          id?: string
          org_id?: string
          publication_date?: string | null
          seed_run_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosures_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosures_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          created_by: string
          document_id: string
          file_size: number
          id: string
          seed_run_id: string | null
          storage_path: string
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          document_id: string
          file_size: number
          id?: string
          seed_run_id?: string | null
          storage_path: string
          updated_at?: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          document_id?: string
          file_size?: number
          id?: string
          seed_run_id?: string | null
          storage_path?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          latest_version_id: string | null
          mime_type: string
          name: string
          org_id: string
          seed_run_id: string | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          latest_version_id?: string | null
          mime_type: string
          name: string
          org_id: string
          seed_run_id?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          latest_version_id?: string | null
          mime_type?: string
          name?: string
          org_id?: string
          seed_run_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_latest_version"
            columns: ["latest_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          employee_number: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          org_id: string
          position: string
          seed_run_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          employee_number: string
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          org_id: string
          position: string
          seed_run_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          employee_number?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          org_id?: string
          position?: string
          seed_run_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_submissions: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          id: string
          metadata: Json
          notes: string | null
          org_id: string
          reference_number: string | null
          seed_run_id: string | null
          status: string
          submission_type: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          employee_id: string
          id?: string
          metadata?: Json
          notes?: string | null
          org_id: string
          reference_number?: string | null
          seed_run_id?: string | null
          status?: string
          submission_type: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
          metadata?: Json
          notes?: string | null
          org_id?: string
          reference_number?: string | null
          seed_run_id?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_submissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          created_at: string
          external_id: string
          id: string
          marketplace: string
          org_id: string
          price: number
          seed_run_id: string | null
          status: string
          stock_qty: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          marketplace: string
          org_id: string
          price: number
          seed_run_id?: string | null
          status?: string
          stock_qty?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          marketplace?: string
          org_id?: string
          price?: number
          seed_run_id?: string | null
          status?: string
          stock_qty?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          created_at: string
          currency: string
          customer_name: string
          id: string
          listing_id: string | null
          marketplace: string
          order_number: string
          ordered_at: string
          org_id: string
          quantity: number
          seed_run_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_name: string
          id?: string
          listing_id?: string | null
          marketplace: string
          order_number: string
          ordered_at?: string
          org_id: string
          quantity?: number
          seed_run_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_name?: string
          id?: string
          listing_id?: string | null
          marketplace?: string
          order_number?: string
          ordered_at?: string
          org_id?: string
          quantity?: number
          seed_run_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reports: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          marketplace: string
          org_id: string
          period_end: string
          period_start: string
          report_type: string
          seed_run_id: string | null
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          marketplace: string
          org_id: string
          period_end: string
          period_start: string
          report_type: string
          seed_run_id?: string | null
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          marketplace?: string
          org_id?: string
          period_end?: string
          period_start?: string
          report_type?: string
          seed_run_id?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          message: string
          org_id: string | null
          read: boolean
          seed_run_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          message: string
          org_id?: string | null
          read?: boolean
          seed_run_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          message?: string
          org_id?: string | null
          read?: boolean
          seed_run_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenario_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_count: number
          id: string
          org_id: string
          run_by: string
          status: string
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_count?: number
          id?: string
          org_id: string
          run_by: string
          status?: string
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_count?: number
          id?: string
          org_id?: string
          run_by?: string
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "scenario_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_templates: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipment_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_number: string
          issued_date: string
          org_id: string
          seed_run_id: string | null
          shipment_id: string
          storage_path: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          issued_date: string
          org_id: string
          seed_run_id?: string | null
          shipment_id: string
          storage_path?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          issued_date?: string
          org_id?: string
          seed_run_id?: string | null
          shipment_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          carrier: string
          created_at: string
          created_by: string
          destination: Json
          estimated_delivery: string | null
          id: string
          notes: string | null
          org_id: string
          origin: Json
          pickup_date: string | null
          seed_run_id: string | null
          service_type: string
          status: string
          tracking_number: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          actual_delivery?: string | null
          carrier: string
          created_at?: string
          created_by: string
          destination?: Json
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          org_id: string
          origin?: Json
          pickup_date?: string | null
          seed_run_id?: string | null
          service_type?: string
          status?: string
          tracking_number: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          actual_delivery?: string | null
          carrier?: string
          created_at?: string
          created_by?: string
          destination?: Json
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          origin?: Json
          pickup_date?: string | null
          seed_run_id?: string | null
          service_type?: string
          status?: string
          tracking_number?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filing_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          org_id: string
          seed_run_id: string | null
          storage_path: string | null
          tax_filing_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          org_id: string
          seed_run_id?: string | null
          storage_path?: string | null
          tax_filing_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          org_id?: string
          seed_run_id?: string | null
          storage_path?: string | null
          tax_filing_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_filing_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filing_documents_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filing_documents_tax_filing_id_fkey"
            columns: ["tax_filing_id"]
            isOneToOne: false
            referencedRelation: "tax_filings"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          certificate_id: string | null
          company_id: string
          created_at: string
          due_date: string
          elster_tax_number: string | null
          filing_period: string
          filing_reference: string
          filing_type: string
          id: string
          org_id: string
          period_end: string
          period_start: string
          revenue: number | null
          seed_run_id: string | null
          status: string
          submitted_at: string | null
          tax_payable: number | null
          updated_at: string
          vat_amount: number | null
        }
        Insert: {
          certificate_id?: string | null
          company_id: string
          created_at?: string
          due_date: string
          elster_tax_number?: string | null
          filing_period: string
          filing_reference: string
          filing_type: string
          id?: string
          org_id: string
          period_end: string
          period_start: string
          revenue?: number | null
          seed_run_id?: string | null
          status?: string
          submitted_at?: string | null
          tax_payable?: number | null
          updated_at?: string
          vat_amount?: number | null
        }
        Update: {
          certificate_id?: string | null
          company_id?: string
          created_at?: string
          due_date?: string
          elster_tax_number?: string | null
          filing_period?: string
          filing_reference?: string
          filing_type?: string
          id?: string
          org_id?: string
          period_end?: string
          period_start?: string
          revenue?: number | null
          seed_run_id?: string | null
          status?: string
          submitted_at?: string | null
          tax_payable?: number | null
          updated_at?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filings_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          org_id: string
          seed_run_id: string | null
          storage_path: string | null
          tender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          org_id: string
          seed_run_id?: string | null
          storage_path?: string | null
          tender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          org_id?: string
          seed_run_id?: string | null
          storage_path?: string | null
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_submissions: {
        Row: {
          bid_amount: number | null
          created_at: string
          currency: string
          financial_proposal: string | null
          id: string
          org_id: string
          seed_run_id: string | null
          status: string
          submission_reference: string | null
          submitted_at: string | null
          supplier_company_id: string | null
          technical_proposal: string | null
          tender_id: string
          updated_at: string
        }
        Insert: {
          bid_amount?: number | null
          created_at?: string
          currency?: string
          financial_proposal?: string | null
          id?: string
          org_id: string
          seed_run_id?: string | null
          status?: string
          submission_reference?: string | null
          submitted_at?: string | null
          supplier_company_id?: string | null
          technical_proposal?: string | null
          tender_id: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number | null
          created_at?: string
          currency?: string
          financial_proposal?: string | null
          id?: string
          org_id?: string
          seed_run_id?: string | null
          status?: string
          submission_reference?: string | null
          submitted_at?: string | null
          supplier_company_id?: string | null
          technical_proposal?: string | null
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_submissions_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_submissions_supplier_company_id_fkey"
            columns: ["supplier_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_submissions_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          award_date: string | null
          buyer_company_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cpv_codes: string[] | null
          created_at: string
          currency: string
          deadline_date: string
          description: string | null
          document_count: number
          estimated_value: number | null
          id: string
          org_id: string
          publish_date: string
          seed_run_id: string | null
          status: string
          tender_id: string
          tender_type: string
          title: string
          updated_at: string
        }
        Insert: {
          award_date?: string | null
          buyer_company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cpv_codes?: string[] | null
          created_at?: string
          currency?: string
          deadline_date: string
          description?: string | null
          document_count?: number
          estimated_value?: number | null
          id?: string
          org_id: string
          publish_date: string
          seed_run_id?: string | null
          status?: string
          tender_id: string
          tender_type: string
          title: string
          updated_at?: string
        }
        Update: {
          award_date?: string | null
          buyer_company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cpv_codes?: string[] | null
          created_at?: string
          currency?: string
          deadline_date?: string
          description?: string | null
          document_count?: number
          estimated_value?: number | null
          id?: string
          org_id?: string
          publish_date?: string
          seed_run_id?: string | null
          status?: string
          tender_id?: string
          tender_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_buyer_company_id_fkey"
            columns: ["buyer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_seed_run_id_fkey"
            columns: ["seed_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
