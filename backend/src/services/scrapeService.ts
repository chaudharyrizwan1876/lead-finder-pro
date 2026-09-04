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

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractBusinessData(page: import('playwright').Page) {
  return page.evaluate(() => {
    const getText = (sel: string) =>
      (document as any).querySelector(sel)?.textContent?.trim() || null;

    // Google apni class names/markup badalta rehta hai, isliye har field ke
    // liye multiple fallback selectors try karo
    const nameSelectors = ['h1.DUwDvf', 'h1.fontHeadlineLarge', 'h1'];
    let name: string | null = null;
    for (const sel of nameSelectors) {
      name = getText(sel);
      if (name) break;
    }

    const phoneSelectors = [
      'button[data-item-id*="phone"]',
      'button[aria-label*="Phone"]',
      'button[aria-label*="phone"]',
    ];
    let phone: string | null = null;
    for (const sel of phoneSelectors) {
      const el = (document as any).querySelector(sel);
      const dataId = el?.getAttribute('data-item-id')?.replace('phone:tel:', '');
      const ariaLabel = el?.getAttribute('aria-label')?.replace(/^Phone:\s*/i, '');
      phone = dataId || ariaLabel || null;
      if (phone) break;
    }

    const addressSelectors = ['button[data-item-id="address"]', 'button[aria-label*="Address"]'];
    let address: string | null = null;
    for (const sel of addressSelectors) {
      const el = (document as any).querySelector(sel);
      address =
        el?.querySelector('.fontBodyMedium')?.textContent?.trim() ||
        el?.getAttribute('aria-label')?.replace(/^Address:\s*/i, '') ||
        null;
      if (address) break;
    }

    const websiteSelectors = ['a[data-item-id="authority"]', 'a[aria-label*="Website"]'];
    let website: string | null = null;
    for (const sel of websiteSelectors) {
      website = (document as any).querySelector(sel)?.getAttribute('href') || null;
      if (website) break;
    }

    const ratingSelectors = ['div.F7nice span[aria-hidden="true"]', 'span.MW4etd'];
    let rating: number | null = null;
    for (const sel of ratingSelectors) {
      const text = getText(sel);
      if (text) {
        rating = parseFloat(text);
        if (!isNaN(rating)) break;
      }
    }

    const reviewsSelectors = ['div.F7nice span[aria-label*="reviews"]', 'span.UY7F9'];
    let reviews: number | null = null;
    for (const sel of reviewsSelectors) {
      const el = (document as any).querySelector(sel);
      const text = el?.getAttribute('aria-label') || el?.textContent || '';
      const parsed = parseInt(text.replace(/[^0-9]/g, ''));
      if (!isNaN(parsed)) {
        reviews = parsed;
        break;
      }
    }

    return { name, phone, address, website, rating, reviews };
  });
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

    const maxAttempts = 2;

    for (const link of links) {
      let data: Awaited<ReturnType<typeof extractBusinessData>> | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(2000);
          const parsed = await extractBusinessData(page);
          if (parsed.name) {
            data = parsed;
            break;
          }
          console.log(`Attempt ${attempt}: name nahi mila, retry kar raha hai...`);
        } catch {
          console.log(`Attempt ${attempt} fail ho gaya`);
        }
        if (attempt < maxAttempts) await randomDelay(800, 1500);
      }

      if (data && data.name) {
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
      } else {
        console.log('Ek business skip ho gaya (retries ke baad bhi nahi mila)');
      }

      // Google ko lagataar requests na bhejo, ban/captcha risk kam karo
      await randomDelay(1000, 2200);
    }
  } catch (error) {
    console.error('Scrape error:', error);
  } finally {
    await browser.close();
  }

  return results;
}