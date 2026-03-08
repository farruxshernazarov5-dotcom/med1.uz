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
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
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
      diagnostics_appointments: {
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
      diagnostics_services: {
        Row: {
          category: string
          center_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          preparation_info: string | null
          price: number
        }
        Insert: {
          category?: string
          center_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          preparation_info?: string | null
          price?: number
        }
        Update: {
          category?: string
          center_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          preparation_info?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_services_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "registered_diagnostics"
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
        ]
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
      platform_plans: {
        Row: {
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
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          phone: string | null
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
          phone?: string | null
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
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registered_clinics: {
        Row: {
          additional_phone: string | null
          address: string | null
          amenities: string[] | null
          category: string | null
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
          phone: string | null
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
          category?: string | null
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
          phone?: string | null
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
          category?: string | null
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
          phone?: string | null
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
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      ],
    },
  },
} as const
