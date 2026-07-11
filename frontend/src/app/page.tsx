'use client';

import { useState } from 'react';
import Image from 'next/image';
import SearchForm from '@/components/SearchForm';
import StatsCards from '@/components/StatsCards';
import LeadsList from '@/components/LeadsList';
import { searchLeads } from '@/lib/api';
import { SearchParams, SearchResponse } from '@/types';

export default function Home() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError('');
    try {
      const data = await searchLeads(params);
      setResults(data);
    } catch (err) {
      setError('Search fail ho gayi. Backend chal raha hai check karo.');
    } finally {
      setLoading(false);
    }
  };

 return (
    <main className="max-w-4xl mx-auto px-4 py-2">
      <div className="mb-3">
        <Image
          src="/logo.png"
          alt="LeadFinderPro"
          width={340}
          height={140}
          className="rounded-lg -mb-2"
        />
        <p className="text-xs text-gray-500">OpenStreetMap + Google Maps used for leads</p>
      </div>
      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <i className="ti ti-alert-circle" />
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-gray-500 text-sm">
          <i className="ti ti-loader-2 text-4xl text-emerald-500 block mb-3 animate-spin" />
          We are trying to find leads please wait...
        </div>
      )}

      {!loading && results && (
        <>
          <StatsCards results={results} />
          <LeadsList businesses={results.data} />
        </>
      )}

      {!loading && !results && (
        <div className="text-center py-16 text-gray-400 text-sm">
          <i className="ti ti-map-search text-5xl text-gray-300 block mb-3" />
          Enter business type and city to search for leads
        </div>
      )}
    </main>
  );
}