import type { AiModel } from "./types";

export interface PlanCost {
  tokens: number;
  usesFreeQuota: boolean;
}

export function estimateTokens(model: AiModel | null): number {
  return model?.tokenCost ?? 0;
}

export function planModeCost(freePlanRemaining: number): PlanCost {
  if (freePlanRemaining > 0) {
    return { tokens: 0, usesFreeQuota: true };
  }
  return { tokens: 1, usesFreeQuota: false };
}

export function canAfford(balance: number, cost: number): boolean {
  return balance >= cost;
}

export function projectedBalance(balance: number, cost: number): number {
  return Math.max(0, balance - cost);
}

export function tokenCapacity(balance: number, cost: number): number {
  if (cost <= 0) return 0;
  return Math.floor(balance / cost);
}
