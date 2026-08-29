export type PaymentMode = "cash" | "online";
export type OrderStatus = "en_attente" | "en_préparation" | "servi";

export interface Tenant {
  id: string;
  owner_id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
  langue_defaut: string;
  mode_paiement: PaymentMode;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  tenant_id: string;
  numero: string;
  qr_code_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  nom: string;
  ordre: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  nom: string;
  description: string | null;
  prix: number;
  disponible: boolean;
  photo_url: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  table_id: string;
  statut: OrderStatus;
  mode_paiement: PaymentMode;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantite: number;
  prix_unitaire: number;
}
