"use client";

import dynamic from 'next/dynamic';

const InvoiceEditor = dynamic(() => import('@/components/InvoiceEditor'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <InvoiceEditor />
    </main>
  );
}
