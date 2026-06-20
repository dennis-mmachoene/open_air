import type { Metadata } from "next";
import { StressTestTool } from "@/components/studio/StressTestTool";

export const metadata: Metadata = {
  title: "Accessibility stress test",
  description:
    "Stress-test a whole color system under color-vision deficiencies, low light, and outdoor glare — with a per-condition accessibility scorecard for text contrast and color distinguishability.",
};

export default function StressPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Stress test</h1>
        <p className="max-w-2xl text-text-soft">
          See how your whole system holds up for everyone — deuteranopia, protanopia,
          tritanopia, achromatopsia, low brightness, and outdoor glare — with a score
          for readable text and distinguishable colors under each condition.
        </p>
      </header>
      <StressTestTool />
    </div>
  );
}
