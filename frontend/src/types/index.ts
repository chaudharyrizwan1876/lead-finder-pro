export interface Business {
  name: string;
  type: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  emailSource: 'website' | 'facebook' | 'guessed' | null;
  emailStatus?: 'valid' | 'risky' | 'invalid' | null;
  website: string | null;
  facebookUrl: string | null;
  rating: number | null;
  reviews: number | null;
  lat: number | null;
  lon: number | null;
  source: 'openstreetmap' | 'googlemaps';
  isNew?: boolean;
  firstSeenAt?: string;
  id?: number;
  status?: LeadStatus;
  notes?: string | null;
  contactedAt?: string | null;
}

export type LeadStatus = 'new' | 'contacted' | 'replied' | 'converted' | 'not_interested';

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
  newLeads: number;
  data: Business[];
}