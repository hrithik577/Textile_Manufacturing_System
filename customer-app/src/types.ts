export interface FabricProduct {
  id: string;
  sku: string;
  title: string;
  category: 'Cotton' | 'Denim' | 'Silk' | 'Linen' | 'Recycled Poly' | 'Knits' | 'Suiting';
  tagline: string;
  rating: number;
  reviewsCount: number;
  isAssured: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  basePricePerMeter: number;
  mrpPerMeter: number;
  discountPercent: number;
  moqMeters: number;
  samplePrice: number;
  composition: string;
  yarnCount: string;
  gsm: number;
  widthInches: number;
  weaveStructure: string;
  certifications: string[]; // e.g. ["GOTS Organic", "OEKO-TEX Standard 100", "BCI"]
  colors: {
    name: string;
    hex: string;
    pantone: string;
    stockMeters: number;
  }[];
  feelMetrics: {
    softness: number; // 1 to 5
    breathability: number;
    stretch: number;
    durability: number;
  };
  suitableFor: string[]; // e.g. ["Shirts", "Dresses", "Tops", "Summer Wear"]
  tieredPricing: {
    minMeters: number;
    maxMeters: number;
    pricePerMeter: number;
  }[];
  leadTimeDays: number;
  images: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  fabricType: string;
  selectedColor: {
    name: string;
    hex: string;
    pantone: string;
  };
  gsm: number;
  isSampleOnly: boolean;
  quantityMeters: number;
  unitPrice: number;
  totalPrice: number;
  sampleSwatchIncluded: boolean;
}

export interface CustomerOrderRecord {
  id: string;
  orderNumber: string;
  placedAt: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  cityStatePincode: string;
  gstNumber?: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'NetBanking' | '30-Day Mill Credit' | 'Cash on Delivery';
  paymentStatus: 'Paid' | 'Credit Approved' | 'Pending';
  productionStage: 'Order Confirmed' | 'Yarn Spinning' | 'Fabric Weaving' | 'Dyehouse' | 'QA Inspection' | 'Dispatched' | 'Delivered';
  stageProgressPercent: number;
  estimatedDeliveryDate: string;
  assignedLoomMachine?: string;
  carrierTrackingNumber?: string;
  carrierName?: string;
  qualityCertificateNumber?: string;
}
