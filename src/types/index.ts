export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};
