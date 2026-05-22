import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LungLens — Master's Pitch",
  description:
    "Scrollytelling presentation: clinical gap, 6-model ensemble architecture, interpretability, and team.",
};

/** Full-bleed pitch: breaks out of the root max-w-5xl content shell. */
export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] -my-8 w-screen max-w-[100vw] overflow-x-hidden">
      {children}
    </div>
  );
}
