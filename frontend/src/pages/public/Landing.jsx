import { useState } from "react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import StaffSignInModal from "../../components/auth/StaffSignInModal";
import hero from "../../assets/images/anglican.webp";

export default function Landing({ initialOpen = false }) {
  const [open, setOpen] = useState(Boolean(initialOpen));

  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />

      <main className="mx-auto flex w-full max-w-[1400px] items-center px-4 py-10 md:min-h-[calc(100vh-4rem)] md:px-8 md:py-14">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h1 className="text-balance text-6xl font-extrabold leading-[1.02] tracking-tight text-slate-900 md:text-7xl lg:text-8xl">
              A Tradition of Excellence in Education
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-xl leading-relaxed text-slate-600 md:text-2xl">
              Discover a nurturing environment where students thrive academically, spiritually, and
              personally. Join our community.
            </p>

            <div className="mt-9">
              <button
                type="button"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-8 text-lg font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                onClick={() => setOpen(true)}
              >
                Staff Sign In
              </button>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="overflow-hidden rounded-none border border-slate-200 bg-slate-50 shadow-sm md:rounded-sm">
              <img
                src={hero}
                alt="Students"
                className="h-[360px] w-full max-w-[980px] object-cover md:h-[520px] lg:h-[560px]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </main>

      <StaffSignInModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
