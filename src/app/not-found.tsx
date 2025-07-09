"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '1rem',
        fontFamily: "'PT Sans', sans-serif",
        backgroundColor: "hsl(208 100% 97%)",
        color: "hsl(222.2 84% 4.9%)"
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="96"
        height="96"
        viewBox="0 0 24 24"
        fill="none"
        stroke="hsl(190 48% 68%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '2rem' }}
      >
        <path d="M8.29 2.02A6.5 6.5 0 0 0 3.5 8.5v7a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2.17A6.5 6.5 0 0 0 15.5 8.5V7a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1.5a6.5 6.5 0 0 0-2.21-3.48Z" />
        <path d="M15.5 2.02A6.5 6.5 0 0 1 20.5 8.5v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2.17A6.5 6.5 0 0 1 8.5 8.5V7a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1.5a6.5 6.5 0 0 1 2.21-3.48Z" />
      </svg>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 'bold', marginBottom: '1rem' }}>
        404 - Página No Encontrada
      </h1>
      <p style={{ maxWidth: '36rem', marginBottom: '2rem', color: '#6b7280', fontSize: '1.125rem' }}>
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.75rem 2rem',
          backgroundColor: 'hsl(190 48% 68%)',
          color: 'hsl(222.2 47.4% 11.2%)',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: '500'
        }}
      >
        Volver a la Página de Inicio
      </Link>
    </div>
  );
}
