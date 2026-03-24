import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Page Not Found");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="mt-2 text-text-secondary">Page not found</p>
      <Link
        to="/"
        className="mt-4 text-primary hover:text-primary-hover underline"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
