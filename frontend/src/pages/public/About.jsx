import PublicNavbar from "../../components/layout/PublicNavbar";

export default function About() {
  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 md:px-8">
        <h1 className="font-display text-3xl font-semibold text-slate-900">About Us</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-700">
          Learn about our school, our mission and values, and how to apply for admission.
        </p>
      </main>
    </div>
  );
}
