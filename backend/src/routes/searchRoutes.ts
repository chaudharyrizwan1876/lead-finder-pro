import { Router, Request, Response } from 'express';
import { searchOSM } from '../services/osmService';
import { scrapeGoogleMaps } from '../services/scrapeService';
import { findEmail, findEmailFromFacebook } from '../services/emailService';
import { generateCSV } from '../services/csvService';
import { verifyEmail } from '../services/emailVerifyService';
import { upsertLeads, getAllLeads, updateLeadStatus, LeadStatus } from '../services/dbService';
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

        if (b.email) {
          b.emailStatus = await verifyEmail(b.email, b.emailSource);
        }

        return b;
      })
    );

    console.log('Database mein save ho raha hai...');
    const stored = upsertLeads(enriched, city);
    const newCount = stored.filter((b) => b.isNew).length;
    console.log(`${newCount} nayi leads, ${stored.length - newCount} pehle se DB mein maujood thin`);

    const response: SearchResponse = {
      success: true,
      total: stored.length,
      withEmail: stored.filter((b) => b.email).length,
      withPhone: stored.filter((b) => b.phone).length,
      withoutWebsite: stored.filter((b) => !b.website).length,
      newLeads: newCount,
      data: stored,
    };

    res.json(response);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/saved', async (req: Request, res: Response) => {
  try {
    const data = getAllLeads();
    res.json({
      success: true,
      total: data.length,
      withEmail: data.filter((b) => b.email).length,
      withPhone: data.filter((b) => b.phone).length,
      withoutWebsite: data.filter((b) => !b.website).length,
      newLeads: 0,
      data,
    });
  } catch (error) {
    console.error('Saved leads fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/leads/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;

    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: 'Valid id required hai' });
      return;
    }

    const validStatuses: LeadStatus[] = ['new', 'contacted', 'replied', 'converted', 'not_interested'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const updated = updateLeadStatus(id, status, notes ?? null);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Lead nahi mili' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update status error:', error);
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