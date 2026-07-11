export interface Business {
  name: string;
  type: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  emailSource: 'website' | 'facebook' | 'guessed' | null;
  website: string | null;
  facebookUrl: string | null;
  rating: number | null;
  reviews: number | null;
  lat: number | null;
  lon: number | null;
  source: 'openstreetmap' | 'googlemaps';
}

export interface SearchParams {
  businessType: string;
  city: string;
  radius: number;
  useGoogleMaps: boolean;
}

export interface SearchResponse {
  success: boolean;
  total: number;
  withEmail: number;
  withPhone: number;
  withoutWebsite: number;
  data: Business[];
}