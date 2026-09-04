import { Router, Request, Response } from 'express';
import { searchOSM } from '../services/osmService';
import { scrapeGoogleMaps } from '../services/scrapeService';
import { findEmail, findEmailFromFacebook } from '../services/emailService';
import { generateCSV } from '../services/csvService';
import { Business, SearchResponse } from '../types';

const router = Router();

router.post('/leads', async (req: Request, res: Response) => {
  try {
    const { businessType, city, radius = 10, useGoogleMaps = false } = req.body;

    if (!businessType || !city) {
      res.status(400).json({ success: false, message: 'businessType aur city required hain' });
      return;
    }

    console.log(`Searching: ${businessType} in ${city}...`);

    let businesses: Business[] = [];

    console.log('OpenStreetMap se data fetch ho raha hai...');
    const osmResults = await searchOSM({ businessType, city, radius, useGoogleMaps });
    businesses = [...osmResults];
    console.log(`OSM se ${osmResults.length} results mile`);

    if (useGoogleMaps) {
      console.log('Google Maps scrape ho raha hai...');
      const gmResults = await scrapeGoogleMaps(businessType, city, radius);
      const existingNames = new Set(businesses.map((b) => b.name.toLowerCase()));
      const newResults = gmResults.filter((b) => !existingNames.has(b.name.toLowerCase()));
      businesses = [...businesses, ...newResults];
      console.log(`Google Maps se ${newResults.length} extra results mile`);
    }

    console.log('Emails dhundh raha hai...');
    const enriched = await Promise.all(
      businesses.map(async (b) => {
        // Pehle website se try karo (4 jugar wala combo)
        if (!b.email && b.website) {
          const found = await findEmail(b.website);
          if (found) {
            b.email = found.email;
            b.emailSource = found.source;
          }
        }

        // Website se nahi mila aur Facebook page hai to wahan try karo
        if (!b.email && b.facebookUrl) {
          const fbEmail = await findEmailFromFacebook(b.facebookUrl);
          if (fbEmail) {
            b.email = fbEmail;
            b.emailSource = 'facebook';
          }
        }

        return b;
      })
    );

    const response: SearchResponse = {
      success: true,
      total: enriched.length,
      withEmail: enriched.filter((b) => b.email).length,
      withPhone: enriched.filter((b) => b.phone).length,
      withoutWebsite: enriched.filter((b) => !b.website).length,
      data: enriched,
    };

    res.json(response);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const { businesses } = req.body;
    if (!businesses || !Array.isArray(businesses)) {
      res.status(400).json({ success: false, message: 'Businesses array required hai' });
      return;
    }

    const csv = generateCSV(businesses);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export error' });
  }
});

export default router;