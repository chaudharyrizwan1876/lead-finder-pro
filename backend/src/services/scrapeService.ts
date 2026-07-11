import { chromium } from 'playwright';
import { Business } from '../types';

function getResultLimit(radiusKm: number): number {
  if (radiusKm <= 25) return 15;
  if (radiusKm <= 75) return 25;
  if (radiusKm <= 150) return 35;
  return 50;
}

function toWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 8 ? digits : null;
}

export async function scrapeGoogleMaps(
  businessType: string,
  city: string,
  radiusKm: number = 10
): Promise<Business[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const results: Business[] = [];
  const resultLimit = getResultLimit(radiusKm);

  try {
    const searchQuery = `${businessType} in ${city}`;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    console.log(`Google Maps URL khol raha hai... (target: ${resultLimit} results)`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    console.log('Results list dhundh raha hai...');
    const listSelector = 'div[role="feed"]';

    try {
      await page.waitForSelector(listSelector, { timeout: 15000 });
    } catch {
      console.log('Results list nahi mili');
      await browser.close();
      return results;
    }

    const scrollCount = resultLimit <= 15 ? 5 : resultLimit <= 25 ? 8 : 12;
    console.log(`Scroll kar raha hai (${scrollCount} baar)...`);
    for (let i = 0; i < scrollCount; i++) {
      await page.evaluate((sel: string) => {
        const el = (document as any).querySelector(sel);
        if (el) el.scrollTop += 1000;
      }, listSelector);
      await page.waitForTimeout(1200);
    }

    const links: string[] = await page.$$eval(
      'a[href*="/maps/place/"]',
      (els: Element[], limit: number) =>
        els
          .map((el) => (el as any).href as string)
          .filter((h: string, i: number, arr: string[]) => arr.indexOf(h) === i)
          .slice(0, limit),
      resultLimit
    );

    console.log(`${links.length} business links mile`);

    for (const link of links) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        const data = await page.evaluate(() => {
          const getText = (sel: string) =>
            (document as any).querySelector(sel)?.textContent?.trim() || null;

          const name = getText('h1');

          const phoneEl = (document as any).querySelector('button[data-item-id*="phone"]');
          const phone = phoneEl?.getAttribute('data-item-id')?.replace('phone:tel:', '') || null;

          const addressEl = (document as any).querySelector('button[data-item-id="address"]');
          const address = addressEl?.querySelector('.fontBodyMedium')?.textContent?.trim() || null;

          const websiteEl = (document as any).querySelector('a[data-item-id="authority"]');
          const website = websiteEl?.getAttribute('href') || null;

          const ratingEl = (document as any).querySelector('div.F7nice span[aria-hidden="true"]');
          const rating = ratingEl ? parseFloat(ratingEl.textContent || '0') : null;

          const reviewsEl = (document as any).querySelector('div.F7nice span[aria-label*="reviews"]');
          const reviewsText = reviewsEl?.getAttribute('aria-label') || '';
          const reviews = parseInt(reviewsText.replace(/[^0-9]/g, '')) || null;

          return { name, phone, address, website, rating, reviews };
        });

        if (data.name) {
          console.log(`Mila: ${data.name}`);
          const isFacebook = data.website && data.website.includes('facebook.com');
          results.push({
            name: data.name,
            type: businessType,
            address: data.address || 'N/A',
            phone: data.phone,
            whatsapp: toWhatsApp(data.phone),
            email: null,
            emailSource: null,
            website: isFacebook ? null : data.website,
            facebookUrl: isFacebook ? data.website : null,
            rating: data.rating,
            reviews: data.reviews,
            lat: null,
            lon: null,
            source: 'googlemaps',
          });
        }
      } catch {
        console.log('Ek business skip ho gaya');
        continue;
      }
    }
  } catch (error) {
    console.error('Scrape error:', error);
  } finally {
    await browser.close();
  }

  return results;
}