
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
    description: 'Obtiene una lista de doctores, opcionalmente filtrando por especialidad y/o ciudad.',
    inputSchema: z.object({
      specialty: z.string().optional().describe('La especialidad por la que filtrar, ej., Cardiología'),
      location: z.string().optional().describe('La ciudad por la que filtrar, ej., Caracas'),
    }),
    outputSchema: z.array(z.object({
        name: z.string(),
        specialty: z.string(),
        city: z.string(),
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
        (doc) => doc.city.toLowerCase() === location.toLowerCase()
      );
    }
    return filteredDoctors.map(({ name, specialty, city, rating }) => ({ name, specialty, city, rating }));
  }
);


const WhatsAppAssistantInputSchema = z.object({
  query: z.string().describe('La consulta del usuario a través de WhatsApp.'),
});
export type WhatsAppAssistantInput = z.infer<typeof WhatsAppAssistantInputSchema>;

const WhatsAppAssistantOutputSchema = z.object({
  response: z.string().describe('La respuesta del asistente de IA.'),
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
  prompt: `Eres un asistente de IA servicial para SUMA (Sistema Unificado de Medicina Avanzada), interactuando con pacientes a través de WhatsApp.

  Tu objetivo es responder sus preguntas sobre procedimientos médicos, recomendar especialistas apropiados según sus síntomas y ayudarlos a confirmar y gestionar sus reservas de citas.

  - Si el usuario pregunta por un médico o especialista, DEBES usar la herramienta 'findDoctors' para encontrar médicos relevantes. Puedes preguntar por síntomas para inferir una especialidad si es necesario. Presenta los resultados al usuario en una lista amigable y legible.
  - Si encuentras doctores, menciona su nombre, especialidad, ciudad y calificación.
  - Sé conversacional y servicial.

  Consulta: {{{query}}}
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
