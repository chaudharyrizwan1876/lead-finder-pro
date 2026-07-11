import axios from 'axios';
import { Business, SearchParams } from '../types';

const OSM_API = 'https://overpass.kumi.systems/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

const businessTypeMap: Record<string, string> = {
  dentist: 'amenity=dentist',
  restaurant: 'amenity=restaurant',
  cafe: 'amenity=cafe',
  gym: 'leisure=fitness_centre',
  hotel: 'tourism=hotel',
  lawyer: 'office=lawyer',
  real_estate: 'office=estate_agent',
  salon: 'shop=hairdresser',
  clinic: 'amenity=clinic',
  school: 'amenity=school',
  university: 'amenity=university',
  hospital: 'amenity=hospital',
  pharmacy: 'amenity=pharmacy',
  veterinary: 'amenity=veterinary',
  car_dealer: 'shop=car',
  car_repair: 'shop=car_repair',
  travel_agency: 'shop=travel_agency',
  wedding_hall: 'amenity=events_venue',
  photographer: 'shop=photo',
  bank: 'amenity=bank',
  insurance: 'office=insurance',
  furniture: 'shop=furniture',
  electronics: 'shop=electronics',
  clothing: 'shop=clothes',
  supermarket: 'shop=supermarket',
  jewelry: 'shop=jewelry',
  bakery: 'shop=bakery',
};

function toWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 8 ? digits : null;
}

function extractFacebookUrl(tags: any): string | null {
  const candidates = [tags.website, tags['contact:website'], tags['contact:facebook']];
  for (const c of candidates) {
    if (c && c.includes('facebook.com')) return c;
  }
  return null;
}

async function getCityCoordinates(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await axios.get(NOMINATIM_API, {
      params: { q: city, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'LeadFinderPro/1.0' },
      timeout: 10000,
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Nominatim Error:', error);
    return null;
  }
}

function getQueryConfig(radiusKm: number) {
  if (radiusKm <= 25) return { limit: 200, timeout: 25 };
  if (radiusKm <= 75) return { limit: 300, timeout: 40 };
  if (radiusKm <= 150) return { limit: 400, timeout: 60 };
  return { limit: 500, timeout: 90 };
}

export async function searchOSM(params: SearchParams): Promise<Business[]> {
  try {
    const osmTag = businessTypeMap[params.businessType] || 'amenity=restaurant';
    const [key, value] = osmTag.split('=');

    console.log(`${params.city} ke coordinates dhundh raha hai...`);
    const coords = await getCityCoordinates(params.city);

    if (!coords) {
      console.log('City coordinates nahi mile');
      return [];
    }

    console.log(`Coordinates mile: ${coords.lat}, ${coords.lon}`);

    const radiusMeters = params.radius * 1000;
    const { limit, timeout } = getQueryConfig(params.radius);

    console.log(`Radius: ${params.radius}km, Result limit: ${limit}, Query timeout: ${timeout}s`);

    const query = `[out:json][timeout:${timeout}];(node["${key}"="${value}"](around:${radiusMeters},${coords.lat},${coords.lon});way["${key}"="${value}"](around:${radiusMeters},${coords.lat},${coords.lon}););out body ${limit};>;out skel qt;`;

    const response = await axios({
      method: 'post',
      url: OSM_API,
      data: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: (timeout + 10) * 1000,
    });

    const elements = response.data.elements || [];

    const businesses: Business[] = elements
      .filter((el: any) => el.tags && el.tags.name)
      .map((el: any) => {
        const website = el.tags.website || el.tags['contact:website'] || null;
        const phone = el.tags.phone || el.tags['contact:phone'] || null;
        return {
          name: el.tags.name || 'Unknown',
          type: params.businessType,
          address: buildAddress(el.tags),
          phone,
          whatsapp: toWhatsApp(phone),
          email: el.tags.email || el.tags['contact:email'] || null,
          emailSource: el.tags.email || el.tags['contact:email'] ? ('website' as const) : null,
          website,
          facebookUrl: extractFacebookUrl(el.tags),
          rating: null,
          reviews: null,
          lat: el.lat || null,
          lon: el.lon || null,
          source: 'openstreetmap' as const,
        };
      });

    console.log(`OSM se ${businesses.length} results mile (limit tha ${limit})`);
    return businesses;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error('OSM Error: Query timeout ho gaya, radius kam karke try karo');
    } else {
      console.error('OSM Error:', error.response?.status, error.response?.data || error.message);
    }
    return [];
  }
}

function buildAddress(tags: any): string {
  const parts = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}