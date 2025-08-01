export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounting_rule_lines: {
        Row: {
          amount_source: string
          credit_account_code: string | null
          debit_account_code: string | null
          enable_subledger: boolean
          id: string
          line_number: number
          rule_id: string
        }
        Insert: {
          amount_source: string
          credit_account_code?: string | null
          debit_account_code?: string | null
          enable_subledger?: boolean
          id?: string
          line_number: number
          rule_id: string
        }
        Update: {
          amount_source?: string
          credit_account_code?: string | null
          debit_account_code?: string | null
          enable_subledger?: boolean
          id?: string
          line_number?: number
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_rule_lines_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "accounting_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_rules: {
        Row: {
          created_by: string
          created_on: string
          destination_division_id: string | null
          division_id: string | null
          id: string
          organization_id: string
          rule_name: string
          status: string
          transaction_category: string
          transaction_reference: string
          transaction_type: string | null
          triggering_action: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          destination_division_id?: string | null
          division_id?: string | null
          id?: string
          organization_id: string
          rule_name: string
          status?: string
          transaction_category: string
          transaction_reference: string
          transaction_type?: string | null
          triggering_action: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          destination_division_id?: string | null
          division_id?: string | null
          id?: string
          organization_id?: string
          rule_name?: string
          status?: string
          transaction_category?: string
          transaction_reference?: string
          transaction_type?: string | null
          triggering_action?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_rules_destination_division_id_fkey"
            columns: ["destination_division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_rules_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_by: string
          created_on: string
          id: string
          organization_id: string
          status: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_by: string
          created_on?: string
          id?: string
          organization_id: string
          status?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          created_by?: string
          created_on?: string
          id?: string
          organization_id?: string
          status?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      division_contacts: {
        Row: {
          address1: string | null
          address2: string | null
          city: string | null
          contact_type: string
          country: string | null
          created_on: string
          division_id: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          phone_number: string | null
          postal_code: string | null
          state: string | null
          state_code: number | null
          updated_on: string | null
          website: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          contact_type: string
          country?: string | null
          created_on?: string
          division_id: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          phone_number?: string | null
          postal_code?: string | null
          state?: string | null
          state_code?: number | null
          updated_on?: string | null
          website?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          contact_type?: string
          country?: string | null
          created_on?: string
          division_id?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          phone_number?: string | null
          postal_code?: string | null
          state?: string | null
          state_code?: number | null
          updated_on?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "division_contacts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_contacts_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "india_state_code"
            referencedColumns: ["state_code"]
          },
        ]
      }
      division_references: {
        Row: {
          created_on: string
          division_id: string
          id: string
          reference_type: string
          reference_value: string
          updated_on: string | null
        }
        Insert: {
          created_on?: string
          division_id: string
          id?: string
          reference_type: string
          reference_value: string
          updated_on?: string | null
        }
        Update: {
          created_on?: string
          division_id?: string
          id?: string
          reference_type?: string
          reference_value?: string
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "division_references_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          code: string
          created_by: string | null
          created_on: string
          id: string
          name: string
          organization_id: string
          status: string
          type: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          code: string
          created_by?: string | null
          created_on?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          type: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          code?: string
          created_by?: string | null
          created_on?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          type?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "divisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger: {
        Row: {
          amount: number
          bill_to_address1: string | null
          bill_to_address2: string | null
          bill_to_city: string | null
          bill_to_country: string | null
          bill_to_email: string | null
          bill_to_name: string | null
          bill_to_orgid: string
          bill_to_phone: string | null
          bill_to_postal_code: string | null
          bill_to_state: string | null
          created_by: string | null
          created_on: string
          id: string
          notes: string | null
          payment_method: string | null
          reference_number: string
          remit_to_address1: string | null
          remit_to_address2: string | null
          remit_to_city: string | null
          remit_to_country: string | null
          remit_to_email: string | null
          remit_to_name: string | null
          remit_to_orgid: string
          remit_to_phone: string | null
          remit_to_postal_code: string | null
          remit_to_state: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["gl_transaction_type"]
        }
        Insert: {
          amount: number
          bill_to_address1?: string | null
          bill_to_address2?: string | null
          bill_to_city?: string | null
          bill_to_country?: string | null
          bill_to_email?: string | null
          bill_to_name?: string | null
          bill_to_orgid: string
          bill_to_phone?: string | null
          bill_to_postal_code?: string | null
          bill_to_state?: string | null
          created_by?: string | null
          created_on?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number: string
          remit_to_address1?: string | null
          remit_to_address2?: string | null
          remit_to_city?: string | null
          remit_to_country?: string | null
          remit_to_email?: string | null
          remit_to_name?: string | null
          remit_to_orgid: string
          remit_to_phone?: string | null
          remit_to_postal_code?: string | null
          remit_to_state?: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["gl_transaction_type"]
        }
        Update: {
          amount?: number
          bill_to_address1?: string | null
          bill_to_address2?: string | null
          bill_to_city?: string | null
          bill_to_country?: string | null
          bill_to_email?: string | null
          bill_to_name?: string | null
          bill_to_orgid?: string
          bill_to_phone?: string | null
          bill_to_postal_code?: string | null
          bill_to_state?: string | null
          created_by?: string | null
          created_on?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string
          remit_to_address1?: string | null
          remit_to_address2?: string | null
          remit_to_city?: string | null
          remit_to_country?: string | null
          remit_to_email?: string | null
          remit_to_name?: string | null
          remit_to_orgid?: string
          remit_to_phone?: string | null
          remit_to_postal_code?: string | null
          remit_to_state?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["gl_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "general_ledger_bill_to_orgid_fkey"
            columns: ["bill_to_orgid"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_remit_to_orgid_fkey"
            columns: ["remit_to_orgid"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      india_state_code: {
        Row: {
          state_code: number
          state_name: string | null
        }
        Insert: {
          state_code: number
          state_name?: string | null
        }
        Update: {
          state_code?: number
          state_name?: string | null
        }
        Relationships: []
      }
      inventory_stock: {
        Row: {
          available_quantity: number
          created_by: string
          created_on: string
          division_id: string
          id: string
          in_process_quantity: number
          inventory_cost: number | null
          item_id: string
          organization_id: string
          reference_number: string | null
          transaction_type: string
          uom: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          available_quantity: number
          created_by: string
          created_on?: string
          division_id: string
          id?: string
          in_process_quantity?: number
          inventory_cost?: number | null
          item_id: string
          organization_id: string
          reference_number?: string | null
          transaction_type: string
          uom: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          available_quantity?: number
          created_by?: string
          created_on?: string
          division_id?: string
          id?: string
          in_process_quantity?: number
          inventory_cost?: number | null
          item_id?: string
          organization_id?: string
          reference_number?: string | null
          transaction_type?: string
          uom?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfer_lines: {
        Row: {
          created_on: string
          id: string
          inventory_cost: number | null
          item_id: string
          line_number: number
          quantity_to_transfer: number
          transfer_id: string
          updated_on: string | null
        }
        Insert: {
          created_on?: string
          id?: string
          inventory_cost?: number | null
          item_id: string
          line_number: number
          quantity_to_transfer: number
          transfer_id: string
          updated_on?: string | null
        }
        Update: {
          created_on?: string
          id?: string
          inventory_cost?: number | null
          item_id?: string
          line_number?: number
          quantity_to_transfer?: number
          transfer_id?: string
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_transfer_lines_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_transfer_lines_transfer"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "inventory_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_lines_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "inventory_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          created_by: string
          created_on: string
          destination_division_id: string
          id: string
          organization_id: string
          origin_division_id: string
          status: string
          tracking_number: string | null
          transfer_date: string
          transfer_number: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          destination_division_id: string
          id?: string
          organization_id: string
          origin_division_id: string
          status?: string
          tracking_number?: string | null
          transfer_date?: string
          transfer_number: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          destination_division_id?: string
          id?: string
          organization_id?: string
          origin_division_id?: string
          status?: string
          tracking_number?: string | null
          transfer_date?: string
          transfer_number?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_transfers_destination_division"
            columns: ["destination_division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_transfers_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_transfers_origin_division"
            columns: ["origin_division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          bill_to_address1: string | null
          bill_to_address2: string | null
          bill_to_cin: string | null
          bill_to_city: string | null
          bill_to_country: string | null
          bill_to_email: string | null
          bill_to_gstin: string | null
          bill_to_name: string | null
          bill_to_org_id: string
          bill_to_phone: string | null
          bill_to_postal_code: string | null
          bill_to_state: string | null
          bill_to_state_code: number | null
          created_by: string
          created_on: string
          division_id: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          notes: string | null
          organization_id: string
          payment_terms: Database["public"]["Enums"]["payment_terms"] | null
          reference_transaction_date: string | null
          reference_transaction_number: string | null
          reference_transaction_type:
            | Database["public"]["Enums"]["transaction_type"]
            | null
          remit_to_address1: string | null
          remit_to_address2: string | null
          remit_to_cin: string | null
          remit_to_city: string | null
          remit_to_contact_id: string | null
          remit_to_country: string | null
          remit_to_email: string | null
          remit_to_gstin: string | null
          remit_to_name: string | null
          remit_to_org_id: string
          remit_to_phone: string | null
          remit_to_postal_code: string | null
          remit_to_state: string | null
          remit_to_state_code: number | null
          same_as_division_address: boolean | null
          ship_to_address1: string | null
          ship_to_address2: string | null
          ship_to_city: string | null
          ship_to_country: string | null
          ship_to_name: string | null
          ship_to_phone: string | null
          ship_to_postal_code: string | null
          ship_to_state: string | null
          ship_to_state_code: number | null
          status: Database["public"]["Enums"]["invoice_status"]
          supplier_invoice_number: string | null
          total_gst_value: number | null
          total_invoice_value: number | null
          total_item_value: number | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          bill_to_address1?: string | null
          bill_to_address2?: string | null
          bill_to_cin?: string | null
          bill_to_city?: string | null
          bill_to_country?: string | null
          bill_to_email?: string | null
          bill_to_gstin?: string | null
          bill_to_name?: string | null
          bill_to_org_id: string
          bill_to_phone?: string | null
          bill_to_postal_code?: string | null
          bill_to_state?: string | null
          bill_to_state_code?: number | null
          created_by: string
          created_on?: string
          division_id: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          notes?: string | null
          organization_id: string
          payment_terms?: Database["public"]["Enums"]["payment_terms"] | null
          reference_transaction_date?: string | null
          reference_transaction_number?: string | null
          reference_transaction_type?:
            | Database["public"]["Enums"]["transaction_type"]
            | null
          remit_to_address1?: string | null
          remit_to_address2?: string | null
          remit_to_cin?: string | null
          remit_to_city?: string | null
          remit_to_contact_id?: string | null
          remit_to_country?: string | null
          remit_to_email?: string | null
          remit_to_gstin?: string | null
          remit_to_name?: string | null
          remit_to_org_id: string
          remit_to_phone?: string | null
          remit_to_postal_code?: string | null
          remit_to_state?: string | null
          remit_to_state_code?: number | null
          same_as_division_address?: boolean | null
          ship_to_address1?: string | null
          ship_to_address2?: string | null
          ship_to_city?: string | null
          ship_to_country?: string | null
          ship_to_name?: string | null
          ship_to_phone?: string | null
          ship_to_postal_code?: string | null
          ship_to_state?: string | null
          ship_to_state_code?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          supplier_invoice_number?: string | null
          total_gst_value?: number | null
          total_invoice_value?: number | null
          total_item_value?: number | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          bill_to_address1?: string | null
          bill_to_address2?: string | null
          bill_to_cin?: string | null
          bill_to_city?: string | null
          bill_to_country?: string | null
          bill_to_email?: string | null
          bill_to_gstin?: string | null
          bill_to_name?: string | null
          bill_to_org_id?: string
          bill_to_phone?: string | null
          bill_to_postal_code?: string | null
          bill_to_state?: string | null
          bill_to_state_code?: number | null
          created_by?: string
          created_on?: string
          division_id?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          notes?: string | null
          organization_id?: string
          payment_terms?: Database["public"]["Enums"]["payment_terms"] | null
          reference_transaction_date?: string | null
          reference_transaction_number?: string | null
          reference_transaction_type?:
            | Database["public"]["Enums"]["transaction_type"]
            | null
          remit_to_address1?: string | null
          remit_to_address2?: string | null
          remit_to_cin?: string | null
          remit_to_city?: string | null
          remit_to_contact_id?: string | null
          remit_to_country?: string | null
          remit_to_email?: string | null
          remit_to_gstin?: string | null
          remit_to_name?: string | null
          remit_to_org_id?: string
          remit_to_phone?: string | null
          remit_to_postal_code?: string | null
          remit_to_state?: string | null
          remit_to_state_code?: number | null
          same_as_division_address?: boolean | null
          ship_to_address1?: string | null
          ship_to_address2?: string | null
          ship_to_city?: string | null
          ship_to_country?: string | null
          ship_to_name?: string | null
          ship_to_phone?: string | null
          ship_to_postal_code?: string | null
          ship_to_state?: string | null
          ship_to_state_code?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          supplier_invoice_number?: string | null
          total_gst_value?: number | null
          total_invoice_value?: number | null
          total_item_value?: number | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_remit_to_contact_id_fkey"
            columns: ["remit_to_contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_audit_log: {
        Row: {
          changed_by: string
          changed_on: string
          comments: string | null
          id: string
          invoice_id: string
          new_status: Database["public"]["Enums"]["invoice_status"]
          old_status: Database["public"]["Enums"]["invoice_status"] | null
        }
        Insert: {
          changed_by: string
          changed_on?: string
          comments?: string | null
          id?: string
          invoice_id: string
          new_status: Database["public"]["Enums"]["invoice_status"]
          old_status?: Database["public"]["Enums"]["invoice_status"] | null
        }
        Update: {
          changed_by?: string
          changed_on?: string
          comments?: string | null
          id?: string
          invoice_id?: string
          new_status?: Database["public"]["Enums"]["invoice_status"]
          old_status?: Database["public"]["Enums"]["invoice_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_audit_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_gst_breakdown: {
        Row: {
          cgst_amount: number | null
          cgst_percentage: number | null
          gst_percentage: number
          id: string
          igst_amount: number | null
          igst_percentage: number | null
          invoice_id: string
          sgst_amount: number | null
          sgst_percentage: number | null
          taxable_amount: number
          total_gst_amount: number
        }
        Insert: {
          cgst_amount?: number | null
          cgst_percentage?: number | null
          gst_percentage: number
          id?: string
          igst_amount?: number | null
          igst_percentage?: number | null
          invoice_id: string
          sgst_amount?: number | null
          sgst_percentage?: number | null
          taxable_amount: number
          total_gst_amount: number
        }
        Update: {
          cgst_amount?: number | null
          cgst_percentage?: number | null
          gst_percentage?: number
          id?: string
          igst_amount?: number | null
          igst_percentage?: number | null
          invoice_id?: string
          sgst_amount?: number | null
          sgst_percentage?: number | null
          taxable_amount?: number
          total_gst_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_gst_breakdown_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line: {
        Row: {
          created_on: string
          gst_percentage: number
          gst_value: number
          id: string
          invoice_id: string
          item_description: string
          item_id: string
          line_number: number
          line_total: number
          quantity: number
          total_price: number
          total_weight: number | null
          unit_price: number
          uom: string
          updated_on: string | null
          weight_per_unit: number | null
          weight_uom: string | null
        }
        Insert: {
          created_on?: string
          gst_percentage?: number
          gst_value?: number
          id?: string
          invoice_id: string
          item_description: string
          item_id: string
          line_number: number
          line_total: number
          quantity: number
          total_price: number
          total_weight?: number | null
          unit_price: number
          uom: string
          updated_on?: string | null
          weight_per_unit?: number | null
          weight_uom?: string | null
        }
        Update: {
          created_on?: string
          gst_percentage?: number
          gst_value?: number
          id?: string
          invoice_id?: string
          item_description?: string
          item_id?: string
          line_number?: number
          line_total?: number
          quantity?: number
          total_price?: number
          total_weight?: number | null
          unit_price?: number
          uom?: string
          updated_on?: string | null
          weight_per_unit?: number | null
          weight_uom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      item_attachments: {
        Row: {
          created_on: string
          file_name: string
          file_type: Database["public"]["Enums"]["attachment_file_type"]
          id: string
          is_default: boolean
          item_id: string
          organization_id: string
          secure_url: string
          updated_on: string | null
          uploaded_by: string
          uploaded_on: string
        }
        Insert: {
          created_on?: string
          file_name: string
          file_type: Database["public"]["Enums"]["attachment_file_type"]
          id?: string
          is_default?: boolean
          item_id: string
          organization_id: string
          secure_url: string
          updated_on?: string | null
          uploaded_by: string
          uploaded_on?: string
        }
        Update: {
          created_on?: string
          file_name?: string
          file_type?: Database["public"]["Enums"]["attachment_file_type"]
          id?: string
          is_default?: boolean
          item_id?: string
          organization_id?: string
          secure_url?: string
          updated_on?: string | null
          uploaded_by?: string
          uploaded_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_attachments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_costs: {
        Row: {
          created_by: string
          created_on: string
          id: string
          item_id: string | null
          organization_id: string | null
          price: number | null
          supplier_id: string | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          id?: string
          item_id?: string | null
          organization_id?: string | null
          price?: number | null
          supplier_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          id?: string
          item_id?: string | null
          organization_id?: string | null
          price?: number | null
          supplier_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_costs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_costs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      item_groups: {
        Row: {
          classification: string
          created_by: string
          created_on: string
          id: string
          name: string
          organization_id: string | null
          status: string
          sub_classification: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          classification: string
          created_by: string
          created_on?: string
          id?: string
          name: string
          organization_id?: string | null
          status?: string
          sub_classification: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          classification?: string
          created_by?: string
          created_on?: string
          id?: string
          name?: string
          organization_id?: string | null
          status?: string
          sub_classification?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      item_prices: {
        Row: {
          created_by: string
          created_on: string
          id: string
          item_id: string
          organization_id: string | null
          price: number | null
          sales_channel_id: string | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          id?: string
          item_id: string
          organization_id?: string | null
          price?: number | null
          sales_channel_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          id?: string
          item_id?: string
          organization_id?: string | null
          price?: number | null
          sales_channel_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_prices_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_prices_sales_channel_id_fkey"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          barcode: string | null
          classification: string
          created_by: string
          created_on: string
          description: string
          gst_percentage: number | null
          height: number | null
          id: string
          item_group_id: string | null
          length: number | null
          organization_id: string | null
          status: string
          sub_classification: string
          uom: string | null
          updated_by: string | null
          updated_on: string | null
          weight: number | null
          weight_uom: string | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          classification: string
          created_by: string
          created_on?: string
          description: string
          gst_percentage?: number | null
          height?: number | null
          id: string
          item_group_id?: string | null
          length?: number | null
          organization_id?: string | null
          status?: string
          sub_classification: string
          uom?: string | null
          updated_by?: string | null
          updated_on?: string | null
          weight?: number | null
          weight_uom?: string | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          classification?: string
          created_by?: string
          created_on?: string
          description?: string
          gst_percentage?: number | null
          height?: number | null
          id?: string
          item_group_id?: string | null
          length?: number | null
          organization_id?: string | null
          status?: string
          sub_classification?: string
          uom?: string | null
          updated_by?: string | null
          updated_on?: string | null
          weight?: number | null
          weight_uom?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_item_group_id_fkey"
            columns: ["item_group_id"]
            isOneToOne: false
            referencedRelation: "item_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_header: {
        Row: {
          created_by: string
          created_on: string
          id: string
          journal_date: string
          organization_id: string
          status: Database["public"]["Enums"]["journal_status"]
          transaction_reference: string | null
          transaction_type:
            | Database["public"]["Enums"]["rule_source_type"]
            | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          id?: string
          journal_date: string
          organization_id: string
          status?: Database["public"]["Enums"]["journal_status"]
          transaction_reference?: string | null
          transaction_type?:
            | Database["public"]["Enums"]["rule_source_type"]
            | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          id?: string
          journal_date?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["journal_status"]
          transaction_reference?: string | null
          transaction_type?:
            | Database["public"]["Enums"]["rule_source_type"]
            | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_header_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_line: {
        Row: {
          account_code: string
          created_on: string
          credit_amount: number | null
          debit_amount: number | null
          id: string
          journal_id: string
          line_number: number
          narration: string | null
          sl_reference_id: string | null
        }
        Insert: {
          account_code: string
          created_on?: string
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          journal_id: string
          line_number: number
          narration?: string | null
          sl_reference_id?: string | null
        }
        Update: {
          account_code?: string
          created_on?: string
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          journal_id?: string
          line_number?: number
          narration?: string | null
          sl_reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_line_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_header"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_contacts: {
        Row: {
          address1: string | null
          address2: string | null
          city: string | null
          contact_type: string
          country: string | null
          created_on: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          organization_id: string
          phone_number: string | null
          postal_code: string | null
          state: string | null
          state_code: number | null
          updated_on: string | null
          website: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          contact_type: string
          country?: string | null
          created_on?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          organization_id: string
          phone_number?: string | null
          postal_code?: string | null
          state?: string | null
          state_code?: number | null
          updated_on?: string | null
          website?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          contact_type?: string
          country?: string | null
          created_on?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          organization_id?: string
          phone_number?: string | null
          postal_code?: string | null
          state?: string | null
          state_code?: number | null
          updated_on?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "india_state_code"
            referencedColumns: ["state_code"]
          },
        ]
      }
      organization_references: {
        Row: {
          created_on: string
          id: string
          organization_id: string
          reference_type: string
          reference_value: string
          updated_on: string | null
        }
        Insert: {
          created_on?: string
          id?: string
          organization_id: string
          reference_type: string
          reference_value: string
          updated_on?: string | null
        }
        Update: {
          created_on?: string
          id?: string
          organization_id?: string
          reference_type?: string
          reference_value?: string
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_references_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string
          created_by: string | null
          created_on: string
          description: string | null
          id: string
          name: string
          status: string
          type: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          code: string
          created_by?: string | null
          created_on?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          type?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          code?: string
          created_by?: string | null
          created_on?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_by: string
          created_on: string
          current_organization_id: string
          id: string
          organization_id: string
          partnership_date: string
          status: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          current_organization_id: string
          id?: string
          organization_id: string
          partnership_date?: string
          status?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          current_organization_id?: string
          id?: string
          organization_id?: string
          partnership_date?: string
          status?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit_log: {
        Row: {
          changed_by: string
          changed_on: string
          comments: string | null
          id: string
          new_status: Database["public"]["Enums"]["payment_status"]
          old_status: Database["public"]["Enums"]["payment_status"] | null
          payment_id: string
        }
        Insert: {
          changed_by: string
          changed_on?: string
          comments?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["payment_status"]
          old_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_id: string
        }
        Update: {
          changed_by?: string
          changed_on?: string
          comments?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"]
          old_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_log_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_by: string
          created_on: string
          currency: string
          division_id: string
          id: string
          linked_invoice_id: string | null
          notes: string | null
          organization_id: string
          payee_organization_id: string
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_number: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          reference_number: string | null
          remit_to_contact_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          amount: number
          created_by: string
          created_on?: string
          currency?: string
          division_id: string
          id?: string
          linked_invoice_id?: string | null
          notes?: string | null
          organization_id: string
          payee_organization_id: string
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_number: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          reference_number?: string | null
          remit_to_contact_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          amount?: number
          created_by?: string
          created_on?: string
          currency?: string
          division_id?: string
          id?: string
          linked_invoice_id?: string | null
          notes?: string | null
          organization_id?: string
          payee_organization_id?: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_number?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          reference_number?: string | null
          remit_to_contact_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_remit_to_contact"
            columns: ["remit_to_contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payee_organization_id_fkey"
            columns: ["payee_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          component: string
          created_on: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          component: string
          created_on?: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          component?: string
          created_on?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          country_code: string
          created_on: string
          id: string
          number: string
          profile_id: string
          updated_on: string | null
        }
        Insert: {
          country_code: string
          created_on?: string
          id?: string
          number: string
          profile_id: string
          updated_on?: string | null
        }
        Update: {
          country_code?: string
          created_on?: string
          id?: string
          number?: string
          profile_id?: string
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      po_receive_transaction: {
        Row: {
          created_on: string
          id: string
          item_id: string
          organization_id: string
          purchase_order_id: string
          purchase_order_line_id: string
          quantity_received: number
          received_by: string
          received_on: string
          uom: string
        }
        Insert: {
          created_on?: string
          id?: string
          item_id: string
          organization_id: string
          purchase_order_id: string
          purchase_order_line_id: string
          quantity_received: number
          received_by: string
          received_on?: string
          uom: string
        }
        Update: {
          created_on?: string
          id?: string
          item_id?: string
          organization_id?: string
          purchase_order_id?: string
          purchase_order_line_id?: string
          quantity_received?: number
          received_by?: string
          received_on?: string
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_receive_transaction_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receive_transaction_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receive_transaction_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receive_transaction_purchase_order_line_id_fkey"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_line"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_by: string | null
          created_on: string
          designation: string | null
          effective_from: string
          effective_to: string | null
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
          phone: Json | null
          status: string
          updated_by: string | null
          updated_on: string | null
          username: string
        }
        Insert: {
          created_by?: string | null
          created_on?: string
          designation?: string | null
          effective_from?: string
          effective_to?: string | null
          first_name: string
          id: string
          last_name: string
          organization_id?: string | null
          phone?: Json | null
          status?: string
          updated_by?: string | null
          updated_on?: string | null
          username: string
        }
        Update: {
          created_by?: string | null
          created_on?: string
          designation?: string | null
          effective_from?: string
          effective_to?: string | null
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string | null
          phone?: Json | null
          status?: string
          updated_by?: string | null
          updated_on?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order: {
        Row: {
          bill_to_address1: string | null
          bill_to_address2: string | null
          bill_to_cin: string | null
          bill_to_city: string | null
          bill_to_country: string | null
          bill_to_email: string | null
          bill_to_gstin: string | null
          bill_to_name: string | null
          bill_to_org_id: string | null
          bill_to_phone: string | null
          bill_to_postal_code: string | null
          bill_to_state: string | null
          bill_to_state_code: number | null
          created_by: string
          created_on: string
          division_id: string | null
          id: string
          notes: string | null
          organization_id: string | null
          payment_terms: string | null
          po_date: string
          po_number: string
          po_type: Database["public"]["Enums"]["po_type"] | null
          remit_to_address1: string | null
          remit_to_address2: string | null
          remit_to_cin: string | null
          remit_to_city: string | null
          remit_to_contact_id: string | null
          remit_to_country: string | null
          remit_to_email: string | null
          remit_to_gstin: string | null
          remit_to_name: string | null
          remit_to_org_id: string | null
          remit_to_phone: string | null
          remit_to_postal_code: string | null
          remit_to_state: string | null
          remit_to_state_code: number | null
          requested_delivery_date: string | null
          ship_to_address_1: string | null
          ship_to_address_2: string | null
          ship_to_city: string | null
          ship_to_country: string | null
          ship_to_email: string | null
          ship_to_phone: string | null
          ship_to_postal_code: string | null
          ship_to_state: string | null
          ship_to_state_code: number | null
          status: string
          supplier_id: string | null
          tracking_number: string | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          bill_to_address1?: string | null
          bill_to_address2?: string | null
          bill_to_cin?: string | null
          bill_to_city?: string | null
          bill_to_country?: string | null
          bill_to_email?: string | null
          bill_to_gstin?: string | null
          bill_to_name?: string | null
          bill_to_org_id?: string | null
          bill_to_phone?: string | null
          bill_to_postal_code?: string | null
          bill_to_state?: string | null
          bill_to_state_code?: number | null
          created_by: string
          created_on?: string
          division_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          payment_terms?: string | null
          po_date?: string
          po_number: string
          po_type?: Database["public"]["Enums"]["po_type"] | null
          remit_to_address1?: string | null
          remit_to_address2?: string | null
          remit_to_cin?: string | null
          remit_to_city?: string | null
          remit_to_contact_id?: string | null
          remit_to_country?: string | null
          remit_to_email?: string | null
          remit_to_gstin?: string | null
          remit_to_name?: string | null
          remit_to_org_id?: string | null
          remit_to_phone?: string | null
          remit_to_postal_code?: string | null
          remit_to_state?: string | null
          remit_to_state_code?: number | null
          requested_delivery_date?: string | null
          ship_to_address_1?: string | null
          ship_to_address_2?: string | null
          ship_to_city?: string | null
          ship_to_country?: string | null
          ship_to_email?: string | null
          ship_to_phone?: string | null
          ship_to_postal_code?: string | null
          ship_to_state?: string | null
          ship_to_state_code?: number | null
          status?: string
          supplier_id?: string | null
          tracking_number?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          bill_to_address1?: string | null
          bill_to_address2?: string | null
          bill_to_cin?: string | null
          bill_to_city?: string | null
          bill_to_country?: string | null
          bill_to_email?: string | null
          bill_to_gstin?: string | null
          bill_to_name?: string | null
          bill_to_org_id?: string | null
          bill_to_phone?: string | null
          bill_to_postal_code?: string | null
          bill_to_state?: string | null
          bill_to_state_code?: number | null
          created_by?: string
          created_on?: string
          division_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          payment_terms?: string | null
          po_date?: string
          po_number?: string
          po_type?: Database["public"]["Enums"]["po_type"] | null
          remit_to_address1?: string | null
          remit_to_address2?: string | null
          remit_to_cin?: string | null
          remit_to_city?: string | null
          remit_to_contact_id?: string | null
          remit_to_country?: string | null
          remit_to_email?: string | null
          remit_to_gstin?: string | null
          remit_to_name?: string | null
          remit_to_org_id?: string | null
          remit_to_phone?: string | null
          remit_to_postal_code?: string | null
          remit_to_state?: string | null
          remit_to_state_code?: number | null
          requested_delivery_date?: string | null
          ship_to_address_1?: string | null
          ship_to_address_2?: string | null
          ship_to_city?: string | null
          ship_to_country?: string | null
          ship_to_email?: string | null
          ship_to_phone?: string | null
          ship_to_postal_code?: string | null
          ship_to_state?: string | null
          ship_to_state_code?: number | null
          status?: string
          supplier_id?: string | null
          tracking_number?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_order_bill_to_org"
            columns: ["bill_to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_order_bill_to_state_code"
            columns: ["bill_to_state_code"]
            isOneToOne: false
            referencedRelation: "india_state_code"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "fk_purchase_order_remit_to_org"
            columns: ["remit_to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_order_remit_to_state_code"
            columns: ["remit_to_state_code"]
            isOneToOne: false
            referencedRelation: "india_state_code"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "purchase_order_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_remit_to_contact_id_fkey"
            columns: ["remit_to_contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_ship_to_state_code_fkey"
            columns: ["ship_to_state_code"]
            isOneToOne: false
            referencedRelation: "india_state_code"
            referencedColumns: ["state_code"]
          },
          {
            foreignKeyName: "purchase_order_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_gst_breakdown: {
        Row: {
          cgst_amount: number | null
          cgst_percentage: number | null
          gst_percentage: number
          id: string
          igst_amount: number | null
          igst_percentage: number | null
          purchase_order_id: string
          sgst_amount: number | null
          sgst_percentage: number | null
          taxable_amount: number
          total_gst_amount: number
        }
        Insert: {
          cgst_amount?: number | null
          cgst_percentage?: number | null
          gst_percentage: number
          id?: string
          igst_amount?: number | null
          igst_percentage?: number | null
          purchase_order_id: string
          sgst_amount?: number | null
          sgst_percentage?: number | null
          taxable_amount: number
          total_gst_amount: number
        }
        Update: {
          cgst_amount?: number | null
          cgst_percentage?: number | null
          gst_percentage?: number
          id?: string
          igst_amount?: number | null
          igst_percentage?: number | null
          purchase_order_id?: string
          sgst_amount?: number | null
          sgst_percentage?: number | null
          taxable_amount?: number
          total_gst_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_gst_breakdown_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_line: {
        Row: {
          created_by: string
          created_on: string
          gst_percent: number
          gst_value: number
          id: string
          item_id: string
          item_weight_per_unit: number | null
          item_weight_uom: string | null
          line_number: number
          line_total: number
          organization_id: string | null
          purchase_order_id: string
          quantity: number
          received_quantity: number
          total_line_weight: number | null
          total_unit_price: number
          unit_price: number
          uom: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          gst_percent?: number
          gst_value?: number
          id?: string
          item_id: string
          item_weight_per_unit?: number | null
          item_weight_uom?: string | null
          line_number: number
          line_total: number
          organization_id?: string | null
          purchase_order_id: string
          quantity: number
          received_quantity?: number
          total_line_weight?: number | null
          total_unit_price: number
          unit_price: number
          uom: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          gst_percent?: number
          gst_value?: number
          id?: string
          item_id?: string
          item_weight_per_unit?: number | null
          item_weight_uom?: string | null
          line_number?: number
          line_total?: number
          organization_id?: string | null
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          total_line_weight?: number | null
          total_unit_price?: number
          unit_price?: number
          uom?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_line_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_line_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_line_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_by: string | null
          created_on: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by?: string | null
          created_on?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string | null
          created_on?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_channels: {
        Row: {
          created_by: string
          created_on: string
          id: string
          name: string
          organization_id: string | null
          status: string
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          id?: string
          name: string
          organization_id?: string | null
          status?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          id?: string
          name?: string
          organization_id?: string | null
          status?: string
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subledger: {
        Row: {
          created_by: string
          created_on: string
          credit_amount: number | null
          debit_amount: number | null
          id: string
          journal_id: string | null
          organization_id: string
          party_contact_id: string | null
          party_org_id: string
          source_reference: string | null
          transaction_category: string | null
          transaction_date: string
          triggering_action: string | null
          updated_by: string | null
          updated_on: string | null
        }
        Insert: {
          created_by: string
          created_on?: string
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          journal_id?: string | null
          organization_id: string
          party_contact_id?: string | null
          party_org_id: string
          source_reference?: string | null
          transaction_category?: string | null
          transaction_date: string
          triggering_action?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Update: {
          created_by?: string
          created_on?: string
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          journal_id?: string | null
          organization_id?: string
          party_contact_id?: string | null
          party_org_id?: string
          source_reference?: string | null
          transaction_category?: string | null
          transaction_date?: string
          triggering_action?: string | null
          updated_by?: string | null
          updated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subledger_party_contact"
            columns: ["party_contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subledger_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subledger_party_org_id_fkey"
            columns: ["party_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          assigned_on: string
          id: string
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_on?: string
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_on?: string
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_payment_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_transfer_number: {
        Args: { org_id: string }
        Returns: string
      }
      get_inventory_stock_summary: {
        Args: { p_organization_id: string; p_include_zero_stock?: boolean }
        Returns: {
          item_id: string
          item_description: string
          division_id: string
          division_name: string
          quantity_available: number
          in_process_quantity: number
          uom: string
          last_updated_on: string
          item_group_name: string
          classification: string
          sub_classification: string
        }[]
      }
      get_total_payables: {
        Args: { p_organization_id: string }
        Returns: number
      }
      get_user_organization_id: {
        Args: { user_id: string }
        Returns: string
      }
      has_permission: {
        Args: { p_user_id: string; p_permission_name: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { user_id: string; role_name: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type:
        | "Asset"
        | "Liability"
        | "Equity"
        | "Revenue"
        | "Expense"
        | "Assets - Inventory"
      app_role: "admin" | "user" | "guest"
      attachment_file_type: "display_picture" | "other_document"
      filter_logic_type: "AND" | "OR"
      gl_transaction_type:
        | "Payable Invoice"
        | "Payment"
        | "Credit Note"
        | "Debit Note"
      invoice_status: "Draft" | "Awaiting Approval" | "Approved" | "Rejected"
      invoice_type: "Payable" | "Receivable"
      journal_status: "Draft" | "Posted" | "Reversed"
      party_type: "Bill To" | "Remit To"
      payment_mode:
        | "Bank Transfer"
        | "UPI"
        | "Cheque"
        | "Cash"
        | "Online Payment"
        | "Wire Transfer"
      payment_status: "Created" | "Approved" | "Rejected"
      payment_terms:
        | "Net 30"
        | "Net 60"
        | "Net 90"
        | "Due on Receipt"
        | "Net 15"
      payment_type: "Invoice-based" | "Ad-hoc"
      po_type: "Consumables" | "Assets" | "Finished goods" | "Raw materials"
      rule_action:
        | "Invoice Approved"
        | "PO Created"
        | "Payment Processed"
        | "Purchase order receive"
      rule_source_type: "Invoice" | "PO" | "Payment"
      subledger_status: "Open" | "Settled"
      transaction_type: "Purchase Order" | "Sales Order"
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
    Enums: {
      account_type: [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense",
        "Assets - Inventory",
      ],
      app_role: ["admin", "user", "guest"],
      attachment_file_type: ["display_picture", "other_document"],
      filter_logic_type: ["AND", "OR"],
      gl_transaction_type: [
        "Payable Invoice",
        "Payment",
        "Credit Note",
        "Debit Note",
      ],
      invoice_status: ["Draft", "Awaiting Approval", "Approved", "Rejected"],
      invoice_type: ["Payable", "Receivable"],
      journal_status: ["Draft", "Posted", "Reversed"],
      party_type: ["Bill To", "Remit To"],
      payment_mode: [
        "Bank Transfer",
        "UPI",
        "Cheque",
        "Cash",
        "Online Payment",
        "Wire Transfer",
      ],
      payment_status: ["Created", "Approved", "Rejected"],
      payment_terms: ["Net 30", "Net 60", "Net 90", "Due on Receipt", "Net 15"],
      payment_type: ["Invoice-based", "Ad-hoc"],
      po_type: ["Consumables", "Assets", "Finished goods", "Raw materials"],
      rule_action: [
        "Invoice Approved",
        "PO Created",
        "Payment Processed",
        "Purchase order receive",
      ],
      rule_source_type: ["Invoice", "PO", "Payment"],
      subledger_status: ["Open", "Settled"],
      transaction_type: ["Purchase Order", "Sales Order"],
    },
  },
} as const
