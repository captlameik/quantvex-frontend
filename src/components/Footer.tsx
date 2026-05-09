export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 p-6 text-slate-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} AIX Trader. Built for safe AI trading.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <a className="hover:text-white" href="#">Terms</a>
          <a className="hover:text-white" href="#">Privacy</a>
          <a className="hover:text-white" href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}
