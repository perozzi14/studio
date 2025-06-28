
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
import { doctors } from '@/lib/data';

// Tool to find doctors
const findDoctorsTool = ai.defineTool(
  {
    name: 'findDoctors',
    description: 'Get a list of doctors, optionally filtering by specialty and/or location.',
    inputSchema: z.object({
      specialty: z.string().optional().describe('The specialty to filter by, e.g., Cardiology'),
      location: z.string().optional().describe('The location to filter by, e.g., Mexico City'),
    }),
    outputSchema: z.array(z.object({
        name: z.string(),
        specialty: z.string(),
        location: z.string(),
        rating: z.number(),
    })),
  },
  async ({ specialty, location }) => {
    let filteredDoctors = doctors;
    if (specialty) {
      filteredDoctors = filteredDoctors.filter(
        (doc) => doc.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }
    if (location) {
      filteredDoctors = filteredDoctors.filter(
        (doc) => doc.location.toLowerCase() === location.toLowerCase()
      );
    }
    return filteredDoctors.map(({ name, specialty, location, rating }) => ({ name, specialty, location, rating }));
  }
);


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
  tools: [findDoctorsTool],
  prompt: `You are a helpful AI assistant for MedAgenda, interacting with patients via WhatsApp.

  Your goal is to answer their questions about medical procedures, recommend appropriate specialists based on their symptoms, and help them confirm and manage their appointment bookings.

  - If the user asks for a doctor or specialist, you MUST use the 'findDoctors' tool to find relevant doctors. You can ask for symptoms to infer a specialty if needed. Present the results to the user in a friendly, readable list.
  - If you find doctors, mention their name, specialty, location, and rating.
  - Be conversational and helpful.

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
