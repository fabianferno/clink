"use client";

import React from "react";
import { Step } from "nextstepjs";

interface OnboardingCardProps {
  step: Step;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTour?: () => void;
  arrow: React.ReactNode;
}

export default function OnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: OnboardingCardProps) {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="relative w-[320px] rounded-2xl border border-white/10 bg-[#141414] shadow-[0_0_60px_rgba(255,82,162,0.15)] overflow-hidden">
      {/* Pink glow top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#FF52A2] to-transparent opacity-80" />

      <div className="p-5">
        {/* Icon + title row */}
        <div className="flex items-center gap-3 mb-3">
          {step.icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF52A2]/15 border border-[#FF52A2]/20 text-lg">
              {step.icon}
            </div>
          )}
          {step.title && (
            <h3 className="font-malinton text-lg font-bold text-white leading-tight">
              {step.title}
            </h3>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-white/70 leading-relaxed mb-4">
          {step.content}
        </div>

        {/* Arrow (for tooltip pointer) */}
        {arrow}

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === currentStep
                ? "w-5 bg-[#FF52A2]"
                : i < currentStep
                  ? "w-2 bg-[#FF52A2]/40"
                  : "w-2 bg-white/15"
                }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={skipTour}
            className="text-xs cursor-pointer text-white/30 hover:text-white/60 transition-colors font-medium"
          >
            Skip tour
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 cursor-pointer rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-4 py-1.5 cursor-pointer rounded-full text-xs font-black bg-[#FF52A2] text-black hover:bg-[#FF52A2]/90 transition-all shadow-[0_0_15px_rgba(255,82,162,0.3)]"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
