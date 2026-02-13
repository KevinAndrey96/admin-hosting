export default function NotFound() {
  return (
    <div
      className="d-f ai-c jc-c"
      style={{
        minHeight: '100vh',
        background: 'var(--c-bkg-body)',
        flexDirection: 'column',
        padding: 40,
      }}
    >
      <span
        className="fw-700 c-grey-400"
        style={{ fontSize: '8rem', lineHeight: 1 }}
      >
        404
      </span>
      <h3 className="mB-10" style={{ color: 'var(--c-text-base)' }}>
        Oops Page Not Found
      </h3>
      <p className="c-grey-600 mB-30 ta-c" style={{ maxWidth: 400 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <a href="/" className="btn btn-primary">
        Go to Home
      </a>
    </div>
  );
}
