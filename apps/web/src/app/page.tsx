"use client";

import { useCallback } from "react";
import { NeuralNoise } from "@/components/ui/neural-noise";
import { Hero } from "@/components/Hero";
import { ConvergenceFlow } from "@/components/ConvergenceFlow";
import { TruthDiff } from "@/components/TruthDiff";
import { EvidenceReceipts } from "@/components/EvidenceReceipts";
import { TrialMode } from "@/components/TrialMode";
import { BackendProof, NotionCTA } from "@/components/BackendProof";
import { useAletheia } from "@/lib/use-aletheia";

export default function TruthRoom() {
  const {
    state,
    loading,
    triggerPR,
    syncCRM,
    syncRoadmap,
    addSlack,
    runTrial,
    reset,
  } = useAletheia();

  const runRealityCheck = useCallback(async () => {
    await triggerPR();
    await syncCRM();
    await syncRoadmap();
    await addSlack();
  }, [triggerPR, syncCRM, syncRoadmap, addSlack]);

  return (
    <main className="relative overflow-x-hidden w-full max-w-full">
      <NeuralNoise color={[0.45, 0.25, 0.15]} opacity={0.3} speed={0.001} />

      <Hero
        onRunCheck={runRealityCheck}
        loading={loading}
        status={state?.status}
      />

      <div className="relative z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent" />

        <ConvergenceFlow
          isActive={!!state && state.status !== "green"}
          signals={state?.signals}
          concepts={state?.concepts}
          claim={state?.activeClaim}
          verdict={state?.truthDiff?.verdict}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent" />

        <TruthDiff
          belief={state?.truthDiff?.belief}
          reality={state?.truthDiff?.reality}
          verdict={state?.truthDiff?.verdict}
          approvals={state?.truthDiff?.recommendedActions}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent" />

        <EvidenceReceipts evidence={state?.evidence} />

        <div className="h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent" />

        <TrialMode
          onRunTrial={runTrial}
          trial={state?.trial}
          loading={loading}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent" />

        <BackendProof syncLog={state?.syncLog} />

        <div className="h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent" />

        <NotionCTA onReset={reset} loading={loading} />

        <div className="h-16" />
      </div>
    </main>
  );
}
