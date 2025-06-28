'use server';

/**
 * @fileOverview AI assistant that answers patient questions, recommends specialists, and helps manage bookings.
 *
 * - whatsappAssistant - A function that handles the assistant process.
 * - WhatsAppAssistantInput - The input type for the whatsappAssistant function.
 * - WhatsAppAssistantOutput - The return type for the whatsappAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WhatsAppAssistantInputSchema = z.object({
  query: z.string().describe('The query from the user via WhatsApp.'),
});
export type WhatsAppAssistantInput = z.infer<typeof WhatsAppAssistantInputSchema>;

const WhatsAppAssistantOutputSchema = z.object({
  response: z.string().describe('The response from the AI assistant.'),
});
export type WhatsAppAssistantOutput = z.infer<typeof WhatsAppAssistantOutputSchema>;

export async function whatsappAssistant(input: WhatsAppAssistantInput): Promise<WhatsAppAssistantOutput> {
  return whatsappAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'whatsappAssistantPrompt',
  input: {schema: WhatsAppAssistantInputSchema},
  output: {schema: WhatsAppAssistantOutputSchema},
  prompt: `You are a helpful AI assistant interacting with patients via WhatsApp.

  Your goal is to answer their questions about medical procedures, recommend appropriate specialists based on their symptoms, and help them confirm and manage their appointment bookings.

  You have access to the following information:
  - Available medical procedures and their descriptions
  - List of specialists and their areas of expertise
  - Patient's appointment booking history

  Based on the user's query, provide a clear and concise response. If the query relates to specialist recommendations ask the user for a list of their symptoms before suggesting a specialist.

  Query: {{{query}}}
  `,
});

const whatsappAssistantFlow = ai.defineFlow(
  {
    name: 'whatsappAssistantFlow',
    inputSchema: WhatsAppAssistantInputSchema,
    outputSchema: WhatsAppAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

