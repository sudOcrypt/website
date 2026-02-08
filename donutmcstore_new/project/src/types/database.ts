export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          discord_id: string;
          discord_username: string;
          discord_avatar: string | null;
          email: string | null;
          minecraft_username: string | null;
          is_admin: boolean;
          last_ip_address: string | null;
          last_login_at: string | null;
          is_vpn_user: boolean;
          isp_organization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          discord_id: string;
          discord_username: string;
          discord_avatar?: string | null;
          email?: string | null;
          minecraft_username?: string | null;
          is_admin?: boolean;
          last_ip_address?: string | null;
          last_login_at?: string | null;
          is_vpn_user?: boolean;
          isp_organization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discord_id?: string;
          discord_username?: string;
          discord_avatar?: string | null;
          email?: string | null;
          minecraft_username?: string | null;
          is_admin?: boolean;
          last_ip_address?: string | null;
          last_login_at?: string | null;
          is_vpn_user?: boolean;
          isp_organization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category: string;
          title: string;
          description: string | null;
          image_url: string | null;
          price: number;
          original_price: number | null;
          stock: number;
          is_active: boolean;
          sort_order: number;
          square_catalog_object_id: string | null;
          square_variation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          price: number;
          original_price?: number | null;
          stock?: number;
          is_active?: boolean;
          sort_order?: number;
          square_catalog_object_id?: string | null;
          square_variation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          price?: number;
          original_price?: number | null;
          stock?: number;
          is_active?: boolean;
          sort_order?: number;
          square_catalog_object_id?: string | null;
          square_variation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          minecraft_username: string;
          total_amount: number;
          status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
          notes: string | null;
          square_checkout_id: string | null;
          discord_id: string | null;
          stock_decremented: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          minecraft_username: string;
          total_amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
          notes?: string | null;
          square_checkout_id?: string | null;
          discord_id?: string | null;
          stock_decremented?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          minecraft_username?: string;
          total_amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
          notes?: string | null;
          square_checkout_id?: string | null;
          discord_id?: string | null;
          stock_decremented?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          rating: number;
          content: string;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          rating: number;
          content: string;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          rating?: number;
          content?: string;
          is_approved?: boolean;
          created_at?: string;
        };
      };
      bans: {
        Row: {
          id: string;
          ban_type: 'discord_id' | 'user_id' | 'ip_address';
          ban_value: string;
          reason: string | null;
          banned_by: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ban_type: 'discord_id' | 'user_id' | 'ip_address';
          ban_value: string;
          reason?: string | null;
          banned_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ban_type?: 'discord_id' | 'user_id' | 'ip_address';
          ban_value?: string;
          reason?: string | null;
          banned_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      admin_notifications: {
        Row: {
          id: string;
          type: 'new_order' | 'new_schematic' | 'new_review' | 'payment_failed';
          title: string;
          message: string | null;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'new_order' | 'new_schematic' | 'new_review' | 'payment_failed';
          title: string;
          message?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'new_order' | 'new_schematic' | 'new_review' | 'payment_failed';
          title?: string;
          message?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      schematics: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          file_path: string;
          preview_image_path: string | null;
          is_anonymous: boolean;
          status: 'pending' | 'approved' | 'rejected';
          download_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          file_path: string;
          preview_image_path?: string | null;
          is_anonymous?: boolean;
          status?: 'pending' | 'approved' | 'rejected';
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          file_path?: string;
          preview_image_path?: string | null;
          is_anonymous?: boolean;
          status?: 'pending' | 'approved' | 'rejected';
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      login_logs: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          is_vpn_suspected: boolean;
          isp_org: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_vpn_suspected?: boolean;
          isp_org?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_vpn_suspected?: boolean;
          isp_org?: string | null;
          created_at?: string;
        };
      };
      banners: {
        Row: {
          id: string;
          message: string;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          display_order: number;
          background_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          display_order?: number;
          background_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          display_order?: number;
          background_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type User = Database['public']['Tables']['users']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Schematic = Database['public']['Tables']['schematics']['Row'];
export type LoginLog = Database['public']['Tables']['login_logs']['Row'];
export type Ban = Database['public']['Tables']['bans']['Row'];
export type AdminNotification = Database['public']['Tables']['admin_notifications']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Banner = Database['public']['Tables']['banners']['Row'];

export type CartItem = {
  product: Product;
  quantity: number;
};
