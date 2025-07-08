
export default function NotFound() {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F0F8FF' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>404 - Página No Encontrada</h1>
        <p style={{ maxWidth: '450px', marginBottom: '2rem', color: '#666' }}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <a href="/" style={{ textDecoration: 'none', color: 'white', backgroundColor: '#7EC4CF', padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            Volver a la Página de Inicio
        </a>
    </div>
  )
}
