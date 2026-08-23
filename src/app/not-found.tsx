import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell max-w-[520px] py-24 text-center">
      <p className="eyebrow mb-3 justify-center">
        <span className="numeral">№404</span>
      </p>
      <h1 className="font-display text-[40px] leading-tight">Nothing here</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        The page or recipe you were after does not exist, or is not yours to see.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/recipes" className="btn btn-accent">
          Your recipes
        </Link>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
