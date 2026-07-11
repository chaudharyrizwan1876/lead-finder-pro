import axios from 'axios';
import * as cheerio from 'cheerio';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function cleanEmail(raw: string): string {
  let email = decodeURIComponent(raw).trim();
  email = email.replace(/^[^a-zA-Z0-9]+/, '');
  return email;
}

function extractEmailsFromHtml(html: unknown): string[] {
  // Safety check - sirf string pe match() chalao
  if (typeof html !== 'string') return [];

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];

  return matches
    .map(cleanEmail)
    .filter(
      (e) =>
        e.includes('@') &&
        !e.includes('noreply') &&
        !e.includes('no-reply') &&
        !e.includes('example') &&
        !e.includes('sentry') &&
        !e.includes('wix') &&
        !e.includes('.png') &&
        !e.includes('.jpg') &&
        !e.includes('.svg') &&
        !e.includes('domain.com') &&
        e.length < 60
    );
}

async function tryFetch(url: string, timeout = 8000): Promise<string | null> {
  try {
    const res = await axios.get(url, {
      timeout,
      headers: HEADERS,
      responseType: 'text',
      transformResponse: [(data) => data], // axios ko auto-JSON-parse se roko, raw text rakho
    });
    return typeof res.data === 'string' ? res.data : null;
  } catch {
    return null;
  }
}

async function findFromWebsitePages(baseUrl: string): Promise<string | null> {
  const homepageHtml = await tryFetch(baseUrl);
  if (!homepageHtml) return null;

  const directEmails = extractEmailsFromHtml(homepageHtml);
  if (directEmails.length > 0) return directEmails[0];

  let mailtoEmail: string | null = null;
  try {
    const $ = cheerio.load(homepageHtml);
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = cleanEmail(href.replace('mailto:', '').split('?')[0]);
      if (email.includes('@')) {
        mailtoEmail = email;
        return false;
      }
    });
  } catch {
    // cheerio parse fail ho jaye to ignore karo
  }
  if (mailtoEmail) return mailtoEmail;

  const contactPaths = ['/contact', '/contact-us', '/contactus', '/about', '/about-us'];
  for (const path of contactPaths) {
    const contactUrl = baseUrl.replace(/\/$/, '') + path;
    const contactHtml = await tryFetch(contactUrl, 6000);
    if (contactHtml) {
      const emails = extractEmailsFromHtml(contactHtml);
      if (emails.length > 0) return emails[0];
    }
  }

  return null;
}

async function findFromPrivacyPage(baseUrl: string): Promise<string | null> {
  const privacyPaths = ['/privacy-policy', '/privacy', '/terms', '/terms-of-service', '/legal'];
  for (const path of privacyPaths) {
    const url = baseUrl.replace(/\/$/, '') + path;
    const html = await tryFetch(url, 6000);
    if (html) {
      const emails = extractEmailsFromHtml(html);
      if (emails.length > 0) return emails[0];
    }
  }
  return null;
}

async function findFromSchemaData(baseUrl: string): Promise<string | null> {
  const html = await tryFetch(baseUrl);
  if (!html) return null;

  let schemaEmail: string | null = null;
  try {
    const $ = cheerio.load(html);
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const jsonStr = JSON.stringify(json);
        const emails = extractEmailsFromHtml(jsonStr);
        if (emails.length > 0) {
          schemaEmail = emails[0];
          return false;
        }
      } catch {
        // invalid JSON, skip
      }
    });
  } catch {
    // cheerio parse fail
  }

  return schemaEmail;
}

async function tryCommonPatterns(domain: string): Promise<string | null> {
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return null;
    return `info@${domain}`;
  } catch {
    return null;
  }
}

export async function findEmail(website: string): Promise<string | null> {
  let url = website;
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }

  let email = await findFromWebsitePages(url);
  if (email) return email;

  email = await findFromPrivacyPage(url);
  if (email) return email;

  email = await findFromSchemaData(url);
  if (email) return email;

  email = await tryCommonPatterns(domain);
  if (email) return email;

  return null;
}

export async function findEmailFromFacebook(fbUrl: string): Promise<string | null> {
  const html = await tryFetch(fbUrl, 8000);
  if (!html) return null;

  const emails = extractEmailsFromHtml(html);
  return emails.length > 0 ? emails[0] : null;
}