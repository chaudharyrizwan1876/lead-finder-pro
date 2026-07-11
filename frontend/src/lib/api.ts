import { SearchParams, SearchResponse, Business } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function searchLeads(params: SearchParams): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/api/search/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Search request fail ho gayi');
  }

  return response.json();
}

export async function exportCSV(businesses: Business[]): Promise<void> {
  const response = await fetch(`${API_URL}/api/search/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businesses }),
  });

  if (!response.ok) {
    throw new Error('Export fail ho gaya');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}