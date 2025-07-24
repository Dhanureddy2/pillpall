'use server';

import { analyzeDrugInteractions } from '@/ai/flows/analyze-drug-interactions';
import type { AnalyzeDrugInteractionsInput } from '@/ai/flows/analyze-drug-interactions';

export async function getInteractionAnalysis(data: AnalyzeDrugInteractionsInput) {
  try {
    // Ensure we don't send empty requests to the AI
    if (!data.medications || data.medications.length === 0) {
      return { summary: null, error: 'No medications provided for analysis.' };
    }

    const result = await analyzeDrugInteractions(data);
    return { summary: result.summary, error: null };
  } catch (e) {
    console.error('Error analyzing drug interactions:', e);
    // Provide a more user-friendly error message
    return { summary: null, error: 'An unexpected error occurred while analyzing interactions. Please try again later.' };
  }
}
