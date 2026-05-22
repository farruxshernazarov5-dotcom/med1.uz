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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_payments: {
        Row: {
          amount: number
          billing_period: string
          created_at: string | null
          id: string
          invoice_id: string
          paid_at: string | null
          payment_method: string | null
          plan_id: string
          services: string[] | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_period?: string
          created_at?: string | null
          id?: string
          invoice_id: string
          paid_at?: string | null
          payment_method?: string | null
          plan_id: string
          services?: string[] | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_period?: string
          created_at?: string | null
          id?: string
          invoice_id?: string
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string
          services?: string[] | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          detected_keywords: string[] | null
          detected_specialties: string[] | null
          detected_symptoms: string[] | null
          id: string
          input_text: string
          intent_score: number | null
          matched_clinic_ids: string[] | null
          matched_doctor_ids: string[] | null
          matched_promotion_ids: string[] | null
          notification_channels: string[] | null
          notification_sent: boolean | null
          priority: string | null
          session_id: string | null
          source_channel: string | null
          user_clicked: boolean | null
          user_converted: boolean | null
          user_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string | null
          detected_keywords?: string[] | null
          detected_specialties?: string[] | null
          detected_symptoms?: string[] | null
          id?: string
          input_text: string
          intent_score?: number | null
          matched_clinic_ids?: string[] | null
          matched_doctor_ids?: string[] | null
          matched_promotion_ids?: string[] | null
          notification_channels?: string[] | null
          notification_sent?: boolean | null
          priority?: string | null
          session_id?: string | null
          source_channel?: string | null
          user_clicked?: boolean | null
          user_converted?: boolean | null
          user_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string | null
          detected_keywords?: string[] | null
          detected_specialties?: string[] | null
          detected_symptoms?: string[] | null
          id?: string
          input_text?: string
          intent_score?: number | null
          matched_clinic_ids?: string[] | null
          matched_doctor_ids?: string[] | null
          matched_promotion_ids?: string[] | null
          notification_channels?: string[] | null
          notification_sent?: boolean | null
          priority?: string | null
          session_id?: string | null
          source_channel?: string | null
          user_clicked?: boolean | null
          user_converted?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_subscription_plans: {
        Row: {
          allowed_services: Json
          created_at: string
          daily_limit: number
          features: Json
          id: string
          is_active: boolean
          monthly_credits: number
          monthly_limit: number
          name: string
          name_uz: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          allowed_services?: Json
          created_at?: string
          daily_limit?: number
          features?: Json
          id: string
          is_active?: boolean
          monthly_credits?: number
          monthly_limit?: number
          name: string
          name_uz: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          tier: string
          updated_at?: string
        }
        Update: {
          allowed_services?: Json
          created_at?: string
          daily_limit?: number
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits?: number
          monthly_limit?: number
          name?: string
          name_uz?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_subscriptions: {
        Row: {
          billing_period: string
          created_at: string | null
          daily_image_limit: number
          daily_text_limit: number
          expires_at: string | null
          id: string
          plan_id: string
          services: string[] | null
          started_at: string | null
          status: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period?: string
          created_at?: string | null
          daily_image_limit?: number
          daily_text_limit?: number
          expires_at?: string | null
          id?: string
          plan_id?: string
          services?: string[] | null
          started_at?: string | null
          status?: string
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          daily_image_limit?: number
          daily_text_limit?: number
          expires_at?: string | null
          id?: string
          plan_id?: string
          services?: string[] | null
          started_at?: string | null
          status?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          id: string
          service_id: string
          usage_date: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          service_id: string
          usage_date?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          service_id?: string
          usage_date?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          environment: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          partner_id: string
          rate_limit_per_day: number
          rate_limit_per_min: number
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          environment?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          partner_id: string
          rate_limit_per_day?: number
          rate_limit_per_min?: number
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          environment?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          partner_id?: string
          rate_limit_per_day?: number
          rate_limit_per_min?: number
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "api_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      api_partner_applications: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          inn: string | null
          org_name: string
          org_type: string
          partner_id: string | null
          requested_scopes: string[]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          use_case: string
          user_id: string
          website: string | null
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          inn?: string | null
          org_name: string
          org_type: string
          partner_id?: string | null
          requested_scopes?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          use_case: string
          user_id: string
          website?: string | null
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          inn?: string | null
          org_name?: string
          org_type?: string
          partner_id?: string | null
          requested_scopes?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          use_case?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_partner_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "api_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      api_partners: {
        Row: {
          allowed_domains: string[]
          approved_at: string | null
          approved_by: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          inn: string | null
          ip_whitelist: string[]
          notes: string | null
          org_name: string
          org_type: string
          owner_user_id: string
          status: string
          tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          allowed_domains?: string[]
          approved_at?: string | null
          approved_by?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          inn?: string | null
          ip_whitelist?: string[]
          notes?: string | null
          org_name: string
          org_type?: string
          owner_user_id: string
          status?: string
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          allowed_domains?: string[]
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          inn?: string | null
          ip_whitelist?: string[]
          notes?: string | null
          org_name?: string
          org_type?: string
          owner_user_id?: string
          status?: string
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          partner_id: string | null
          request_id: string | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          partner_id?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          partner_id?: string | null
          request_id?: string | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "api_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      api_webhook_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          event: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          retry_count: number
          status: string
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          event: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          retry_count?: number
          status?: string
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          event?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          retry_count?: number
          status?: string
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "api_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      api_webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          last_delivery_at: string | null
          last_status: string | null
          partner_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_delivery_at?: string | null
          last_status?: string | null
          partner_id: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          last_delivery_at?: string | null
          last_status?: string | null
          partner_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_webhooks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "api_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string
          patient_name: string
          patient_phone: string
          payment_id: string | null
          payment_status: string
          service_id: string | null
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_name: string
          patient_phone: string
          payment_id?: string | null
          payment_status?: string
          service_id?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string
          patient_phone?: string
          payment_id?: string | null
          payment_status?: string
          service_id?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "clinic_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "clinic_services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          module: string | null
          new_data: Json | null
          old_data: Json | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          module?: string | null
          new_data?: Json | null
          old_data?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          module?: string | null
          new_data?: Json | null
          old_data?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      baby_growth_logs: {
        Row: {
          baby_id: string
          created_at: string
          head_cm: number | null
          height_cm: number | null
          id: string
          log_date: string
          notes: string | null
          user_id: string
          weight_g: number | null
        }
        Insert: {
          baby_id: string
          created_at?: string
          head_cm?: number | null
          height_cm?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          user_id: string
          weight_g?: number | null
        }
        Update: {
          baby_id?: string
          created_at?: string
          head_cm?: number | null
          height_cm?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baby_growth_logs_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_profiles: {
        Row: {
          baby_name: string
          birth_date: string
          birth_height_cm: number | null
          birth_type: string
          birth_weight_g: number | null
          created_at: string
          gender: string
          hospital_name: string | null
          id: string
          is_active: boolean | null
          mother_health_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          baby_name?: string
          birth_date: string
          birth_height_cm?: number | null
          birth_type?: string
          birth_weight_g?: number | null
          created_at?: string
          gender?: string
          hospital_name?: string | null
          id?: string
          is_active?: boolean | null
          mother_health_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          baby_name?: string
          birth_date?: string
          birth_height_cm?: number | null
          birth_type?: string
          birth_weight_g?: number | null
          created_at?: string
          gender?: string
          hospital_name?: string | null
          id?: string
          is_active?: boolean | null
          mother_health_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_banks_registered: {
        Row: {
          additional_phone: string | null
          address: string
          available_blood_types: string[] | null
          city: string
          created_at: string
          director_name: string | null
          email: string | null
          emergency_contact: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          latitude: number | null
          license_document_url: string | null
          license_number: string | null
          longitude: number | null
          name: string
          org_type: string
          owner_id: string
          phone: string
          region: string
          storage_capacity: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          additional_phone?: string | null
          address: string
          available_blood_types?: string[] | null
          city: string
          created_at?: string
          director_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          license_document_url?: string | null
          license_number?: string | null
          longitude?: number | null
          name: string
          org_type?: string
          owner_id: string
          phone: string
          region: string
          storage_capacity?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          additional_phone?: string | null
          address?: string
          available_blood_types?: string[] | null
          city?: string
          created_at?: string
          director_name?: string | null
          email?: string | null
          emergency_contact?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          license_document_url?: string | null
          license_number?: string | null
          longitude?: number | null
          name?: string
          org_type?: string
          owner_id?: string
          phone?: string
          region?: string
          storage_capacity?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      blood_donations: {
        Row: {
          blood_bank_id: string
          created_at: string
          donation_date: string
          donor_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          blood_bank_id: string
          created_at?: string
          donation_date?: string
          donor_id: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          blood_bank_id?: string
          created_at?: string
          donation_date?: string
          donor_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_donations_blood_bank_id_fkey"
            columns: ["blood_bank_id"]
            isOneToOne: false
            referencedRelation: "blood_banks_registered"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donors"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donors: {
        Row: {
          blood_group: string
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string
          id: string
          is_active: boolean | null
          last_donation_date: string | null
          medical_restrictions: string | null
          passport_id: string | null
          phone: string
          region: string | null
          rh_factor: string
          updated_at: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          blood_group: string
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string
          id?: string
          is_active?: boolean | null
          last_donation_date?: string | null
          medical_restrictions?: string | null
          passport_id?: string | null
          phone: string
          region?: string | null
          rh_factor?: string
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          blood_group?: string
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string
          id?: string
          is_active?: boolean | null
          last_donation_date?: string | null
          medical_restrictions?: string | null
          passport_id?: string | null
          phone?: string
          region?: string | null
          rh_factor?: string
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      click_webhook_log: {
        Row: {
          action: string
          click_trans_id: string
          created_at: string
          error_note: string | null
          id: string
          merchant_trans_id: string | null
          payment_id: string | null
          request_body: Json | null
          request_ip: string | null
          response_body: Json | null
          sign_string: string | null
          sign_time: string | null
          status: string
        }
        Insert: {
          action: string
          click_trans_id: string
          created_at?: string
          error_note?: string | null
          id?: string
          merchant_trans_id?: string | null
          payment_id?: string | null
          request_body?: Json | null
          request_ip?: string | null
          response_body?: Json | null
          sign_string?: string | null
          sign_time?: string | null
          status?: string
        }
        Update: {
          action?: string
          click_trans_id?: string
          created_at?: string
          error_note?: string | null
          id?: string
          merchant_trans_id?: string | null
          payment_id?: string | null
          request_body?: Json | null
          request_ip?: string | null
          response_body?: Json | null
          sign_string?: string | null
          sign_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "click_webhook_log_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "platform_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_payments: {
        Row: {
          amount: number
          appointment_id: string | null
          clinic_id: string
          created_at: string
          id: string
          invoice_number: string | null
          notes: string | null
          patient_id: string
          provider: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          patient_id: string
          provider?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          patient_id?: string
          provider?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_photos: {
        Row: {
          caption: string | null
          clinic_id: string
          created_at: string
          id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string
          message_type: string
          phone: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string
          message_type?: string
          phone?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string
          message_type?: string
          phone?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contract_access_log: {
        Row: {
          action: string
          contract_id: string
          created_at: string
          id: string
          ip_address: string | null
          meta: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          meta?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          meta?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_access_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_categories: {
        Row: {
          created_at: string
          description_ru: string | null
          description_uz: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_ru: string
          name_uz: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ru?: string | null
          description_uz?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ru: string
          name_uz: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ru?: string | null
          description_uz?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ru?: string
          name_uz?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contract_notifications: {
        Row: {
          body: string | null
          contract_id: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          contract_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          contract_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_notifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signature_otps: {
        Row: {
          attempts: number
          channel: string
          consumed_at: string | null
          contract_id: string
          created_at: string
          destination: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
        }
        Insert: {
          attempts?: number
          channel?: string
          consumed_at?: string | null
          contract_id: string
          created_at?: string
          destination: string
          expires_at?: string
          id?: string
          otp_code: string
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          consumed_at?: string | null
          contract_id?: string
          created_at?: string
          destination?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signature_otps_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          contract_id: string
          device_type: string | null
          geo_city: string | null
          geo_country: string | null
          id: string
          ip_address: string | null
          is_valid: boolean
          method: Database["public"]["Enums"]["signature_method"]
          otp_channel: string | null
          otp_verified: boolean
          revoked_at: string | null
          revoked_reason: string | null
          signature_hash: string
          signature_image_url: string | null
          signed_at: string
          signer_email: string | null
          signer_id: string
          signer_name: string
          signer_phone: string | null
          signer_role: Database["public"]["Enums"]["contract_party_role"]
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          device_type?: string | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          method?: Database["public"]["Enums"]["signature_method"]
          otp_channel?: string | null
          otp_verified?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          signature_hash: string
          signature_image_url?: string | null
          signed_at?: string
          signer_email?: string | null
          signer_id: string
          signer_name: string
          signer_phone?: string | null
          signer_role?: Database["public"]["Enums"]["contract_party_role"]
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          device_type?: string | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          method?: Database["public"]["Enums"]["signature_method"]
          otp_channel?: string | null
          otp_verified?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          signature_hash?: string
          signature_image_url?: string | null
          signed_at?: string
          signer_email?: string | null
          signer_id?: string
          signer_name?: string
          signer_phone?: string | null
          signer_role?: Database["public"]["Enums"]["contract_party_role"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_template_versions: {
        Row: {
          body_ru: string
          body_uz: string
          change_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          template_id: string
          title_ru: string
          title_uz: string
          version: string
        }
        Insert: {
          body_ru: string
          body_uz: string
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_id: string
          title_ru: string
          title_uz: string
          version: string
        }
        Update: {
          body_ru?: string
          body_uz?: string
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_id?: string
          title_ru?: string
          title_uz?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          allowed_roles: string[]
          body_ru: string
          body_uz: string
          category_id: string | null
          created_at: string
          created_by: string | null
          current_version: string
          id: string
          is_active: boolean
          is_mandatory: boolean
          jurisdiction: string
          required_signature: Database["public"]["Enums"]["signature_method"]
          slug: string
          summary_ru: string | null
          summary_uz: string | null
          title_ru: string
          title_uz: string
          updated_at: string
          valid_for_days: number | null
          variables: Json
        }
        Insert: {
          allowed_roles?: string[]
          body_ru: string
          body_uz: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          jurisdiction?: string
          required_signature?: Database["public"]["Enums"]["signature_method"]
          slug: string
          summary_ru?: string | null
          summary_uz?: string | null
          title_ru: string
          title_uz: string
          updated_at?: string
          valid_for_days?: number | null
          variables?: Json
        }
        Update: {
          allowed_roles?: string[]
          body_ru?: string
          body_uz?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          jurisdiction?: string
          required_signature?: Database["public"]["Enums"]["signature_method"]
          slug?: string
          summary_ru?: string | null
          summary_uz?: string | null
          title_ru?: string
          title_uz?: string
          updated_at?: string
          valid_for_days?: number | null
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "contract_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["contract_approval_status"]
          approved_at: string | null
          approved_by: string | null
          body_ru: string
          body_uz: string
          category_slug: string | null
          collected_signatures: number
          contract_number: string
          counterparty_id: string | null
          counterparty_name: string | null
          created_at: string
          effective_from: string | null
          effective_until: string | null
          filled_data: Json
          hash_id: string
          id: string
          language: string
          meta: Json
          organization_id: string | null
          owner_id: string
          owner_role: Database["public"]["Enums"]["contract_party_role"]
          pdf_url: string | null
          pdf_watermark: string | null
          rejected_reason: string | null
          required_signatures: number
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          template_id: string | null
          template_version: string
          terminated_at: string | null
          terminated_reason: string | null
          title_ru: string
          title_uz: string
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["contract_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          body_ru: string
          body_uz: string
          category_slug?: string | null
          collected_signatures?: number
          contract_number: string
          counterparty_id?: string | null
          counterparty_name?: string | null
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          filled_data?: Json
          hash_id?: string
          id?: string
          language?: string
          meta?: Json
          organization_id?: string | null
          owner_id: string
          owner_role?: Database["public"]["Enums"]["contract_party_role"]
          pdf_url?: string | null
          pdf_watermark?: string | null
          rejected_reason?: string | null
          required_signatures?: number
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_id?: string | null
          template_version: string
          terminated_at?: string | null
          terminated_reason?: string | null
          title_ru: string
          title_uz: string
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["contract_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          body_ru?: string
          body_uz?: string
          category_slug?: string | null
          collected_signatures?: number
          contract_number?: string
          counterparty_id?: string | null
          counterparty_name?: string | null
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          filled_data?: Json
          hash_id?: string
          id?: string
          language?: string
          meta?: Json
          organization_id?: string | null
          owner_id?: string
          owner_role?: Database["public"]["Enums"]["contract_party_role"]
          pdf_url?: string | null
          pdf_watermark?: string | null
          rejected_reason?: string | null
          required_signatures?: number
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_id?: string | null
          template_version?: string
          terminated_at?: string | null
          terminated_reason?: string | null
          title_ru?: string
          title_uz?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          center_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          patient_name: string
          patient_phone: string
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          center_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          patient_name: string
          patient_phone: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          center_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string
          patient_phone?: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_appointments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_services"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_auto_marketing: {
        Row: {
          center_id: string
          channel: string
          created_at: string
          days_offset: number | null
          id: string
          is_active: boolean
          last_run_at: string | null
          message_template: string
          rule_name: string
          total_sent: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          center_id: string
          channel?: string
          created_at?: string
          days_offset?: number | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          message_template: string
          rule_name: string
          total_sent?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          center_id?: string
          channel?: string
          created_at?: string
          days_offset?: number | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          message_template?: string
          rule_name?: string
          total_sent?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_auto_marketing_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_before_after: {
        Row: {
          after_url: string | null
          before_url: string | null
          center_id: string
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          service_type: string | null
          taken_date: string
        }
        Insert: {
          after_url?: string | null
          before_url?: string | null
          center_id: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          service_type?: string | null
          taken_date?: string
        }
        Update: {
          after_url?: string | null
          before_url?: string | null
          center_id?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          service_type?: string | null
          taken_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_before_after_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_before_after_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_client_packages: {
        Row: {
          amount_paid: number | null
          center_id: string
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          package_id: string | null
          package_name: string
          purchase_date: string
          status: string
          total_sessions: number | null
          used_sessions: number | null
        }
        Insert: {
          amount_paid?: number | null
          center_id: string
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string | null
          package_name: string
          purchase_date?: string
          status?: string
          total_sessions?: number | null
          used_sessions?: number | null
        }
        Update: {
          amount_paid?: number | null
          center_id?: string
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string | null
          package_name?: string
          purchase_date?: string
          status?: string
          total_sessions?: number | null
          used_sessions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_client_packages_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_client_product_recommendations: {
        Row: {
          center_id: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          recommended_by: string | null
          status: string | null
        }
        Insert: {
          center_id: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          recommended_by?: string | null
          status?: string | null
        }
        Update: {
          center_id?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          recommended_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_client_product_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_client_product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_client_visits: {
        Row: {
          amount: number | null
          center_id: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          service_id: string | null
          service_name: string | null
          staff_name: string | null
          visit_date: string
        }
        Insert: {
          amount?: number | null
          center_id: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          service_name?: string | null
          staff_name?: string | null
          visit_date?: string
        }
        Update: {
          amount?: number | null
          center_id?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          service_name?: string | null
          staff_name?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_client_visits_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_client_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_clients: {
        Row: {
          allergies: string | null
          center_id: string
          contraindications: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          last_visit_date: string | null
          loyalty_points: number | null
          medical_notes: string | null
          notes: string | null
          phone: string
          skin_concerns: string[] | null
          skin_type: string | null
          source: string | null
          total_spent: number | null
          updated_at: string
          visit_count: number | null
        }
        Insert: {
          allergies?: string | null
          center_id: string
          contraindications?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_visit_date?: string | null
          loyalty_points?: number | null
          medical_notes?: string | null
          notes?: string | null
          phone: string
          skin_concerns?: string[] | null
          skin_type?: string | null
          source?: string | null
          total_spent?: number | null
          updated_at?: string
          visit_count?: number | null
        }
        Update: {
          allergies?: string | null
          center_id?: string
          contraindications?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_visit_date?: string | null
          loyalty_points?: number | null
          medical_notes?: string | null
          notes?: string | null
          phone?: string
          skin_concerns?: string[] | null
          skin_type?: string | null
          source?: string | null
          total_spent?: number | null
          updated_at?: string
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_clients_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_course_sessions: {
        Row: {
          center_id: string
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          result_notes: string | null
          scheduled_date: string | null
          session_number: number
          staff_name: string | null
          status: string
        }
        Insert: {
          center_id: string
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          result_notes?: string | null
          scheduled_date?: string | null
          session_number: number
          staff_name?: string | null
          status?: string
        }
        Update: {
          center_id?: string
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          result_notes?: string | null
          scheduled_date?: string | null
          session_number?: number
          staff_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_course_sessions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_treatment_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_documents: {
        Row: {
          center_id: string
          client_id: string | null
          created_at: string
          doc_type: string
          file_name: string
          file_url: string
          id: string
          notes: string | null
          signed_at: string | null
        }
        Insert: {
          center_id: string
          client_id?: string | null
          created_at?: string
          doc_type?: string
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          signed_at?: string | null
        }
        Update: {
          center_id?: string
          client_id?: string | null
          created_at?: string
          doc_type?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_documents_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_feedback: {
        Row: {
          center_id: string
          client_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          reply: string | null
          service_name: string | null
          staff_name: string | null
          status: string | null
        }
        Insert: {
          center_id: string
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reply?: string | null
          service_name?: string | null
          staff_name?: string | null
          status?: string | null
        }
        Update: {
          center_id?: string
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reply?: string | null
          service_name?: string | null
          staff_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_feedback_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_inventory: {
        Row: {
          brand: string | null
          category: string | null
          center_id: string
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_quantity: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          quantity: number
          sell_price: number | null
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          center_id: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_quantity?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          center_id?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_quantity?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_inventory_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_leads: {
        Row: {
          assigned_to: string | null
          center_id: string
          converted_client_id: string | null
          created_at: string
          full_name: string
          id: string
          interested_service: string | null
          notes: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          center_id: string
          converted_client_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          interested_service?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          center_id?: string
          converted_client_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          interested_service?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_leads_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_marketing_campaigns: {
        Row: {
          center_id: string
          channel: string
          created_at: string
          id: string
          message: string
          name: string
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          target_segment: string | null
        }
        Insert: {
          center_id: string
          channel?: string
          created_at?: string
          id?: string
          message: string
          name: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          target_segment?: string | null
        }
        Update: {
          center_id?: string
          channel?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          target_segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_marketing_campaigns_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_notifications: {
        Row: {
          center_id: string
          client_id: string | null
          created_at: string
          id: string
          message: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          center_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          type?: string
        }
        Update: {
          center_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_notifications_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_packages: {
        Row: {
          center_id: string
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          services_included: string[] | null
          total_sessions: number | null
          validity_days: number | null
        }
        Insert: {
          center_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          services_included?: string[] | null
          total_sessions?: number | null
          validity_days?: number | null
        }
        Update: {
          center_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          services_included?: string[] | null
          total_sessions?: number | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_packages_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_photos: {
        Row: {
          caption: string | null
          center_id: string
          created_at: string
          id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          center_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          center_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_photos_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_product_sales: {
        Row: {
          center_id: string
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          product_id: string
          quantity: number
          sold_by: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          center_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_id: string
          quantity?: number
          sold_by?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          center_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_id?: string
          quantity?: number
          sold_by?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_product_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_product_usage: {
        Row: {
          center_id: string
          client_id: string | null
          cost: number | null
          course_id: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          service_id: string | null
          session_id: string | null
          used_by: string | null
        }
        Insert: {
          center_id: string
          client_id?: string | null
          cost?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          service_id?: string | null
          session_id?: string | null
          used_by?: string | null
        }
        Update: {
          center_id?: string
          client_id?: string | null
          cost?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          service_id?: string | null
          session_id?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_product_usage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_product_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_promo_codes: {
        Row: {
          center_id: string
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          center_id: string
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          center_id?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_promo_codes_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_referrals: {
        Row: {
          bonus_amount: number
          bonus_status: string
          center_id: string
          created_at: string
          id: string
          notes: string | null
          referral_code: string
          referred_client_id: string | null
          referrer_client_id: string | null
        }
        Insert: {
          bonus_amount?: number
          bonus_status?: string
          center_id: string
          created_at?: string
          id?: string
          notes?: string | null
          referral_code: string
          referred_client_id?: string | null
          referrer_client_id?: string | null
        }
        Update: {
          bonus_amount?: number
          bonus_status?: string
          center_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          referral_code?: string
          referred_client_id?: string | null
          referrer_client_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_referrals_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_referrals_referred_client_id_fkey"
            columns: ["referred_client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_referrals_referrer_client_id_fkey"
            columns: ["referrer_client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_services: {
        Row: {
          category: string | null
          center_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          category?: string | null
          center_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          category?: string | null
          center_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_services_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_staff: {
        Row: {
          avatar_url: string | null
          center_id: string
          commission_percent: number | null
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          is_active: boolean | null
          notes: string | null
          phone: string | null
          role: string
          salary: number | null
          schedule: string | null
          specialization: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          center_id: string
          commission_percent?: number | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string
          salary?: number | null
          schedule?: string | null
          specialization?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          center_id?: string
          commission_percent?: number | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string
          salary?: number | null
          schedule?: string | null
          specialization?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_staff_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_staff_payouts: {
        Row: {
          amount: number
          center_id: string
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          payout_type: string
          period_end: string | null
          period_start: string | null
          staff_id: string
        }
        Insert: {
          amount?: number
          center_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payout_type?: string
          period_end?: string | null
          period_start?: string | null
          staff_id: string
        }
        Update: {
          amount?: number
          center_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payout_type?: string
          period_end?: string | null
          period_start?: string | null
          staff_id?: string
        }
        Relationships: []
      }
      cosmetology_staff_ratings: {
        Row: {
          center_id: string
          client_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          staff_id: string
        }
        Insert: {
          center_id: string
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          staff_id: string
        }
        Update: {
          center_id?: string
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          staff_id?: string
        }
        Relationships: []
      }
      cosmetology_staff_schedule: {
        Row: {
          center_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_off: boolean
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_off?: boolean
          staff_id: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_off?: boolean
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      cosmetology_staff_services: {
        Row: {
          center_id: string
          created_at: string
          duration_minutes: number
          id: string
          price: number
          service_name: string
          staff_id: string
        }
        Insert: {
          center_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_name: string
          staff_id: string
        }
        Update: {
          center_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_name?: string
          staff_id?: string
        }
        Relationships: []
      }
      cosmetology_stock_movements: {
        Row: {
          center_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
        }
        Insert: {
          center_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_transactions: {
        Row: {
          amount: number
          category: string
          center_id: string
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          invoice_number: string | null
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_date: string
          type: string
        }
        Insert: {
          amount?: number
          category?: string
          center_id: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_date?: string
          type?: string
        }
        Update: {
          amount?: number
          category?: string
          center_id?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_transactions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetology_treatment_courses: {
        Row: {
          center_id: string
          client_id: string
          completed_sessions: number | null
          course_name: string
          created_at: string
          expected_end_date: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          service_type: string | null
          staff_name: string | null
          start_date: string | null
          status: string
          total_price: number | null
          total_sessions: number
          updated_at: string
        }
        Insert: {
          center_id: string
          client_id: string
          completed_sessions?: number | null
          course_name: string
          created_at?: string
          expected_end_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          service_type?: string | null
          staff_name?: string | null
          start_date?: string | null
          status?: string
          total_price?: number | null
          total_sessions?: number
          updated_at?: string
        }
        Update: {
          center_id?: string
          client_id?: string
          completed_sessions?: number | null
          course_name?: string
          created_at?: string
          expected_end_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          service_type?: string | null
          staff_name?: string | null
          start_date?: string | null
          status?: string
          total_price?: number | null
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetology_treatment_courses_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_cosmetology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetology_treatment_courses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cosmetology_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_history: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          service_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          service_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          service_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      dental_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at: string
          doctor_name: string | null
          id: string
          notes: string | null
          patient_id: string
          service_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at?: string
          doctor_name?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          clinic_id?: string
          created_at?: string
          doctor_name?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "dental_services"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_complaints: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          issue: string
          patient_id: string | null
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          issue: string
          patient_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          issue?: string
          patient_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_complaints_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_complaints_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_equipment: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          room: string | null
          serial_number: string | null
          status: string
          type: string
          updated_at: string
          warranty_end: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          room?: string | null
          serial_number?: string | null
          status?: string
          type?: string
          updated_at?: string
          warranty_end?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          room?: string | null
          serial_number?: string | null
          status?: string
          type?: string
          updated_at?: string
          warranty_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_equipment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_equipment_maintenance: {
        Row: {
          clinic_id: string
          cost: number | null
          created_at: string
          equipment_id: string
          id: string
          next_service_date: string | null
          notes: string | null
          service_date: string
          service_type: string
          technician_name: string | null
        }
        Insert: {
          clinic_id: string
          cost?: number | null
          created_at?: string
          equipment_id: string
          id?: string
          next_service_date?: string | null
          notes?: string | null
          service_date?: string
          service_type?: string
          technician_name?: string | null
        }
        Update: {
          clinic_id?: string
          cost?: number | null
          created_at?: string
          equipment_id?: string
          id?: string
          next_service_date?: string | null
          notes?: string | null
          service_date?: string
          service_type?: string
          technician_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_equipment_maintenance_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "dental_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_expenses: {
        Row: {
          amount: number
          category: string
          clinic_id: string
          created_at: string
          description: string
          expense_date: string
          id: string
        }
        Insert: {
          amount?: number
          category?: string
          clinic_id: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          clinic_id?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_expenses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_feedback: {
        Row: {
          clinic_id: string
          comment: string | null
          created_at: string | null
          doctor_name: string | null
          id: string
          patient_id: string | null
          rating: number
          replied_at: string | null
          reply: string | null
          service_type: string | null
          status: string | null
        }
        Insert: {
          clinic_id: string
          comment?: string | null
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          patient_id?: string | null
          rating: number
          replied_at?: string | null
          reply?: string | null
          service_type?: string | null
          status?: string | null
        }
        Update: {
          clinic_id?: string
          comment?: string | null
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          patient_id?: string | null
          rating?: number
          replied_at?: string | null
          reply?: string | null
          service_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_feedback_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_files: {
        Row: {
          category: string
          clinic_id: string
          created_at: string
          file_name: string
          file_size: string | null
          file_url: string
          id: string
          module: string
          patient_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          clinic_id: string
          created_at?: string
          file_name: string
          file_size?: string | null
          file_url: string
          id?: string
          module?: string
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          clinic_id?: string
          created_at?: string
          file_name?: string
          file_size?: string | null
          file_url?: string
          id?: string
          module?: string
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_inventory: {
        Row: {
          batch_number: string | null
          category: string
          clinic_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          location: string | null
          min_quantity: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          quantity: number
          sell_price: number | null
          sku: string | null
          status: string | null
          supplier: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          category?: string
          clinic_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          sku?: string | null
          status?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          category?: string
          clinic_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          sku?: string | null
          status?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_inventory_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_inventory_usage: {
        Row: {
          clinic_id: string
          created_at: string | null
          doctor_name: string | null
          id: string
          inventory_id: string
          notes: string | null
          patient_id: string | null
          quantity_used: number
          treatment_type: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          patient_id?: string | null
          quantity_used?: number
          treatment_type?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          patient_id?: string | null
          quantity_used?: number
          treatment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_inventory_usage_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_inventory_usage_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "dental_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_inventory_usage_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_lab_orders: {
        Row: {
          clinic_id: string
          completed_at: string | null
          created_at: string
          doctor_name: string | null
          due_date: string | null
          external_lab: string | null
          id: string
          notes: string | null
          patient_id: string
          price: number | null
          status: string
          technician_name: string | null
          tooth_number: number | null
          updated_at: string
          work_type: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          doctor_name?: string | null
          due_date?: string | null
          external_lab?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          price?: number | null
          status?: string
          technician_name?: string | null
          tooth_number?: number | null
          updated_at?: string
          work_type: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          doctor_name?: string | null
          due_date?: string | null
          external_lab?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          price?: number | null
          status?: string
          technician_name?: string | null
          tooth_number?: number | null
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_lab_orders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_patients: {
        Row: {
          allergies: string | null
          clinic_id: string
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string
          tooth_chart: Json | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          clinic_id: string
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone: string
          tooth_chart?: Json | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          clinic_id?: string
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string
          tooth_chart?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_plan_payments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          plan_id: string
        }
        Insert: {
          amount?: number
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          plan_id: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_plan_payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_plan_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "dental_treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_reminders: {
        Row: {
          channel: string | null
          clinic_id: string
          created_at: string | null
          doctor_name: string | null
          id: string
          message: string | null
          patient_id: string
          reminder_date: string
          reminder_type: string
          repeat_interval: string | null
          sent_at: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          channel?: string | null
          clinic_id: string
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          message?: string | null
          patient_id: string
          reminder_date: string
          reminder_type?: string
          repeat_interval?: string | null
          sent_at?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string | null
          clinic_id?: string
          created_at?: string | null
          doctor_name?: string | null
          id?: string
          message?: string | null
          patient_id?: string
          reminder_date?: string
          reminder_type?: string
          repeat_interval?: string | null
          sent_at?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_reminders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_services: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_split_payments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string | null
          payment_method: string
          transaction_id: string
        }
        Insert: {
          amount?: number
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_split_payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_split_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_split_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "dental_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_staff: {
        Row: {
          avatar_url: string | null
          clinic_id: string
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          rating: number | null
          specialty: string
          status: string
          updated_at: string
          working_hours: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string
          rating?: number | null
          specialty?: string
          status?: string
          updated_at?: string
          working_hours?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          rating?: number | null
          specialty?: string
          status?: string
          updated_at?: string
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_transactions: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          invoice_number: string | null
          items: Json | null
          notes: string | null
          paid_amount: number
          patient_id: string | null
          payment_method: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          paid_amount?: number
          patient_id?: string | null
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          paid_amount?: number
          patient_id?: string | null
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_treatment_plans: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_name: string | null
          id: string
          notes: string | null
          paid_amount: number
          patient_id: string
          plan_name: string
          status: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_name?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          patient_id: string
          plan_name: string
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_name?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string
          plan_name?: string
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_treatment_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_treatment_steps: {
        Row: {
          clinic_id: string
          completed_at: string | null
          cost: number
          created_at: string
          doctor_name: string | null
          id: string
          name: string
          notes: string | null
          plan_id: string
          status: string
          step_order: number
          tooth_number: number | null
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          cost?: number
          created_at?: string
          doctor_name?: string | null
          id?: string
          name: string
          notes?: string | null
          plan_id: string
          status?: string
          step_order?: number
          tooth_number?: number | null
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          cost?: number
          created_at?: string
          doctor_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          plan_id?: string
          status?: string
          step_order?: number
          tooth_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_treatment_steps_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_treatment_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "dental_treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_treatments: {
        Row: {
          clinic_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          patient_id: string
          price: number | null
          status: string | null
          tooth_number: number | null
          treatment_type: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          patient_id: string
          price?: number | null
          status?: string | null
          tooth_number?: number | null
          treatment_type: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          patient_id?: string
          price?: number | null
          status?: string | null
          tooth_number?: number | null
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "dental_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appt_source: string | null
          center_id: string
          created_at: string
          created_by: string | null
          duration_min: number | null
          id: string
          notes: string | null
          order_id: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string
          referral_id: string | null
          service_id: string | null
          service_name: string | null
          staff_id: string | null
          staff_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appt_source?: string | null
          center_id: string
          created_at?: string
          created_by?: string | null
          duration_min?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone: string
          referral_id?: string | null
          service_id?: string | null
          service_name?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appt_source?: string | null
          center_id?: string
          created_at?: string
          created_by?: string | null
          duration_min?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string
          referral_id?: string | null
          service_id?: string | null
          service_name?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_appointments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_services"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_expenses: {
        Row: {
          amount: number
          category: string
          center_id: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category?: string
          center_id: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      diagnostics_inventory: {
        Row: {
          category: string | null
          center_id: string
          created_at: string
          expiry_date: string | null
          id: string
          min_quantity: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          quantity: number | null
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          center_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          min_quantity?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          center_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          min_quantity?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_inventory_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_lab_orders: {
        Row: {
          accepted_at: string | null
          approval_note: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_staff_id: string | null
          center_id: string
          completed_at: string | null
          created_at: string
          doctor_name: string | null
          doctor_phone: string | null
          expected_completion_at: string | null
          id: string
          notes: string | null
          order_number: string | null
          order_type: string | null
          patient_id: string
          payment_status: string | null
          priority: string | null
          service_id: string | null
          started_at: string | null
          status: string
          template_id: string | null
          test_name: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          approval_note?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_staff_id?: string | null
          center_id: string
          completed_at?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          expected_completion_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          order_type?: string | null
          patient_id: string
          payment_status?: string | null
          priority?: string | null
          service_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          test_name?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          approval_note?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_staff_id?: string | null
          center_id?: string
          completed_at?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          expected_completion_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          order_type?: string | null
          patient_id?: string
          payment_status?: string | null
          priority?: string | null
          service_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          test_name?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_lab_orders_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_lab_orders_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_lab_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_lab_orders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_test_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_lab_results: {
        Row: {
          center_id: string
          created_at: string
          id: string
          notes: string | null
          order_id: string
          parameter_name: string
          reference_max: string | null
          reference_min: string | null
          status: string | null
          unit: string | null
          value: string | null
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          parameter_name: string
          reference_max?: string | null
          reference_min?: string | null
          status?: string | null
          unit?: string | null
          value?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          parameter_name?: string
          reference_max?: string | null
          reference_min?: string | null
          status?: string | null
          unit?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_lab_results_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_lab_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_notifications: {
        Row: {
          body: string | null
          center_id: string
          created_at: string
          id: string
          is_read: boolean | null
          related_order_id: string | null
          staff_id: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          center_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          related_order_id?: string | null
          staff_id?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          center_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          related_order_id?: string | null
          staff_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_notifications_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_notifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_patients: {
        Row: {
          address: string | null
          blood_group: string | null
          center_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          center_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          center_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_patients_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_photos: {
        Row: {
          caption: string | null
          center_id: string
          created_at: string
          id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          center_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          center_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_photos_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_preset_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          parameters: Json
          preset_key: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parameters: Json
          preset_key: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parameters?: Json
          preset_key?: string
        }
        Relationships: []
      }
      diagnostics_qc_runs: {
        Row: {
          clinic_id: string
          control_level: string | null
          created_at: string
          deviation_percent: number | null
          expected_value: number | null
          id: string
          instrument: string | null
          measured_value: number | null
          notes: string | null
          performed_by: string | null
          qc_date: string
          reagent_lot: string | null
          status: string
          test_name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          control_level?: string | null
          created_at?: string
          deviation_percent?: number | null
          expected_value?: number | null
          id?: string
          instrument?: string | null
          measured_value?: number | null
          notes?: string | null
          performed_by?: string | null
          qc_date?: string
          reagent_lot?: string | null
          status?: string
          test_name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          control_level?: string | null
          created_at?: string
          deviation_percent?: number | null
          expected_value?: number | null
          id?: string
          instrument?: string | null
          measured_value?: number | null
          notes?: string | null
          performed_by?: string | null
          qc_date?: string
          reagent_lot?: string | null
          status?: string
          test_name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diagnostics_radiology_studies: {
        Row: {
          body_part: string | null
          center_id: string
          created_at: string
          findings: string | null
          id: string
          image_urls: string[] | null
          impression: string | null
          modality: string
          order_id: string
          patient_id: string
          radiologist_name: string | null
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body_part?: string | null
          center_id: string
          created_at?: string
          findings?: string | null
          id?: string
          image_urls?: string[] | null
          impression?: string | null
          modality?: string
          order_id: string
          patient_id: string
          radiologist_name?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body_part?: string | null
          center_id?: string
          created_at?: string
          findings?: string | null
          id?: string
          image_urls?: string[] | null
          impression?: string | null
          modality?: string
          order_id?: string
          patient_id?: string
          radiologist_name?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_radiology_studies_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_radiology_studies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_radiology_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_services"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_referrals: {
        Row: {
          appointment_id: string | null
          center_id: string
          created_at: string
          created_by: string | null
          diagnosis: string | null
          direction: string
          from_clinic_name: string | null
          from_doctor_name: string | null
          icd10_code: string | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          reason: string | null
          status: string | null
          to_doctor_name: string | null
          to_service_id: string | null
          to_service_name: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          center_id: string
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          direction: string
          from_clinic_name?: string | null
          from_doctor_name?: string | null
          icd10_code?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          reason?: string | null
          status?: string | null
          to_doctor_name?: string | null
          to_service_id?: string | null
          to_service_name?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          center_id?: string
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          direction?: string
          from_clinic_name?: string | null
          from_doctor_name?: string | null
          icd10_code?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          reason?: string | null
          status?: string | null
          to_doctor_name?: string | null
          to_service_id?: string | null
          to_service_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_referrals_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_result_approvals: {
        Row: {
          approver_id: string | null
          approver_name: string | null
          clinic_id: string
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          approver_id?: string | null
          approver_name?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          approver_id?: string | null
          approver_name?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: []
      }
      diagnostics_samples: {
        Row: {
          assigned_to: string | null
          center_id: string
          collected_at: string | null
          collected_by: string | null
          completed_at: string | null
          container: string | null
          created_at: string
          current_location: string | null
          id: string
          notes: string | null
          order_id: string
          patient_id: string
          processed_at: string | null
          received_at: string | null
          sample_code: string
          sample_type: string
          status: string
          updated_at: string
          volume: string | null
        }
        Insert: {
          assigned_to?: string | null
          center_id: string
          collected_at?: string | null
          collected_by?: string | null
          completed_at?: string | null
          container?: string | null
          created_at?: string
          current_location?: string | null
          id?: string
          notes?: string | null
          order_id: string
          patient_id: string
          processed_at?: string | null
          received_at?: string | null
          sample_code: string
          sample_type?: string
          status?: string
          updated_at?: string
          volume?: string | null
        }
        Update: {
          assigned_to?: string | null
          center_id?: string
          collected_at?: string | null
          collected_by?: string | null
          completed_at?: string | null
          container?: string | null
          created_at?: string
          current_location?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          patient_id?: string
          processed_at?: string | null
          received_at?: string | null
          sample_code?: string
          sample_type?: string
          status?: string
          updated_at?: string
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_samples_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_samples_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_service_packages: {
        Row: {
          center_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          package_price: number
          service_ids: string[]
          total_price: number
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          package_price?: number
          service_ids?: string[]
          total_price?: number
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          package_price?: number
          service_ids?: string[]
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      diagnostics_services: {
        Row: {
          category: string
          center_id: string
          created_at: string
          description: string | null
          discount_price: number | null
          duration_minutes: number | null
          id: string
          image_required: boolean | null
          is_active: boolean | null
          name: string
          preparation_info: string | null
          price: number
          service_code: string | null
          service_type: string
          template_id: string | null
          turnaround_hours: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          center_id: string
          created_at?: string
          description?: string | null
          discount_price?: number | null
          duration_minutes?: number | null
          id?: string
          image_required?: boolean | null
          is_active?: boolean | null
          name: string
          preparation_info?: string | null
          price?: number
          service_code?: string | null
          service_type?: string
          template_id?: string | null
          turnaround_hours?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          center_id?: string
          created_at?: string
          description?: string | null
          discount_price?: number | null
          duration_minutes?: number | null
          id?: string
          image_required?: boolean | null
          is_active?: boolean | null
          name?: string
          preparation_info?: string | null
          price?: number
          service_code?: string | null
          service_type?: string
          template_id?: string | null
          turnaround_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_services_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_services_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_test_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_settings: {
        Row: {
          address: string | null
          ai_settings: Json | null
          center_id: string
          created_at: string
          currency: string | null
          date_format: string | null
          display_name: string | null
          email: string | null
          file_settings: Json | null
          id: string
          lab_settings: Json | null
          language: string | null
          logo_url: string | null
          notification_settings: Json | null
          payment_settings: Json | null
          phone: string | null
          radiology_settings: Json | null
          report_settings: Json | null
          security_settings: Json | null
          service_settings: Json | null
          timezone: string | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          ai_settings?: Json | null
          center_id: string
          created_at?: string
          currency?: string | null
          date_format?: string | null
          display_name?: string | null
          email?: string | null
          file_settings?: Json | null
          id?: string
          lab_settings?: Json | null
          language?: string | null
          logo_url?: string | null
          notification_settings?: Json | null
          payment_settings?: Json | null
          phone?: string | null
          radiology_settings?: Json | null
          report_settings?: Json | null
          security_settings?: Json | null
          service_settings?: Json | null
          timezone?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          ai_settings?: Json | null
          center_id?: string
          created_at?: string
          currency?: string | null
          date_format?: string | null
          display_name?: string | null
          email?: string | null
          file_settings?: Json | null
          id?: string
          lab_settings?: Json | null
          language?: string | null
          logo_url?: string | null
          notification_settings?: Json | null
          payment_settings?: Json | null
          phone?: string | null
          radiology_settings?: Json | null
          report_settings?: Json | null
          security_settings?: Json | null
          service_settings?: Json | null
          timezone?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_settings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: true
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_sops: {
        Row: {
          category: string
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          steps: Json
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      diagnostics_staff: {
        Row: {
          avatar_url: string | null
          center_id: string
          created_at: string
          department: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_on_duty: boolean | null
          notes: string | null
          phone: string | null
          role: string | null
          schedule_type: string | null
          specialization: string | null
        }
        Insert: {
          avatar_url?: string | null
          center_id: string
          created_at?: string
          department?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_on_duty?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          schedule_type?: string | null
          specialization?: string | null
        }
        Update: {
          avatar_url?: string | null
          center_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_on_duty?: boolean | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          schedule_type?: string | null
          specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_staff_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_staff_schedules: {
        Row: {
          center_id: string
          created_at: string
          id: string
          is_day_off: boolean | null
          notes: string | null
          shift_end: string | null
          shift_start: string | null
          shift_type: string | null
          staff_id: string
          updated_at: string
          work_date: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          is_day_off?: boolean | null
          notes?: string | null
          shift_end?: string | null
          shift_start?: string | null
          shift_type?: string | null
          staff_id: string
          updated_at?: string
          work_date: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          is_day_off?: boolean | null
          notes?: string | null
          shift_end?: string | null
          shift_start?: string | null
          shift_type?: string | null
          staff_id?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_staff_schedules_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_test_templates: {
        Row: {
          category: string | null
          center_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_preset: boolean | null
          name: string
          parameters: Json
          preset_key: string | null
        }
        Insert: {
          category?: string | null
          center_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_preset?: boolean | null
          name: string
          parameters?: Json
          preset_key?: string | null
        }
        Update: {
          category?: string | null
          center_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_preset?: boolean | null
          name?: string
          parameters?: Json
          preset_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_test_templates_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics_transactions: {
        Row: {
          amount: number
          center_id: string
          created_at: string
          description: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          order_id: string | null
          paid_at: string | null
          patient_id: string | null
          payment_method: string | null
          status: string | null
          transaction_type: string | null
        }
        Insert: {
          amount?: number
          center_id: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_type?: string | null
        }
        Update: {
          amount?: number
          center_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_transactions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          device_type: string | null
          doctor_id: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          device_type?: string | null
          doctor_id: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          device_type?: string | null
          doctor_id?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      doctor_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          doctor_id: string
          expense_date: string
          id: string
          payment_method: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          doctor_id: string
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          doctor_id?: string
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
        }
        Relationships: []
      }
      doctor_files: {
        Row: {
          category: string | null
          created_at: string
          doctor_id: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          notes: string | null
          patient_id: string
          taken_date: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          doctor_id: string
          file_name: string
          file_type?: string
          file_url: string
          id?: string
          notes?: string | null
          patient_id: string
          taken_date?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          doctor_id?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          patient_id?: string
          taken_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_files_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_invoices: {
        Row: {
          created_at: string
          description: string | null
          discount: number
          doctor_id: string
          due_date: string | null
          id: string
          invoice_number: string | null
          items: Json | null
          notes: string | null
          paid_amount: number
          paid_at: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          payment_method: string | null
          service_type: string
          status: string
          subtotal: number
          tax: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount?: number
          doctor_id: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          payment_method?: string | null
          service_type?: string
          status?: string
          subtotal?: number
          tax?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount?: number
          doctor_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          payment_method?: string | null
          service_type?: string
          status?: string
          subtotal?: number
          tax?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      doctor_lab_orders: {
        Row: {
          clinical_info: string | null
          completed_at: string | null
          created_at: string
          diag_center_id: string | null
          doctor_id: string
          id: string
          ordered_at: string
          patient_id: string
          result_notes: string | null
          result_url: string | null
          status: string
          test_types: string[]
          updated_at: string
          urgency: string
        }
        Insert: {
          clinical_info?: string | null
          completed_at?: string | null
          created_at?: string
          diag_center_id?: string | null
          doctor_id: string
          id?: string
          ordered_at?: string
          patient_id: string
          result_notes?: string | null
          result_url?: string | null
          status?: string
          test_types?: string[]
          updated_at?: string
          urgency?: string
        }
        Update: {
          clinical_info?: string | null
          completed_at?: string | null
          created_at?: string
          diag_center_id?: string | null
          doctor_id?: string
          id?: string
          ordered_at?: string
          patient_id?: string
          result_notes?: string | null
          result_url?: string | null
          status?: string
          test_types?: string[]
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_lab_orders_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_leads: {
        Row: {
          created_at: string
          doctor_id: string
          full_name: string
          id: string
          message: string | null
          phone: string
          reply: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          reply?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          reply?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_leads_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_patients: {
        Row: {
          allergies: string | null
          appointment_id: string | null
          blood_group: string | null
          chronic_conditions: string | null
          created_at: string
          date_of_birth: string | null
          doctor_id: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          last_visit_date: string | null
          notes: string | null
          patient_user_id: string | null
          phone: string
          source: string
          total_lab_orders: number
          total_prescriptions: number
          total_records: number
          total_visits: number
          updated_at: string
          visit_count: number | null
        }
        Insert: {
          allergies?: string | null
          appointment_id?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          doctor_id: string
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_visit_date?: string | null
          notes?: string | null
          patient_user_id?: string | null
          phone: string
          source?: string
          total_lab_orders?: number
          total_prescriptions?: number
          total_records?: number
          total_visits?: number
          updated_at?: string
          visit_count?: number | null
        }
        Update: {
          allergies?: string | null
          appointment_id?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          doctor_id?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_visit_date?: string | null
          notes?: string | null
          patient_user_id?: string | null
          phone?: string
          source?: string
          total_lab_orders?: number
          total_prescriptions?: number
          total_records?: number
          total_visits?: number
          updated_at?: string
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_posts: {
        Row: {
          content: string | null
          created_at: string
          doctor_id: string
          id: string
          is_published: boolean
          media_type: string
          media_url: string | null
          post_type: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          is_published?: boolean
          media_type?: string
          media_url?: string | null
          post_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          is_published?: boolean
          media_type?: string
          media_url?: string | null
          post_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_posts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_prescriptions: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string
          general_instructions: string | null
          icd_code: string | null
          id: string
          medications: Json
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          prescription_date: string
          rx_number: string | null
          status: string
          updated_at: string
          valid_until: string | null
          warnings: string | null
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          general_instructions?: string | null
          icd_code?: string | null
          id?: string
          medications?: Json
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          prescription_date?: string
          rx_number?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
          warnings?: string | null
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          general_instructions?: string | null
          icd_code?: string | null
          id?: string
          medications?: Json
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          prescription_date?: string
          rx_number?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
          warnings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profile_views: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          is_click: boolean
          source: string | null
          view_date: string
          visitor_hash: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          is_click?: boolean
          source?: string | null
          view_date?: string
          visitor_hash?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          is_click?: boolean
          source?: string | null
          view_date?: string
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profile_views_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_promos: {
        Row: {
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          doctor_id: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          doctor_id: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          doctor_id?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_promos_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_records: {
        Row: {
          created_at: string
          diagnosis: string
          doctor_id: string
          icd_code: string | null
          id: string
          notes: string | null
          patient_id: string
          record_date: string
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis: string
          doctor_id: string
          icd_code?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          record_date?: string
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string
          doctor_id?: string
          icd_code?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          record_date?: string
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_telemed_sessions: {
        Row: {
          actual_duration_minutes: number | null
          chief_complaint: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string
          doctor_notes: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          invoice_id: string | null
          meeting_provider: string | null
          meeting_url: string | null
          patient_age: number | null
          patient_feedback: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          patient_rating: number | null
          payment_status: string | null
          plan_id: string | null
          prescription_id: string | null
          recommendations: string | null
          recording_url: string | null
          room_id: string | null
          scheduled_at: string
          started_at: string | null
          status: string
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          chief_complaint?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          doctor_notes?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          invoice_id?: string | null
          meeting_provider?: string | null
          meeting_url?: string | null
          patient_age?: number | null
          patient_feedback?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          patient_rating?: number | null
          payment_status?: string | null
          plan_id?: string | null
          prescription_id?: string | null
          recommendations?: string | null
          recording_url?: string | null
          room_id?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: string
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          chief_complaint?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          doctor_notes?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          invoice_id?: string | null
          meeting_provider?: string | null
          meeting_url?: string | null
          patient_age?: number | null
          patient_feedback?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          patient_rating?: number | null
          payment_status?: string | null
          plan_id?: string | null
          prescription_id?: string | null
          recommendations?: string | null
          recording_url?: string | null
          room_id?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_treatment_plans: {
        Row: {
          created_at: string
          description: string | null
          diagnosis: string
          doctor_id: string
          expected_end_date: string | null
          id: string
          notes: string | null
          patient_id: string
          progress_percent: number | null
          start_date: string | null
          status: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          diagnosis: string
          doctor_id: string
          expected_end_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          progress_percent?: number | null
          start_date?: string | null
          status?: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          diagnosis?: string
          doctor_id?: string
          expected_end_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          progress_percent?: number | null
          start_date?: string | null
          status?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_treatment_plans_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string | null
          avg_rating: number | null
          bio: string | null
          certificates: string[] | null
          city: string | null
          clinic_id: string | null
          consultation_price: number | null
          created_at: string
          education: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          is_active: boolean | null
          languages: string[] | null
          online_consultation: boolean | null
          phone: string | null
          photo_url: string | null
          region: string | null
          review_count: number | null
          schedule: Json | null
          social_links: Json | null
          specialty: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avg_rating?: number | null
          bio?: string | null
          certificates?: string[] | null
          city?: string | null
          clinic_id?: string | null
          consultation_price?: number | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          online_consultation?: boolean | null
          phone?: string | null
          photo_url?: string | null
          region?: string | null
          review_count?: number | null
          schedule?: Json | null
          social_links?: Json | null
          specialty: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avg_rating?: number | null
          bio?: string | null
          certificates?: string[] | null
          city?: string | null
          clinic_id?: string | null
          consultation_price?: number | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          online_consultation?: boolean | null
          phone?: string | null
          photo_url?: string | null
          region?: string | null
          review_count?: number | null
          schedule?: Json | null
          social_links?: Json | null
          specialty?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      document_verifications: {
        Row: {
          clinic_id: string | null
          created_at: string
          document_date: string | null
          document_id: string
          document_type: string
          id: string
          metadata: Json | null
          patient_name: string | null
          scanned_count: number | null
          status: string
          verification_code: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          document_date?: string | null
          document_id: string
          document_type?: string
          id?: string
          metadata?: Json | null
          patient_name?: string | null
          scanned_count?: number | null
          status?: string
          verification_code?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          document_date?: string | null
          document_id?: string
          document_type?: string
          id?: string
          metadata?: Json | null
          patient_name?: string | null
          scanned_count?: number | null
          status?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          chronic_conditions: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          relationship?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_clinics: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_creative_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_fallback: boolean
          language: string
          notes: string | null
          priority: number
          template: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_fallback?: boolean
          language?: string
          notes?: string | null
          priority?: number
          template: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_fallback?: boolean
          language?: string
          notes?: string | null
          priority?: number
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
      geo_notifications: {
        Row: {
          channel: string
          clinic_id: string | null
          converted: boolean
          distance_m: number | null
          id: string
          lat: number | null
          lng: number | null
          message: string | null
          opened: boolean
          promo_id: string | null
          sent_at: string
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          channel?: string
          clinic_id?: string | null
          converted?: boolean
          distance_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          opened?: boolean
          promo_id?: string | null
          sent_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          channel?: string
          clinic_id?: string | null
          converted?: boolean
          distance_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          opened?: boolean
          promo_id?: string | null
          sent_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geo_notifications_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_notifications_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "geofence_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_zones: {
        Row: {
          active_hours: Json | null
          center_lat: number
          center_lng: number
          clinic_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          promo_id: string | null
          radius_m: number
          updated_at: string
        }
        Insert: {
          active_hours?: Json | null
          center_lat: number
          center_lng: number
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          promo_id?: string | null
          radius_m?: number
          updated_at?: string
        }
        Update: {
          active_hours?: Json | null
          center_lat?: number
          center_lng?: number
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          promo_id?: string | null
          radius_m?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_zones_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          created_at: string
          id: string
          note: string | null
          record_type: string
          recorded_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          record_type: string
          recorded_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          record_type?: string
          recorded_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      hms_announcements: {
        Row: {
          clinic_id: string
          content: string | null
          created_at: string
          id: string
          is_active: boolean | null
          priority: string | null
          target_role: string | null
          title: string
        }
        Insert: {
          clinic_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: string | null
          target_role?: string | null
          title: string
        }
        Update: {
          clinic_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: string | null
          target_role?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_announcements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_announcements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_attendance: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_in_distance_m: number | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_out: string | null
          check_out_distance_m: number | null
          check_out_lat: number | null
          check_out_lng: number | null
          clinic_id: string
          created_at: string
          device_info: string | null
          id: string
          is_late: boolean | null
          late_minutes: number | null
          notes: string | null
          qr_token_id: string | null
          staff_id: string
          status: string | null
          suspicious: boolean | null
          worked_minutes: number | null
        }
        Insert: {
          attendance_date?: string
          check_in?: string | null
          check_in_distance_m?: number | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out?: string | null
          check_out_distance_m?: number | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          clinic_id: string
          created_at?: string
          device_info?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          qr_token_id?: string | null
          staff_id: string
          status?: string | null
          suspicious?: boolean | null
          worked_minutes?: number | null
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_in_distance_m?: number | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out?: string | null
          check_out_distance_m?: number | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          clinic_id?: string
          created_at?: string
          device_info?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          qr_token_id?: string | null
          staff_id?: string
          status?: string | null
          suspicious?: boolean | null
          worked_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_attendance_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_attendance_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_attendance_qr_tokens: {
        Row: {
          clinic_id: string
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          token: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          token: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_attendance_qr_tokens_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_attendance_qr_tokens_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_attendance_settings: {
        Row: {
          clinic_id: string
          created_at: string
          enforce_geo: boolean
          enforce_qr: boolean
          id: string
          late_threshold_min: number
          location_lat: number | null
          location_lng: number | null
          qr_rotate_seconds: number
          radius_m: number
          updated_at: string
          work_end: string
          work_start: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          enforce_geo?: boolean
          enforce_qr?: boolean
          id?: string
          late_threshold_min?: number
          location_lat?: number | null
          location_lng?: number | null
          qr_rotate_seconds?: number
          radius_m?: number
          updated_at?: string
          work_end?: string
          work_start?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          enforce_geo?: boolean
          enforce_qr?: boolean
          id?: string
          late_threshold_min?: number
          location_lat?: number | null
          location_lng?: number | null
          qr_rotate_seconds?: number
          radius_m?: number
          updated_at?: string
          work_end?: string
          work_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_attendance_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_attendance_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_beds: {
        Row: {
          admitted_at: string | null
          bed_number: string
          bed_type: string | null
          clinic_id: string
          created_at: string
          daily_rate: number | null
          department_id: string | null
          expected_discharge: string | null
          floor: string | null
          id: string
          notes: string | null
          patient_id: string | null
          room_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admitted_at?: string | null
          bed_number: string
          bed_type?: string | null
          clinic_id: string
          created_at?: string
          daily_rate?: number | null
          department_id?: string | null
          expected_discharge?: string | null
          floor?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          room_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admitted_at?: string | null
          bed_number?: string
          bed_type?: string | null
          clinic_id?: string
          created_at?: string
          daily_rate?: number | null
          department_id?: string | null
          expected_discharge?: string | null
          floor?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          room_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_beds_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_beds_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_beds_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hms_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_beds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_complaints: {
        Row: {
          clinic_id: string
          complaint_type: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          patient_name: string
          patient_phone: string | null
          rating: number | null
          resolution: string | null
          resolved_at: string | null
          severity: string | null
          staff_id: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          complaint_type?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          patient_name?: string
          patient_phone?: string | null
          rating?: number | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          staff_id?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          complaint_type?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          patient_name?: string
          patient_phone?: string | null
          rating?: number | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          staff_id?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_complaints_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_complaints_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_complaints_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hms_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_complaints_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_departments: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          floor: string | null
          head_staff_id: string | null
          id: string
          is_active: boolean | null
          name: string
          room_count: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          floor?: string | null
          head_staff_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          room_count?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          floor?: string | null
          head_staff_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          room_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_departments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_departments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_departments_head_staff_id_fkey"
            columns: ["head_staff_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_donors: {
        Row: {
          blood_group: string
          clinic_id: string
          created_at: string
          date_of_birth: string | null
          donation_count: number | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          last_donation_date: string | null
          notes: string | null
          phone: string
          rh_factor: string | null
          updated_at: string
        }
        Insert: {
          blood_group: string
          clinic_id: string
          created_at?: string
          date_of_birth?: string | null
          donation_count?: number | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_donation_date?: string | null
          notes?: string | null
          phone: string
          rh_factor?: string | null
          updated_at?: string
        }
        Update: {
          blood_group?: string
          clinic_id?: string
          created_at?: string
          date_of_birth?: string | null
          donation_count?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_donation_date?: string | null
          notes?: string | null
          phone?: string
          rh_factor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_donors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_donors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_emergency: {
        Row: {
          ambulance_dispatched: boolean | null
          ambulance_plate: string | null
          arrival_time: string | null
          assigned_doctor_id: string | null
          clinic_id: string
          created_at: string
          description: string | null
          emergency_type: string | null
          id: string
          location: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          resolution: string | null
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ambulance_dispatched?: boolean | null
          ambulance_plate?: string | null
          arrival_time?: string | null
          assigned_doctor_id?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          emergency_type?: string | null
          id?: string
          location?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          resolution?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ambulance_dispatched?: boolean | null
          ambulance_plate?: string | null
          arrival_time?: string | null
          assigned_doctor_id?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          emergency_type?: string | null
          id?: string
          location?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          resolution?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_emergency_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_emergency_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_emergency_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_emergency_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_equipment: {
        Row: {
          category: string | null
          clinic_id: string
          condition: string | null
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean | null
          last_maintenance: string | null
          location: string | null
          maintenance_notes: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string | null
          updated_at: string
          warranty_until: string | null
        }
        Insert: {
          category?: string | null
          clinic_id: string
          condition?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          last_maintenance?: string | null
          location?: string | null
          maintenance_notes?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          warranty_until?: string | null
        }
        Update: {
          category?: string | null
          clinic_id?: string
          condition?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          last_maintenance?: string | null
          location?: string | null
          maintenance_notes?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_equipment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_equipment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hms_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_files: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_finance: {
        Row: {
          amount: number
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          recorded_by: string | null
          reference_id: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          reference_id?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Update: {
          amount?: number
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          reference_id?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_finance_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_finance_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_infection_control: {
        Row: {
          area: string | null
          clinic_id: string
          created_at: string
          department_id: string | null
          equipment_name: string | null
          id: string
          infection_type: string | null
          next_sterilization: string | null
          notes: string | null
          patient_id: string | null
          performed_by: string | null
          quarantine_end: string | null
          quarantine_start: string | null
          quarantine_status: string | null
          record_type: string | null
          severity: string | null
          status: string | null
          sterilization_date: string
          sterilization_method: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          clinic_id: string
          created_at?: string
          department_id?: string | null
          equipment_name?: string | null
          id?: string
          infection_type?: string | null
          next_sterilization?: string | null
          notes?: string | null
          patient_id?: string | null
          performed_by?: string | null
          quarantine_end?: string | null
          quarantine_start?: string | null
          quarantine_status?: string | null
          record_type?: string | null
          severity?: string | null
          status?: string | null
          sterilization_date?: string
          sterilization_method?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          clinic_id?: string
          created_at?: string
          department_id?: string | null
          equipment_name?: string | null
          id?: string
          infection_type?: string | null
          next_sterilization?: string | null
          notes?: string | null
          patient_id?: string | null
          performed_by?: string | null
          quarantine_end?: string | null
          quarantine_start?: string | null
          quarantine_status?: string | null
          record_type?: string | null
          severity?: string | null
          status?: string | null
          sterilization_date?: string
          sterilization_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_infection_control_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_infection_control_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_infection_control_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hms_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_infection_control_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_inventory: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          expiry_date: string | null
          id: string
          last_restocked: string | null
          location: string | null
          min_quantity: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          quantity: number
          sell_price: number | null
          sku: string | null
          status: string | null
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          location?: string | null
          min_quantity?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          sku?: string | null
          status?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          location?: string | null
          min_quantity?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          sku?: string | null
          status?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_inventory_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_inventory_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_invoices: {
        Row: {
          clinic_id: string
          created_at: string
          discount: number | null
          due_date: string | null
          id: string
          insurance_company: string | null
          insurance_coverage: number | null
          insurance_policy: string | null
          invoice_date: string
          invoice_number: string
          items: Json | null
          notes: string | null
          paid_amount: number | null
          patient_id: string
          payment_method: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          discount?: number | null
          due_date?: string | null
          id?: string
          insurance_company?: string | null
          insurance_coverage?: number | null
          insurance_policy?: string | null
          invoice_date?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          patient_id: string
          payment_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          discount?: number | null
          due_date?: string | null
          id?: string
          insurance_company?: string | null
          insurance_coverage?: number | null
          insurance_policy?: string | null
          invoice_date?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string
          payment_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_lab_orders: {
        Row: {
          clinic_id: string
          completed_at: string | null
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          ordered_at: string
          patient_id: string
          priority: string | null
          status: string | null
          test_category: string | null
          test_name: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string
          patient_id: string
          priority?: string | null
          status?: string | null
          test_category?: string | null
          test_name: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string
          patient_id?: string
          priority?: string | null
          status?: string | null
          test_category?: string | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_lab_orders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_lab_orders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_lab_orders_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_lab_results: {
        Row: {
          created_at: string
          id: string
          is_abnormal: boolean | null
          notes: string | null
          order_id: string
          parameter_name: string
          reference_range: string | null
          unit: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          notes?: string | null
          order_id: string
          parameter_name: string
          reference_range?: string | null
          unit?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          notes?: string | null
          order_id?: string
          parameter_name?: string
          reference_range?: string | null
          unit?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_lab_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "hms_lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_medical_records: {
        Row: {
          attachments: Json | null
          clinic_id: string
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          follow_up_date: string | null
          id: string
          is_confidential: boolean | null
          medications: Json | null
          notes: string | null
          patient_id: string
          record_date: string
          record_type: string | null
          symptoms: string | null
          treatment: string | null
          updated_at: string
          vital_signs: Json | null
        }
        Insert: {
          attachments?: Json | null
          clinic_id: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_date?: string | null
          id?: string
          is_confidential?: boolean | null
          medications?: Json | null
          notes?: string | null
          patient_id: string
          record_date?: string
          record_type?: string | null
          symptoms?: string | null
          treatment?: string | null
          updated_at?: string
          vital_signs?: Json | null
        }
        Update: {
          attachments?: Json | null
          clinic_id?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_date?: string | null
          id?: string
          is_confidential?: boolean | null
          medications?: Json | null
          notes?: string | null
          patient_id?: string
          record_date?: string
          record_type?: string | null
          symptoms?: string | null
          treatment?: string | null
          updated_at?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_messages: {
        Row: {
          channel: string | null
          clinic_id: string
          created_at: string
          id: string
          message: string
          sender_name: string
          sender_staff_id: string | null
        }
        Insert: {
          channel?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          message: string
          sender_name: string
          sender_staff_id?: string | null
        }
        Update: {
          channel?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_name?: string
          sender_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_messages_sender_staff_id_fkey"
            columns: ["sender_staff_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          chronic_diseases: string | null
          clinic_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          gender: string | null
          id: string
          insurance_number: string | null
          is_active: boolean | null
          national_id: string | null
          notes: string | null
          passport_id: string | null
          phone: string
          rh_factor: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          chronic_diseases?: string | null
          clinic_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          gender?: string | null
          id?: string
          insurance_number?: string | null
          is_active?: boolean | null
          national_id?: string | null
          notes?: string | null
          passport_id?: string | null
          phone: string
          rh_factor?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          chronic_diseases?: string | null
          clinic_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          insurance_number?: string | null
          is_active?: boolean | null
          national_id?: string | null
          notes?: string | null
          passport_id?: string | null
          phone?: string
          rh_factor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_payroll: {
        Row: {
          base_salary: number | null
          bonus: number | null
          clinic_id: string
          created_at: string
          deductions: number | null
          id: string
          notes: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          staff_id: string
          status: string | null
          total_paid: number | null
        }
        Insert: {
          base_salary?: number | null
          bonus?: number | null
          clinic_id: string
          created_at?: string
          deductions?: number | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          staff_id: string
          status?: string | null
          total_paid?: number | null
        }
        Update: {
          base_salary?: number | null
          bonus?: number | null
          clinic_id?: string
          created_at?: string
          deductions?: number | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          staff_id?: string
          status?: string | null
          total_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_payroll_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_payroll_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_pharmacy_stock: {
        Row: {
          batch_number: string | null
          buy_price: number | null
          category: string | null
          clinic_id: string
          created_at: string
          drug_name: string
          expire_date: string | null
          id: string
          is_active: boolean | null
          manufacturer: string | null
          quantity: number | null
          sell_price: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          buy_price?: number | null
          category?: string | null
          clinic_id: string
          created_at?: string
          drug_name: string
          expire_date?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          quantity?: number | null
          sell_price?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          buy_price?: number | null
          category?: string | null
          clinic_id?: string
          created_at?: string
          drug_name?: string
          expire_date?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          quantity?: number | null
          sell_price?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_pharmacy_stock_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_pharmacy_stock_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_prescription_items: {
        Row: {
          created_at: string
          dosage: string | null
          drug_name: string
          duration: string | null
          frequency: string | null
          id: string
          notes: string | null
          prescription_id: string
          quantity: number | null
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          drug_name: string
          duration?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          prescription_id: string
          quantity?: number | null
        }
        Update: {
          created_at?: string
          dosage?: string | null
          drug_name?: string
          duration?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          prescription_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "hms_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_prescriptions: {
        Row: {
          clinic_id: string
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          id: string
          instructions: string | null
          medications: Json | null
          notes: string | null
          patient_id: string | null
          patient_name: string
          prescription_date: string
          qr_code: string | null
          status: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          instructions?: string | null
          medications?: Json | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          prescription_date?: string
          qr_code?: string | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          instructions?: string | null
          medications?: Json | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          prescription_date?: string
          qr_code?: string | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_queue: {
        Row: {
          called_at: string | null
          clinic_id: string
          completed_at: string | null
          created_at: string
          department_id: string | null
          doctor_id: string | null
          estimated_wait_minutes: number | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          priority: string | null
          queue_number: number
          status: string | null
        }
        Insert: {
          called_at?: string | null
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          priority?: string | null
          queue_number?: number
          status?: string | null
        }
        Update: {
          called_at?: string | null
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          priority?: string | null
          queue_number?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_queue_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_queue_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_queue_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hms_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_queue_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_staff: {
        Row: {
          clinic_id: string
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: string
          salary: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          department?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_staff_schedule: {
        Row: {
          clinic_id: string
          created_at: string
          end_time: string | null
          id: string
          leave_reason: string | null
          leave_type: string | null
          notes: string | null
          schedule_date: string
          shift_type: string | null
          staff_id: string
          start_time: string | null
          status: string | null
          substitute_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          leave_reason?: string | null
          leave_type?: string | null
          notes?: string | null
          schedule_date: string
          shift_type?: string | null
          staff_id: string
          start_time?: string | null
          status?: string | null
          substitute_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          leave_reason?: string | null
          leave_type?: string | null
          notes?: string | null
          schedule_date?: string
          shift_type?: string | null
          staff_id?: string
          start_time?: string | null
          status?: string | null
          substitute_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_staff_schedule_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_staff_schedule_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_staff_schedule_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_staff_schedule_substitute_id_fkey"
            columns: ["substitute_id"]
            isOneToOne: false
            referencedRelation: "hms_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_surgeries: {
        Row: {
          anesthesia_type: string | null
          clinic_id: string
          complications: string | null
          cost: number | null
          created_at: string
          doctor_id: string | null
          duration_minutes: number | null
          id: string
          operating_room: string | null
          patient_id: string
          post_op_notes: string | null
          pre_op_notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          surgery_name: string
          surgery_type: string | null
          team_members: string | null
          updated_at: string
        }
        Insert: {
          anesthesia_type?: string | null
          clinic_id: string
          complications?: string | null
          cost?: number | null
          created_at?: string
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          operating_room?: string | null
          patient_id: string
          post_op_notes?: string | null
          pre_op_notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          surgery_name: string
          surgery_type?: string | null
          team_members?: string | null
          updated_at?: string
        }
        Update: {
          anesthesia_type?: string | null
          clinic_id?: string
          complications?: string | null
          cost?: number | null
          created_at?: string
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          operating_room?: string | null
          patient_id?: string
          post_op_notes?: string | null
          pre_op_notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          surgery_name?: string
          surgery_type?: string | null
          team_members?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_surgeries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_surgeries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_surgeries_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_teleconsultations: {
        Row: {
          clinic_id: string
          consultation_type: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          ended_at: string | null
          id: string
          messages: Json | null
          notes: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          consultation_type?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          ended_at?: string | null
          id?: string
          messages?: Json | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          consultation_type?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          ended_at?: string | null
          id?: string
          messages?: Json | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_teleconsultations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_teleconsultations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_teleconsultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_teleconsultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "hms_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      icd10_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_chapter: boolean | null
          name_en: string | null
          name_ru: string | null
          name_uz: string
          parent_code: string | null
          search_vector: unknown
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_chapter?: boolean | null
          name_en?: string | null
          name_ru?: string | null
          name_uz: string
          parent_code?: string | null
          search_vector?: unknown
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_chapter?: boolean | null
          name_en?: string | null
          name_ru?: string | null
          name_uz?: string
          parent_code?: string | null
          search_vector?: unknown
        }
        Relationships: []
      }
      insurance_claim_documents: {
        Row: {
          claim_id: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          owner_id: string
          uploaded_at: string
        }
        Insert: {
          claim_id: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          owner_id: string
          uploaded_at?: string
        }
        Update: {
          claim_id?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          owner_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claim_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_amount: number | null
          claim_number: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          diagnosis_text: string | null
          icd_code: string | null
          id: string
          insurance_amount: number
          metadata: Json | null
          module: string
          notes: string | null
          owner_id: string
          paid_amount: number | null
          paid_at: string | null
          patient_amount: number
          patient_id: string | null
          patient_name: string
          patient_user_id: string | null
          policy_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          service_date: string
          service_name: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          claim_number?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis_text?: string | null
          icd_code?: string | null
          id?: string
          insurance_amount?: number
          metadata?: Json | null
          module?: string
          notes?: string | null
          owner_id: string
          paid_amount?: number | null
          paid_at?: string | null
          patient_amount?: number
          patient_id?: string | null
          patient_name: string
          patient_user_id?: string | null
          policy_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          service_date?: string
          service_name?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          claim_number?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis_text?: string | null
          icd_code?: string | null
          id?: string
          insurance_amount?: number
          metadata?: Json | null
          module?: string
          notes?: string | null
          owner_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          patient_amount?: number
          patient_id?: string | null
          patient_name?: string
          patient_user_id?: string | null
          policy_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          service_date?: string
          service_name?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_companies: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contract_end: string | null
          contract_start: string | null
          contract_url: string | null
          created_at: string
          created_by: string | null
          default_coverage_pct: number | null
          id: string
          inn: string | null
          is_active: boolean | null
          legal_name: string | null
          license_number: string | null
          name: string
          notes: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_url?: string | null
          created_at?: string
          created_by?: string | null
          default_coverage_pct?: number | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          license_number?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_url?: string | null
          created_at?: string
          created_by?: string | null
          default_coverage_pct?: number | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          license_number?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      insurance_payment_splits: {
        Row: {
          amount: number
          claim_id: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          payer_type: string
          payment_date: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          claim_id: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          payer_type: string
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          claim_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          payer_type?: string
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_payment_splits_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          company_id: string | null
          coverage_details: Json | null
          coverage_pct: number | null
          created_at: string
          end_date: string
          id: string
          max_amount: number | null
          module: string
          notes: string | null
          owner_id: string
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          patient_user_id: string | null
          policy_number: string
          policy_type: string | null
          start_date: string
          status: string
          updated_at: string
          used_amount: number | null
        }
        Insert: {
          company_id?: string | null
          coverage_details?: Json | null
          coverage_pct?: number | null
          created_at?: string
          end_date: string
          id?: string
          max_amount?: number | null
          module?: string
          notes?: string | null
          owner_id: string
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          patient_user_id?: string | null
          policy_number: string
          policy_type?: string | null
          start_date: string
          status?: string
          updated_at?: string
          used_amount?: number | null
        }
        Update: {
          company_id?: string | null
          coverage_details?: Json | null
          coverage_pct?: number | null
          created_at?: string
          end_date?: string
          id?: string
          max_amount?: number | null
          module?: string
          notes?: string | null
          owner_id?: string
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          patient_user_id?: string | null
          policy_number?: string
          policy_type?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          used_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_number: string
          invoice_type: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          service_name: string | null
          service_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          invoice_type?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          service_name?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          invoice_type?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          service_name?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          language: string
          published: boolean
          related_slugs: string[] | null
          search_vector: unknown
          slug: string
          source_name: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          language: string
          published?: boolean
          related_slugs?: string[] | null
          search_vector?: unknown
          slug: string
          source_name?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          language?: string
          published?: boolean
          related_slugs?: string[] | null
          search_vector?: unknown
          slug?: string
          source_name?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      knowledge_imports: {
        Row: {
          created_at: string
          error_message: string | null
          filename: string
          id: string
          language: string
          status: string
          total_inserted: number
          total_parsed: number
          total_updated: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          filename: string
          id?: string
          language: string
          status?: string
          total_inserted?: number
          total_parsed?: number
          total_updated?: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          filename?: string
          id?: string
          language?: string
          status?: string
          total_inserted?: number
          total_parsed?: number
          total_updated?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          context: string | null
          doc_type: string
          doc_version: string
          document_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          context?: string | null
          doc_type: string
          doc_version: string
          document_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          context?: string | null
          doc_type?: string
          doc_version?: string
          document_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          doc_type: string
          effective_date: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          doc_type: string
          effective_date?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          doc_type?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_analytics: {
        Row: {
          clicks: number | null
          clinic_id: string | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          ctr: number | null
          date: string | null
          id: string
          impressions: number | null
          promotion_id: string | null
        }
        Insert: {
          clicks?: number | null
          clinic_id?: string | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          promotion_id?: string | null
        }
        Update: {
          clicks?: number | null
          clinic_id?: string | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          promotion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_analytics_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_antenatal_visits: {
        Row: {
          blood_pressure: string | null
          center_id: string
          created_at: string
          fetal_heartbeat: number | null
          fundal_height_cm: number | null
          gestational_week: number | null
          id: string
          next_visit_date: string | null
          notes: string | null
          patient_id: string
          updated_at: string
          visit_date: string
          weight_kg: number | null
        }
        Insert: {
          blood_pressure?: string | null
          center_id: string
          created_at?: string
          fetal_heartbeat?: number | null
          fundal_height_cm?: number | null
          gestational_week?: number | null
          id?: string
          next_visit_date?: string | null
          notes?: string | null
          patient_id: string
          updated_at?: string
          visit_date?: string
          weight_kg?: number | null
        }
        Update: {
          blood_pressure?: string | null
          center_id?: string
          created_at?: string
          fetal_heartbeat?: number | null
          fundal_height_cm?: number | null
          gestational_week?: number | null
          id?: string
          next_visit_date?: string | null
          notes?: string | null
          patient_id?: string
          updated_at?: string
          visit_date?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maternity_antenatal_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          center_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          patient_name: string
          patient_phone: string
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          center_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          patient_name: string
          patient_phone: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          center_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string
          patient_phone?: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_appointments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "maternity_services"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_beds: {
        Row: {
          bed_label: string
          center_id: string
          created_at: string
          id: string
          notes: string | null
          occupied_at: string | null
          patient_id: string | null
          room_number: string
          room_type: string
          status: string
          updated_at: string
        }
        Insert: {
          bed_label: string
          center_id: string
          created_at?: string
          id?: string
          notes?: string | null
          occupied_at?: string | null
          patient_id?: string | null
          room_number: string
          room_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          bed_label?: string
          center_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          occupied_at?: string | null
          patient_id?: string | null
          room_number?: string
          room_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_beds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_deliveries: {
        Row: {
          blood_loss_ml: number | null
          center_id: string
          complications: string | null
          created_at: string
          delivery_date: string
          delivery_type: string
          doctor_name: string | null
          duration_hours: number | null
          id: string
          midwife_name: string | null
          notes: string | null
          outcome: string
          patient_id: string
          room_number: string | null
        }
        Insert: {
          blood_loss_ml?: number | null
          center_id: string
          complications?: string | null
          created_at?: string
          delivery_date?: string
          delivery_type?: string
          doctor_name?: string | null
          duration_hours?: number | null
          id?: string
          midwife_name?: string | null
          notes?: string | null
          outcome?: string
          patient_id: string
          room_number?: string | null
        }
        Update: {
          blood_loss_ml?: number | null
          center_id?: string
          complications?: string | null
          created_at?: string
          delivery_date?: string
          delivery_type?: string
          doctor_name?: string | null
          duration_hours?: number | null
          id?: string
          midwife_name?: string | null
          notes?: string | null
          outcome?: string
          patient_id?: string
          room_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maternity_deliveries_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_deliveries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_documents: {
        Row: {
          center_id: string
          created_at: string
          document_type: string
          file_name: string
          file_size: string | null
          file_url: string
          id: string
          patient_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          center_id: string
          created_at?: string
          document_type?: string
          file_name: string
          file_size?: string | null
          file_url: string
          id?: string
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: string | null
          file_url?: string
          id?: string
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maternity_documents_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_emergencies: {
        Row: {
          center_id: string
          created_at: string
          description: string | null
          emergency_type: string
          id: string
          patient_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          description?: string | null
          emergency_type: string
          id?: string
          patient_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          description?: string | null
          emergency_type?: string
          id?: string
          patient_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_emergencies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_lab_results: {
        Row: {
          center_id: string
          created_at: string
          id: string
          is_abnormal: boolean | null
          normal_range: string | null
          notes: string | null
          patient_id: string
          result_value: string | null
          test_date: string
          test_name: string
          test_type: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          normal_range?: string | null
          notes?: string | null
          patient_id: string
          result_value?: string | null
          test_date?: string
          test_name: string
          test_type?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          normal_range?: string | null
          notes?: string | null
          patient_id?: string
          result_value?: string | null
          test_date?: string
          test_name?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_lab_results_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_newborns: {
        Row: {
          apgar_score_1min: number | null
          apgar_score_5min: number | null
          baby_name: string | null
          birth_date: string
          blood_group: string | null
          center_id: string
          created_at: string
          delivery_id: string | null
          gender: string
          head_circumference_cm: number | null
          health_status: string
          height_cm: number | null
          id: string
          notes: string | null
          patient_id: string
          vaccinations: string[] | null
          weight_g: number | null
        }
        Insert: {
          apgar_score_1min?: number | null
          apgar_score_5min?: number | null
          baby_name?: string | null
          birth_date?: string
          blood_group?: string | null
          center_id: string
          created_at?: string
          delivery_id?: string | null
          gender?: string
          head_circumference_cm?: number | null
          health_status?: string
          height_cm?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          vaccinations?: string[] | null
          weight_g?: number | null
        }
        Update: {
          apgar_score_1min?: number | null
          apgar_score_5min?: number | null
          baby_name?: string | null
          birth_date?: string
          blood_group?: string | null
          center_id?: string
          created_at?: string
          delivery_id?: string | null
          gender?: string
          head_circumference_cm?: number | null
          health_status?: string
          height_cm?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          vaccinations?: string[] | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maternity_newborns_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_newborns_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "maternity_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_newborns_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          center_id: string
          chronic_diseases: string | null
          created_at: string
          date_of_birth: string | null
          edd_date: string | null
          full_name: string
          gravida: number | null
          husband_name: string | null
          husband_phone: string | null
          id: string
          lmp_date: string | null
          notes: string | null
          para: number | null
          passport_id: string | null
          phone: string
          rh_factor: string | null
          risk_level: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          center_id: string
          chronic_diseases?: string | null
          created_at?: string
          date_of_birth?: string | null
          edd_date?: string | null
          full_name: string
          gravida?: number | null
          husband_name?: string | null
          husband_phone?: string | null
          id?: string
          lmp_date?: string | null
          notes?: string | null
          para?: number | null
          passport_id?: string | null
          phone: string
          rh_factor?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          center_id?: string
          chronic_diseases?: string | null
          created_at?: string
          date_of_birth?: string | null
          edd_date?: string | null
          full_name?: string
          gravida?: number | null
          husband_name?: string | null
          husband_phone?: string | null
          id?: string
          lmp_date?: string | null
          notes?: string | null
          para?: number | null
          passport_id?: string | null
          phone?: string
          rh_factor?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_patients_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_photos: {
        Row: {
          caption: string | null
          center_id: string
          created_at: string
          id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          center_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          center_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_photos_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_postpartum: {
        Row: {
          bleeding_status: string | null
          breastfeeding_status: string | null
          center_id: string
          check_date: string
          created_at: string
          days_postpartum: number | null
          delivery_id: string | null
          id: string
          mood_score: number | null
          notes: string | null
          patient_id: string
          recovery_status: string | null
          updated_at: string
        }
        Insert: {
          bleeding_status?: string | null
          breastfeeding_status?: string | null
          center_id: string
          check_date?: string
          created_at?: string
          days_postpartum?: number | null
          delivery_id?: string | null
          id?: string
          mood_score?: number | null
          notes?: string | null
          patient_id: string
          recovery_status?: string | null
          updated_at?: string
        }
        Update: {
          bleeding_status?: string | null
          breastfeeding_status?: string | null
          center_id?: string
          check_date?: string
          created_at?: string
          days_postpartum?: number | null
          delivery_id?: string | null
          id?: string
          mood_score?: number | null
          notes?: string | null
          patient_id?: string
          recovery_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_postpartum_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "maternity_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_postpartum_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_pregnancy_logs: {
        Row: {
          blood_pressure: string | null
          center_id: string
          created_at: string
          doctor_notes: string | null
          fetal_heart_rate: number | null
          fundal_height_cm: number | null
          id: string
          next_visit_date: string | null
          patient_id: string
          recommendations: string | null
          symptoms: string | null
          visit_date: string
          week_number: number
          weight_kg: number | null
        }
        Insert: {
          blood_pressure?: string | null
          center_id: string
          created_at?: string
          doctor_notes?: string | null
          fetal_heart_rate?: number | null
          fundal_height_cm?: number | null
          id?: string
          next_visit_date?: string | null
          patient_id: string
          recommendations?: string | null
          symptoms?: string | null
          visit_date?: string
          week_number: number
          weight_kg?: number | null
        }
        Update: {
          blood_pressure?: string | null
          center_id?: string
          created_at?: string
          doctor_notes?: string | null
          fetal_heart_rate?: number | null
          fundal_height_cm?: number | null
          id?: string
          next_visit_date?: string | null
          patient_id?: string
          recommendations?: string | null
          symptoms?: string | null
          visit_date?: string
          week_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maternity_pregnancy_logs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_pregnancy_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_prescriptions: {
        Row: {
          center_id: string
          created_at: string
          doctor_name: string | null
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          medication_name: string
          notes: string | null
          patient_id: string
          prescribed_date: string
        }
        Insert: {
          center_id: string
          created_at?: string
          doctor_name?: string | null
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribed_date?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          doctor_name?: string | null
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_prescriptions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_services: {
        Row: {
          category: string | null
          center_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          category?: string | null
          center_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          category?: string | null
          center_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "maternity_services_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_staff: {
        Row: {
          center_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: string
          shift: string | null
        }
        Insert: {
          center_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          shift?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          shift?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maternity_staff_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_transactions: {
        Row: {
          amount: number
          category: string | null
          center_id: string
          created_at: string
          description: string | null
          id: string
          invoice_number: string | null
          paid_amount: number
          patient_id: string | null
          payment_method: string | null
          status: string
          transaction_date: string
          type: string
        }
        Insert: {
          amount?: number
          category?: string | null
          center_id: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          paid_amount?: number
          patient_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_date?: string
          type?: string
        }
        Update: {
          amount?: number
          category?: string | null
          center_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          paid_amount?: number
          patient_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_transactions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      maternity_ultrasound: {
        Row: {
          abnormalities: string | null
          amniotic_fluid: string | null
          center_id: string
          conclusion: string | null
          created_at: string
          doctor_name: string | null
          fetal_position: string | null
          fetal_weight_g: number | null
          gestational_week: number | null
          id: string
          image_urls: string[] | null
          patient_id: string
          placenta_position: string | null
          scan_date: string
        }
        Insert: {
          abnormalities?: string | null
          amniotic_fluid?: string | null
          center_id: string
          conclusion?: string | null
          created_at?: string
          doctor_name?: string | null
          fetal_position?: string | null
          fetal_weight_g?: number | null
          gestational_week?: number | null
          id?: string
          image_urls?: string[] | null
          patient_id: string
          placenta_position?: string | null
          scan_date?: string
        }
        Update: {
          abnormalities?: string | null
          amniotic_fluid?: string | null
          center_id?: string
          conclusion?: string | null
          created_at?: string
          doctor_name?: string | null
          fetal_position?: string | null
          fetal_weight_g?: number | null
          gestational_week?: number | null
          id?: string
          image_urls?: string[] | null
          patient_id?: string
          placenta_position?: string | null
          scan_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_ultrasound_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_maternity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maternity_ultrasound_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "maternity_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          attachments: string[] | null
          clinic_name: string | null
          created_at: string
          description: string | null
          doctor_name: string | null
          id: string
          record_date: string
          record_type: string
          title: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          clinic_name?: string | null
          created_at?: string
          description?: string | null
          doctor_name?: string | null
          id?: string
          record_date?: string
          record_type?: string
          title: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          clinic_name?: string | null
          created_at?: string
          description?: string | null
          doctor_name?: string | null
          id?: string
          record_date?: string
          record_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      medtech_clients: {
        Row: {
          address: string | null
          client_type: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          address?: string | null
          client_type?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          address?: string | null
          client_type?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      medtech_documents: {
        Row: {
          created_at: string
          doc_name: string
          doc_type: string | null
          equipment_id: string | null
          expires_at: string | null
          file_size: string | null
          file_url: string
          id: string
          notes: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          doc_name: string
          doc_type?: string | null
          equipment_id?: string | null
          expires_at?: string | null
          file_size?: string | null
          file_url: string
          id?: string
          notes?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          doc_name?: string
          doc_type?: string | null
          equipment_id?: string | null
          expires_at?: string | null
          file_size?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medtech_documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medtech_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_equipment: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          rental_daily_price: number | null
          sell_price: number | null
          serial_number: string | null
          status: string
          updated_at: string
          vendor_id: string
          warranty_end: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          rental_daily_price?: number | null
          sell_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          warranty_end?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          rental_daily_price?: number | null
          sell_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          warranty_end?: string | null
        }
        Relationships: []
      }
      medtech_inventory: {
        Row: {
          category: string | null
          created_at: string
          id: string
          location: string | null
          min_quantity: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          quantity: number
          sell_price: number | null
          sku: string | null
          supplier: string | null
          unit: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          min_quantity?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          sku?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          min_quantity?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          sell_price?: number | null
          sku?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      medtech_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          equipment_id: string
          id: string
          next_service_date: string | null
          notes: string | null
          problem: string | null
          service_date: string
          service_type: string
          solution: string | null
          status: string
          technician_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          equipment_id: string
          id?: string
          next_service_date?: string | null
          notes?: string | null
          problem?: string | null
          service_date?: string
          service_type?: string
          solution?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          equipment_id?: string
          id?: string
          next_service_date?: string | null
          notes?: string | null
          problem?: string | null
          service_date?: string
          service_type?: string
          solution?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medtech_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medtech_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medtech_maintenance_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "medtech_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "medtech_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medtech_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medtech_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "medtech_products"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_orders: {
        Row: {
          buyer_address: string | null
          buyer_email: string | null
          buyer_id: string
          buyer_name: string
          buyer_phone: string
          buyer_type: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          total_amount: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_id: string
          buyer_name: string
          buyer_phone: string
          buyer_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_id?: string
          buyer_name?: string
          buyer_phone?: string
          buyer_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medtech_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medtech_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_products: {
        Row: {
          category: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          photos: string[] | null
          price: number | null
          specifications: Json | null
          stock_quantity: number | null
          updated_at: string
          vendor_id: string
          view_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          photos?: string[] | null
          price?: number | null
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
          vendor_id: string
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          photos?: string[] | null
          price?: number | null
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
          vendor_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medtech_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medtech_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_rentals: {
        Row: {
          client_id: string
          created_at: string
          daily_price: number
          deposit: number | null
          end_date: string
          equipment_id: string
          id: string
          notes: string | null
          paid_amount: number | null
          return_date: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          daily_price?: number
          deposit?: number | null
          end_date: string
          equipment_id: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          return_date?: string | null
          start_date: string
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          daily_price?: number
          deposit?: number | null
          end_date?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          return_date?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medtech_rentals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "medtech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medtech_rentals_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medtech_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_sales: {
        Row: {
          client_id: string
          created_at: string
          equipment_id: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_amount: number | null
          payment_method: string | null
          payment_status: string | null
          sale_date: string
          sale_price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          equipment_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          sale_date?: string
          sale_price?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          equipment_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          sale_date?: string
          sale_price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medtech_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "medtech_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medtech_sales_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medtech_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      medtech_technicians: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          specialization: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      medtech_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          related_id: string | null
          related_type: string | null
          transaction_date: string
          type: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          transaction_date?: string
          type?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          transaction_date?: string
          type?: string
          vendor_id?: string
        }
        Relationships: []
      }
      medtech_vendors: {
        Row: {
          activity_type: string
          address: string
          catalog_url: string | null
          categories: string[] | null
          certificates: string[] | null
          city: string | null
          company_name: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          inn: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          owner_id: string
          phone: string
          region: string | null
          telegram: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          activity_type?: string
          address: string
          catalog_url?: string | null
          categories?: string[] | null
          certificates?: string[] | null
          city?: string | null
          company_name: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          inn: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          owner_id: string
          phone: string
          region?: string | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          activity_type?: string
          address?: string
          catalog_url?: string | null
          categories?: string[] | null
          certificates?: string[] | null
          city?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          inn?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          owner_id?: string
          phone?: string
          region?: string | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      org_attendance_audit_logs: {
        Row: {
          action: string
          created_at: string
          device_info: string | null
          distance_m: number | null
          id: string
          ip_address: string | null
          lat: number | null
          lng: number | null
          owner_id: string
          qr_token: string | null
          qr_token_id: string | null
          reason: string | null
          result: string
          staff_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_info?: string | null
          distance_m?: number | null
          id?: string
          ip_address?: string | null
          lat?: number | null
          lng?: number | null
          owner_id: string
          qr_token?: string | null
          qr_token_id?: string | null
          reason?: string | null
          result: string
          staff_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_info?: string | null
          distance_m?: number | null
          id?: string
          ip_address?: string | null
          lat?: number | null
          lng?: number | null
          owner_id?: string
          qr_token?: string | null
          qr_token_id?: string | null
          reason?: string | null
          result?: string
          staff_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_attendance_audit_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "org_attendance_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      org_attendance_qr_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          owner_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          owner_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          owner_id?: string
          token?: string
        }
        Relationships: []
      }
      org_attendance_records: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_in_distance_m: number | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_out: string | null
          check_out_distance_m: number | null
          check_out_lat: number | null
          check_out_lng: number | null
          created_at: string
          device_info: string | null
          id: string
          is_late: boolean | null
          late_minutes: number | null
          notes: string | null
          owner_id: string
          qr_token_id: string | null
          staff_id: string
          status: string | null
          suspicious: boolean | null
          updated_at: string
          worked_minutes: number | null
        }
        Insert: {
          attendance_date?: string
          check_in?: string | null
          check_in_distance_m?: number | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out?: string | null
          check_out_distance_m?: number | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          device_info?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          owner_id: string
          qr_token_id?: string | null
          staff_id: string
          status?: string | null
          suspicious?: boolean | null
          updated_at?: string
          worked_minutes?: number | null
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_in_distance_m?: number | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out?: string | null
          check_out_distance_m?: number | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          device_info?: string | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          owner_id?: string
          qr_token_id?: string | null
          staff_id?: string
          status?: string | null
          suspicious?: boolean | null
          updated_at?: string
          worked_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_attendance_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "org_attendance_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      org_attendance_settings: {
        Row: {
          created_at: string
          enforce_geo: boolean
          enforce_qr: boolean
          id: string
          late_threshold_min: number
          location_lat: number | null
          location_lng: number | null
          org_name: string | null
          org_type: string
          owner_id: string
          qr_rotate_seconds: number
          radius_m: number
          updated_at: string
          work_end: string
          work_start: string
        }
        Insert: {
          created_at?: string
          enforce_geo?: boolean
          enforce_qr?: boolean
          id?: string
          late_threshold_min?: number
          location_lat?: number | null
          location_lng?: number | null
          org_name?: string | null
          org_type?: string
          owner_id: string
          qr_rotate_seconds?: number
          radius_m?: number
          updated_at?: string
          work_end?: string
          work_start?: string
        }
        Update: {
          created_at?: string
          enforce_geo?: boolean
          enforce_qr?: boolean
          id?: string
          late_threshold_min?: number
          location_lat?: number | null
          location_lng?: number | null
          org_name?: string | null
          org_type?: string
          owner_id?: string
          qr_rotate_seconds?: number
          radius_m?: number
          updated_at?: string
          work_end?: string
          work_start?: string
        }
        Relationships: []
      }
      org_attendance_staff: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          org_type: string
          owner_id: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          org_type?: string
          owner_id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          org_type?: string
          owner_id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          category: string
          created_at: string
          family_member_id: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          family_member_id?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          family_member_id?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_health_logs: {
        Row: {
          created_at: string
          diastolic: number | null
          family_member_id: string | null
          glucose: number | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          log_date: string
          notes: string | null
          spo2: number | null
          systolic: number | null
          temperature: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          diastolic?: number | null
          family_member_id?: string | null
          glucose?: number | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          spo2?: number | null
          systolic?: number | null
          temperature?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          diastolic?: number | null
          family_member_id?: string | null
          glucose?: number | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          spo2?: number | null
          systolic?: number | null
          temperature?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_health_logs_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_customers: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          loyalty_points: number | null
          notes: string | null
          pharmacy_id: string
          phone: string | null
          total_purchases: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          loyalty_points?: number | null
          notes?: string | null
          pharmacy_id: string
          phone?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          loyalty_points?: number | null
          notes?: string | null
          pharmacy_id?: string
          phone?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_customers_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_inventory_batches: {
        Row: {
          batch_number: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          pharmacy_id: string
          product_id: string
          purchase_price: number | null
          quantity: number
          received_date: string | null
          remaining_quantity: number
          sell_price: number | null
          supplier_name: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          pharmacy_id: string
          product_id: string
          purchase_price?: number | null
          quantity?: number
          received_date?: string | null
          remaining_quantity?: number
          sell_price?: number | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          pharmacy_id?: string
          product_id?: string
          purchase_price?: number | null
          quantity?: number
          received_date?: string | null
          remaining_quantity?: number
          sell_price?: number | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_inventory_batches_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_orders: {
        Row: {
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_type: string | null
          id: string
          notes: string | null
          pharmacy_id: string
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_type?: string | null
          id?: string
          notes?: string | null
          pharmacy_id: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_type?: string | null
          id?: string
          notes?: string | null
          pharmacy_id?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          pharmacy_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          pharmacy_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          pharmacy_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_photos_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_prescriptions: {
        Row: {
          clinic_name: string | null
          created_at: string | null
          customer_id: string | null
          diagnosis: string | null
          dispensed_at: string | null
          doctor_name: string | null
          file_url: string | null
          id: string
          medications: Json | null
          notes: string | null
          patient_name: string
          patient_phone: string | null
          pharmacy_id: string
          sale_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          diagnosis?: string | null
          dispensed_at?: string | null
          doctor_name?: string | null
          file_url?: string | null
          id?: string
          medications?: Json | null
          notes?: string | null
          patient_name: string
          patient_phone?: string | null
          pharmacy_id: string
          sale_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          clinic_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          diagnosis?: string | null
          dispensed_at?: string | null
          doctor_name?: string | null
          file_url?: string | null
          id?: string
          medications?: Json | null
          notes?: string | null
          patient_name?: string
          patient_phone?: string | null
          pharmacy_id?: string
          sale_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_prescriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_prescriptions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_products: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          dosage: string | null
          drug_type: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          manufacturer: string | null
          name: string
          pharmacy_id: string
          photo_url: string | null
          price: number | null
          requires_prescription: boolean | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          dosage?: string | null
          drug_type?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          manufacturer?: string | null
          name: string
          pharmacy_id: string
          photo_url?: string | null
          price?: number | null
          requires_prescription?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          dosage?: string | null
          drug_type?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          manufacturer?: string | null
          name?: string
          pharmacy_id?: string
          photo_url?: string | null
          price?: number | null
          requires_prescription?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_products_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_promo_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          min_amount: number | null
          pharmacy_id: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          min_amount?: number | null
          pharmacy_id: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          min_amount?: number | null
          pharmacy_id?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_promo_codes_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sale_items: {
        Row: {
          created_at: string | null
          id: string
          pharmacy_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          pharmacy_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          pharmacy_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sale_items_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_method: string
          payment_status: string
          pharmacy_id: string
          prescription_id: string | null
          promo_code: string | null
          staff_name: string | null
          subtotal: number | null
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string
          payment_status?: string
          pharmacy_id: string
          prescription_id?: string | null
          promo_code?: string | null
          staff_name?: string | null
          subtotal?: number | null
          total_amount?: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string
          payment_status?: string
          pharmacy_id?: string
          prescription_id?: string | null
          promo_code?: string | null
          staff_name?: string | null
          subtotal?: number | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_staff: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          pharmacy_id: string
          phone: string | null
          role: string
          salary: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pharmacy_id: string
          phone?: string | null
          role?: string
          salary?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pharmacy_id?: string
          phone?: string | null
          role?: string
          salary?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_staff_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_supplier_orders: {
        Row: {
          created_at: string | null
          expected_date: string | null
          id: string
          items: Json | null
          notes: string | null
          order_number: string | null
          pharmacy_id: string
          received_date: string | null
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expected_date?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: string | null
          pharmacy_id: string
          received_date?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expected_date?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: string | null
          pharmacy_id?: string
          received_date?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_supplier_orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_suppliers: {
        Row: {
          address: string | null
          balance: number | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          pharmacy_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          pharmacy_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          pharmacy_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_suppliers_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          pharmacy_id: string
          reference_id: string | null
          reference_type: string | null
          transaction_date: string | null
          type: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          pharmacy_id: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          type?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          pharmacy_id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_transactions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "registered_pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          paid_at: string | null
          provider: string
          provider_payment_id: string | null
          provider_transaction_id: string | null
          purpose: string
          reference_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          provider: string
          provider_payment_id?: string | null
          provider_transaction_id?: string | null
          purpose: string
          reference_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_transaction_id?: string | null
          purpose?: string
          reference_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_plans: {
        Row: {
          category: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      postnatal_logs: {
        Row: {
          baby_id: string
          created_at: string
          id: string
          log_date: string
          log_type: string
          notes: string | null
          user_id: string
          value: Json | null
        }
        Insert: {
          baby_id: string
          created_at?: string
          id?: string
          log_date?: string
          log_type?: string
          notes?: string | null
          user_id: string
          value?: Json | null
        }
        Update: {
          baby_id?: string
          created_at?: string
          id?: string
          log_date?: string
          log_type?: string
          notes?: string | null
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "postnatal_logs_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          log_type: string
          notes: string | null
          pregnancy_id: string
          user_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          log_type?: string
          notes?: string | null
          pregnancy_id: string
          user_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          log_type?: string
          notes?: string | null
          pregnancy_id?: string
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pregnancy_logs_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_profiles: {
        Row: {
          blood_type: string | null
          confirmed_week: number | null
          created_at: string
          edd: string
          height_cm: number | null
          id: string
          is_active: boolean | null
          lmp_date: string
          notes: string | null
          previous_pregnancies: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          blood_type?: string | null
          confirmed_week?: number | null
          created_at?: string
          edd: string
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          lmp_date: string
          notes?: string | null
          previous_pregnancies?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          blood_type?: string | null
          confirmed_week?: number | null
          created_at?: string
          edd?: string
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          lmp_date?: string
          notes?: string | null
          previous_pregnancies?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      pregnancy_reminders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          pregnancy_id: string
          reminder_date: string
          reminder_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          pregnancy_id: string
          reminder_date: string
          reminder_type?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          pregnancy_id?: string
          reminder_date?: string
          reminder_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pregnancy_reminders_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_perks: {
        Row: {
          badge_text: string | null
          category: string
          created_at: string
          cta_url: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          module_id: string
          tier_required: string
          title: string
          updated_at: string
          valid_until: string | null
          value_text: string | null
        }
        Insert: {
          badge_text?: string | null
          category?: string
          created_at?: string
          cta_url?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          module_id: string
          tier_required?: string
          title: string
          updated_at?: string
          valid_until?: string | null
          value_text?: string | null
        }
        Update: {
          badge_text?: string | null
          category?: string
          created_at?: string
          cta_url?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          module_id?: string
          tier_required?: string
          title?: string
          updated_at?: string
          valid_until?: string | null
          value_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          notification_channels: string[] | null
          phone: string | null
          preferred_city: string | null
          preferred_latitude: number | null
          preferred_longitude: number | null
          preferred_radius_km: number | null
          telegram_chat_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          notification_channels?: string[] | null
          phone?: string | null
          preferred_city?: string | null
          preferred_latitude?: number | null
          preferred_longitude?: number | null
          preferred_radius_km?: number | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          notification_channels?: string[] | null
          phone?: string | null
          preferred_city?: string | null
          preferred_latitude?: number | null
          preferred_longitude?: number | null
          preferred_radius_km?: number | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_pct: number
          id: string
          is_active: boolean
          max_uses: number | null
          module_id: string | null
          tier_required: string | null
          updated_at: string
          used_count: number
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_pct?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          module_id?: string | null
          tier_required?: string | null
          updated_at?: string
          used_count?: number
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_pct?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          module_id?: string | null
          tier_required?: string | null
          updated_at?: string
          used_count?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          id: string
          module_id: string | null
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          module_id?: string | null
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          module_id?: string | null
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          ai_generated: boolean | null
          category: string | null
          click_count: number | null
          clinic_id: string | null
          conversion_count: number | null
          created_at: string | null
          creative_template: string | null
          description: string | null
          discount_percent: number | null
          expires_at: string | null
          geo_trigger_enabled: boolean
          id: string
          image_url: string | null
          is_active: boolean | null
          keywords: string[] | null
          original_price: number | null
          owner_id: string | null
          promo_price: number | null
          radius_m: number
          specialties: string[] | null
          starts_at: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          category?: string | null
          click_count?: number | null
          clinic_id?: string | null
          conversion_count?: number | null
          created_at?: string | null
          creative_template?: string | null
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          geo_trigger_enabled?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          keywords?: string[] | null
          original_price?: number | null
          owner_id?: string | null
          promo_price?: number | null
          radius_m?: number
          specialties?: string[] | null
          starts_at?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          category?: string | null
          click_count?: number | null
          clinic_id?: string | null
          conversion_count?: number | null
          created_at?: string | null
          creative_template?: string | null
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          geo_trigger_enabled?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          keywords?: string[] | null
          original_price?: number | null
          owner_id?: string | null
          promo_price?: number | null
          radius_m?: number
          specialties?: string[] | null
          starts_at?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          org_role: string | null
          owner_id: string
          total_rewards_credits: number
          total_rewards_months: number
          total_uses: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          org_role?: string | null
          owner_id: string
          total_rewards_credits?: number
          total_rewards_months?: number
          total_uses?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          org_role?: string | null
          owner_id?: string
          total_rewards_credits?: number
          total_rewards_months?: number
          total_uses?: number
          updated_at?: string
        }
        Relationships: []
      }
      referral_fraud_log: {
        Row: {
          created_at: string
          data: Json
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          reason: string
          referral_id: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          data?: Json
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          reason: string
          referral_id?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          data?: Json
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          reason?: string
          referral_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_fraud_log_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_promo_codes: {
        Row: {
          applicable_modules: Json
          applicable_tiers: Json
          bonus_ai_credits: number
          bonus_credits: number
          bonus_months: number
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_pct: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          used_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_modules?: Json
          applicable_tiers?: Json
          bonus_ai_credits?: number
          bonus_credits?: number
          bonus_months?: number
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_pct?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_modules?: Json
          applicable_tiers?: Json
          bonus_ai_credits?: number
          bonus_credits?: number
          bonus_months?: number
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_pct?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      referral_rewards_ledger: {
        Row: {
          amount: number
          applied_to: string
          balance_after: number | null
          balance_before: number | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["referral_reward_kind"]
          notes: string | null
          referral_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          applied_to?: string
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["referral_reward_kind"]
          notes?: string | null
          referral_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          applied_to?: string
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["referral_reward_kind"]
          notes?: string | null
          referral_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_ledger_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_settings: {
        Row: {
          auto_approve: boolean
          base_reward_ai: Json
          base_reward_basic: Json
          base_reward_premium: Json
          block_self_referral: boolean
          cancel_on_refund: boolean
          cancel_on_unsubscribe_days: number
          id: number
          max_referrals_per_ip_24h: number
          min_subscription_amount: number
          qualify_within_days: number
          require_subscription: boolean
          reward_hold_days: number
          updated_at: string
        }
        Insert: {
          auto_approve?: boolean
          base_reward_ai?: Json
          base_reward_basic?: Json
          base_reward_premium?: Json
          block_self_referral?: boolean
          cancel_on_refund?: boolean
          cancel_on_unsubscribe_days?: number
          id?: number
          max_referrals_per_ip_24h?: number
          min_subscription_amount?: number
          qualify_within_days?: number
          require_subscription?: boolean
          reward_hold_days?: number
          updated_at?: string
        }
        Update: {
          auto_approve?: boolean
          base_reward_ai?: Json
          base_reward_basic?: Json
          base_reward_premium?: Json
          block_self_referral?: boolean
          cancel_on_refund?: boolean
          cancel_on_unsubscribe_days?: number
          id?: number
          max_referrals_per_ip_24h?: number
          min_subscription_amount?: number
          qualify_within_days?: number
          require_subscription?: boolean
          reward_hold_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      referral_tiers: {
        Row: {
          bonus_multiplier: number
          color: string | null
          display_name: string
          icon: string | null
          level: Database["public"]["Enums"]["referral_tier_level"]
          min_referrals: number
          perks: Json
        }
        Insert: {
          bonus_multiplier?: number
          color?: string | null
          display_name: string
          icon?: string | null
          level: Database["public"]["Enums"]["referral_tier_level"]
          min_referrals: number
          perks?: Json
        }
        Update: {
          bonus_multiplier?: number
          color?: string | null
          display_name?: string
          icon?: string | null
          level?: Database["public"]["Enums"]["referral_tier_level"]
          min_referrals?: number
          perks?: Json
        }
        Relationships: []
      }
      referral_wallet: {
        Row: {
          ai_credits_balance: number
          credits_balance: number
          lifetime_earned: number
          lifetime_spent: number
          months_balance: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          ai_credits_balance?: number
          credits_balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          months_balance?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          ai_credits_balance?: number
          credits_balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          months_balance?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          approved_at: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          code_id: string | null
          code_text: string | null
          created_at: string
          device_fingerprint: string | null
          hold_until: string | null
          id: string
          ip_address: string | null
          meta: Json
          referred_email: string | null
          referred_org_role: string | null
          referred_user_id: string | null
          referrer_id: string
          registered_at: string | null
          rejected_at: string | null
          rejected_reason: string | null
          reward_ai_credits: number
          reward_credits: number
          reward_months: number
          status: Database["public"]["Enums"]["referral_status"]
          subscribed_at: string | null
          subscription_amount: number | null
          subscription_module: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          code_id?: string | null
          code_text?: string | null
          created_at?: string
          device_fingerprint?: string | null
          hold_until?: string | null
          id?: string
          ip_address?: string | null
          meta?: Json
          referred_email?: string | null
          referred_org_role?: string | null
          referred_user_id?: string | null
          referrer_id: string
          registered_at?: string | null
          rejected_at?: string | null
          rejected_reason?: string | null
          reward_ai_credits?: number
          reward_credits?: number
          reward_months?: number
          status?: Database["public"]["Enums"]["referral_status"]
          subscribed_at?: string | null
          subscription_amount?: number | null
          subscription_module?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          code_id?: string | null
          code_text?: string | null
          created_at?: string
          device_fingerprint?: string | null
          hold_until?: string | null
          id?: string
          ip_address?: string | null
          meta?: Json
          referred_email?: string | null
          referred_org_role?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          registered_at?: string | null
          rejected_at?: string | null
          rejected_reason?: string | null
          reward_ai_credits?: number
          reward_credits?: number
          reward_months?: number
          status?: Database["public"]["Enums"]["referral_status"]
          subscribed_at?: string | null
          subscription_amount?: number | null
          subscription_module?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_clinics: {
        Row: {
          accepts_remote_patients: boolean | null
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          category: string | null
          click_merchant_id: string | null
          click_service_id: string | null
          created_at: string
          description: string | null
          director_name: string | null
          email: string | null
          id: string
          iin: string | null
          inn: string | null
          is_active: boolean | null
          latitude: number | null
          legal_name: string | null
          license_number: string | null
          logo_external_url: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          payme_merchant_id: string | null
          payment_enabled: boolean
          phone: string | null
          service_city: string | null
          service_radius_km: number | null
          social_links: Json | null
          specialties: string[] | null
          telegram: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          accepts_remote_patients?: boolean | null
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          category?: string | null
          click_merchant_id?: string | null
          click_service_id?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          iin?: string | null
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_external_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          payme_merchant_id?: string | null
          payment_enabled?: boolean
          phone?: string | null
          service_city?: string | null
          service_radius_km?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          accepts_remote_patients?: boolean | null
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          category?: string | null
          click_merchant_id?: string | null
          click_service_id?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          iin?: string | null
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_external_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          payme_merchant_id?: string | null
          payment_enabled?: boolean
          phone?: string | null
          service_city?: string | null
          service_radius_km?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      registered_cosmetology: {
        Row: {
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          city: string | null
          created_at: string
          description: string | null
          director_name: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          latitude: number | null
          legal_name: string | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string | null
          region: string | null
          social_links: Json | null
          specialties: string[] | null
          telegram: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone?: string | null
          region?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          region?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      registered_dental_clinics: {
        Row: {
          address: string
          branches: Json | null
          city: string
          created_at: string
          director_name: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          license_number: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string
          region: string
          subscription_expires_at: string | null
          subscription_plan: string
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address: string
          branches?: Json | null
          city?: string
          created_at?: string
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone: string
          region?: string
          subscription_expires_at?: string | null
          subscription_plan?: string
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string
          branches?: Json | null
          city?: string
          created_at?: string
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          license_number?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string
          region?: string
          subscription_expires_at?: string | null
          subscription_plan?: string
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      registered_diagnostics: {
        Row: {
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          city: string | null
          created_at: string
          description: string | null
          director_name: string | null
          email: string | null
          equipment_info: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          latitude: number | null
          legal_name: string | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string | null
          region: string | null
          social_links: Json | null
          specialties: string[] | null
          telegram: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          equipment_info?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone?: string | null
          region?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          equipment_info?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          region?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      registered_maternity: {
        Row: {
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          city: string | null
          created_at: string
          description: string | null
          director_name: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          latitude: number | null
          legal_name: string | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string | null
          region: string | null
          room_types: string | null
          social_links: Json | null
          specialties: string[] | null
          telegram: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone?: string | null
          region?: string | null
          room_types?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          region?: string | null
          room_types?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      registered_pharmacies: {
        Row: {
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          avg_rating: number | null
          city: string | null
          created_at: string
          description: string | null
          director_name: string | null
          email: string | null
          founded_year: number | null
          has_delivery: boolean | null
          id: string
          inn: string | null
          is_24h: boolean | null
          is_active: boolean | null
          latitude: number | null
          legal_name: string | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          pharmacy_type: string
          phone: string | null
          region: string | null
          review_count: number | null
          social_links: Json | null
          specialties: string[] | null
          telegram: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          avg_rating?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          founded_year?: number | null
          has_delivery?: boolean | null
          id?: string
          inn?: string | null
          is_24h?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          pharmacy_type?: string
          phone?: string | null
          region?: string | null
          review_count?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          avg_rating?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          director_name?: string | null
          email?: string | null
          founded_year?: number | null
          has_delivery?: boolean | null
          id?: string
          inn?: string | null
          is_24h?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          pharmacy_type?: string
          phone?: string | null
          region?: string | null
          review_count?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          comment: string | null
          created_at: string
          doctor_id: string | null
          id: string
          is_approved: boolean | null
          patient_id: string
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          comment?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_approved?: boolean | null
          patient_id: string
          rating: number
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          comment?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_approved?: boolean | null
          patient_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "registered_clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          detail: Json | null
          id: string
          ip: string | null
          module_id: string | null
          owner_id: string | null
          resource: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          detail?: Json | null
          id?: string
          ip?: string | null
          module_id?: string | null
          owner_id?: string | null
          resource?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          detail?: Json | null
          id?: string
          ip?: string | null
          module_id?: string | null
          owner_id?: string | null
          resource?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      saas_modules: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      saas_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          limits: Json
          module_id: string
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json
          module_id: string
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json
          module_id?: string
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_plans_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "saas_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_usage_counters: {
        Row: {
          id: string
          metric: string
          module_id: string
          owner_id: string
          period_start: string
          updated_at: string | null
          used: number
        }
        Insert: {
          id?: string
          metric: string
          module_id: string
          owner_id: string
          period_start?: string
          updated_at?: string | null
          used?: number
        }
        Update: {
          id?: string
          metric?: string
          module_id?: string
          owner_id?: string
          period_start?: string
          updated_at?: string | null
          used?: number
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      telegram_otp: {
        Row: {
          chat_id: number | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          otp_code: string | null
          otp_expires_at: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          otp_code?: string | null
          otp_expires_at?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          otp_code?: string | null
          otp_expires_at?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_period: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_invoice_id: string | null
          metadata: Json | null
          module_id: string
          owner_id: string
          plan_id: string | null
          started_at: string | null
          status: string
          tenant_ref_id: string | null
          tenant_type: string
          tier: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          billing_period?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_invoice_id?: string | null
          metadata?: Json | null
          module_id: string
          owner_id: string
          plan_id?: string | null
          started_at?: string | null
          status?: string
          tenant_ref_id?: string | null
          tenant_type?: string
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          billing_period?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_invoice_id?: string | null
          metadata?: Json | null
          module_id?: string
          owner_id?: string
          plan_id?: string | null
          started_at?: string | null
          status?: string
          tenant_ref_id?: string | null
          tenant_type?: string
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "saas_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "ai_subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          expires_at: string
          id: string
          package_name: string | null
          purchased_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          expires_at?: string
          id?: string
          package_name?: string | null
          purchased_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          expires_at?: string
          id?: string
          package_name?: string | null
          purchased_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_location_consent: {
        Row: {
          background_enabled: boolean
          created_at: string
          granted: boolean
          last_lat: number | null
          last_lng: number | null
          last_seen_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_enabled?: boolean
          created_at?: string
          granted?: boolean
          last_lat?: number | null
          last_lng?: number | null
          last_seen_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_enabled?: boolean
          created_at?: string
          granted?: boolean
          last_lat?: number | null
          last_lng?: number | null
          last_seen_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_segments: {
        Row: {
          created_at: string | null
          id: string
          intent_avg: number | null
          last_activity_at: string | null
          metadata: Json | null
          preferred_specialties: string[] | null
          segment: string
          total_clicks: number | null
          total_conversions: number | null
          total_searches: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent_avg?: number | null
          last_activity_at?: string | null
          metadata?: Json | null
          preferred_specialties?: string[] | null
          segment?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_searches?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intent_avg?: number | null
          last_activity_at?: string | null
          metadata?: Json | null
          preferred_specialties?: string[] | null
          segment?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_searches?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          actual_date: string | null
          baby_id: string
          created_at: string
          id: string
          is_completed: boolean | null
          notes: string | null
          scheduled_date: string
          user_id: string
          vaccine_name: string
        }
        Insert: {
          actual_date?: string | null
          baby_id: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          scheduled_date: string
          user_id: string
          vaccine_name: string
        }
        Update: {
          actual_date?: string | null
          baby_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          scheduled_date?: string
          user_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      referral_leaderboard: {
        Row: {
          org_role: string | null
          owner_id: string | null
          rank: number | null
          total_rewards_credits: number | null
          total_uses: number | null
        }
        Relationships: []
      }
      registered_clinics_public: {
        Row: {
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          director_name: string | null
          email: string | null
          id: string | null
          iin: string | null
          inn: string | null
          is_active: boolean | null
          latitude: number | null
          legal_name: string | null
          license_number: string | null
          logo_external_url: string | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          owner_id: string | null
          phone: string | null
          social_links: Json | null
          specialties: string[] | null
          telegram: string | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string | null
          iin?: string | null
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_external_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          owner_id?: string | null
          phone?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          additional_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string | null
          iin?: string | null
          inn?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          license_number?: string | null
          logo_external_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          owner_id?: string | null
          phone?: string | null
          social_links?: Json | null
          specialties?: string[] | null
          telegram?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_review_contract: {
        Args: { _contract_id: string; _decision: string; _notes?: string }
        Returns: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["contract_approval_status"]
          approved_at: string | null
          approved_by: string | null
          body_ru: string
          body_uz: string
          category_slug: string | null
          collected_signatures: number
          contract_number: string
          counterparty_id: string | null
          counterparty_name: string | null
          created_at: string
          effective_from: string | null
          effective_until: string | null
          filled_data: Json
          hash_id: string
          id: string
          language: string
          meta: Json
          organization_id: string | null
          owner_id: string
          owner_role: Database["public"]["Enums"]["contract_party_role"]
          pdf_url: string | null
          pdf_watermark: string | null
          rejected_reason: string | null
          required_signatures: number
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          template_id: string | null
          template_version: string
          terminated_at: string | null
          terminated_reason: string | null
          title_ru: string
          title_uz: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_referral_reward: {
        Args: { _referral_id: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_webhook_event: {
        Args: { _event: string; _payload: Json }
        Returns: number
      }
      ensure_referral_code: {
        Args: { _kind?: string; _org_role?: string; _owner_id: string }
        Returns: string
      }
      ensure_referral_wallet: {
        Args: { _owner_id: string }
        Returns: undefined
      }
      generate_referral_code: { Args: { _owner_id: string }; Returns: string }
      get_referral_stats: {
        Args: { _owner_id: string }
        Returns: {
          approved_count: number
          conversion_rate: number
          current_tier: string
          next_tier_min: number
          pending_count: number
          subscribed_count: number
          total_ai_credits: number
          total_credits: number
          total_invites: number
          total_months: number
        }[]
      }
      get_saas_access: {
        Args: { _module: string; _owner_id: string }
        Returns: {
          expires_at: string
          features: Json
          limits: Json
          status: string
          tier: string
        }[]
      }
      get_user_ai_access: {
        Args: { _user_id: string }
        Returns: {
          allowed_services: Json
          daily_limit: number
          expires_at: string
          monthly_limit: number
          plan_id: string
          status: string
          tier: string
          used_month: number
          used_today: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_knowledge_view: {
        Args: { _article_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      release_held_referral_rewards: { Args: never; Returns: number }
      revoke_referral_reward: {
        Args: { _reason?: string; _referral_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "patient"
        | "clinic"
        | "admin"
        | "vendor"
        | "diagnostics"
        | "maternity"
        | "cosmetology"
        | "doctor"
        | "pharmacy"
        | "bloodbank"
        | "dental"
      contract_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "not_required"
      contract_party_role:
        | "platform"
        | "clinic"
        | "partner"
        | "patient"
        | "api_partner"
        | "organization"
        | "staff"
      contract_status:
        | "draft"
        | "pending_signature"
        | "active"
        | "expired"
        | "terminated"
        | "cancelled"
      referral_reward_kind: "credits" | "months" | "ai_credits"
      referral_status:
        | "pending"
        | "registered"
        | "subscribed"
        | "approved"
        | "rejected"
        | "fraud"
        | "expired"
        | "cancelled"
      referral_tier_level: "bronze" | "silver" | "gold" | "platinum" | "vip"
      signature_method: "otp" | "canvas" | "otp_canvas" | "checkbox"
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
      app_role: [
        "patient",
        "clinic",
        "admin",
        "vendor",
        "diagnostics",
        "maternity",
        "cosmetology",
        "doctor",
        "pharmacy",
        "bloodbank",
        "dental",
      ],
      contract_approval_status: [
        "pending",
        "approved",
        "rejected",
        "not_required",
      ],
      contract_party_role: [
        "platform",
        "clinic",
        "partner",
        "patient",
        "api_partner",
        "organization",
        "staff",
      ],
      contract_status: [
        "draft",
        "pending_signature",
        "active",
        "expired",
        "terminated",
        "cancelled",
      ],
      referral_reward_kind: ["credits", "months", "ai_credits"],
      referral_status: [
        "pending",
        "registered",
        "subscribed",
        "approved",
        "rejected",
        "fraud",
        "expired",
        "cancelled",
      ],
      referral_tier_level: ["bronze", "silver", "gold", "platinum", "vip"],
      signature_method: ["otp", "canvas", "otp_canvas", "checkbox"],
    },
  },
} as const
