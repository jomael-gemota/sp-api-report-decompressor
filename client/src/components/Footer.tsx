export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} Channel Precision Inc. — Built by
          Jomael Gemota
        </p>
        <a
          href="https://developer-docs.amazon.com/sp-api/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          SP-API Documentation
        </a>
      </div>
    </footer>
  );
}
