export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  categoryAr: string;
  categoryEn: string;
  rating?: number;
  ratingCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCoords: {
    lat: number;
    lng: number;
  } | null;
  items: {
    productId: string;
    productNameAr: string;
    productNameEn: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  status: 'pending' | 'completed';
  createdAt: string;
  rating?: number;
  ratingComment?: string;
}

export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  storeLogo: string; // URL or base64
  adminWhatsapp: string; // Phone number e.g. "966500000000"
}
