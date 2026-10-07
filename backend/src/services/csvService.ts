import { Business } from '../types';

export function generateCSV(businesses: Business[]): string {
  const headers = [
    'Name',
    'Type',
    'Address',
    'Phone',
    'WhatsApp Link',
    'Email',
    'Email Source',
    'Email Status',
    'Website',
    'Facebook',
    'Rating',
    'Reviews',
    'Source',
    'Status',
    'Notes',
  ];

  const rows = businesses.map((b) => [
    b.name,
    b.type,
    b.address,
    b.phone || '',
    b.whatsapp ? `https://wa.me/${b.whatsapp}` : '',
    b.email || '',
    b.emailSource || '',
    b.emailStatus || '',
    b.website || '',
    b.facebookUrl || '',
    b.rating?.toString() || '',
    b.reviews?.toString() || '',
    b.source,
    b.status || 'new',
    b.notes || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}