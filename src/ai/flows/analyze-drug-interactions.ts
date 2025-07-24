// The AI flow that analyzes potential drug interactions based on a list of medications and dosages.
// It provides a summary of potential drug interactions, side effects, and necessary precautions.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DrugSchema = z.object({
  name: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication.'),
});

const AnalyzeDrugInteractionsInputSchema = z.object({
  medications: z.array(DrugSchema).describe('A list of medications and their dosages.'),
});

export type AnalyzeDrugInteractionsInput = z.infer<typeof AnalyzeDrugInteractionsInputSchema>;

const AnalyzeDrugInteractionsOutputSchema = z.object({
  summary: z.string().describe('A summary of potential drug interactions, side effects, and necessary precautions.'),
});

export type AnalyzeDrugInteractionsOutput = z.infer<typeof AnalyzeDrugInteractionsOutputSchema>;

export async function analyzeDrugInteractions(input: AnalyzeDrugInteractionsInput): Promise<AnalyzeDrugInteractionsOutput> {
  return analyzeDrugInteractionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDrugInteractionsPrompt',
  input: {schema: AnalyzeDrugInteractionsInputSchema},
  output: {schema: AnalyzeDrugInteractionsOutputSchema},
  prompt: `You are a clinical pharmacist expert. Analyze the following list of medications and dosages for potential drug interactions, side effects, and necessary precautions. Provide a concise summary of your analysis. Use the provided Zod schema description for output formatting.\n\nMedications:\n{{#each medications}}- Name: {{this.name}}, Dosage: {{this.dosage}}\n{{/each}}`,
});

const analyzeDrugInteractionsFlow = ai.defineFlow(
  {
    name: 'analyzeDrugInteractionsFlow',
    inputSchema: AnalyzeDrugInteractionsInputSchema,
    outputSchema: AnalyzeDrugInteractionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
