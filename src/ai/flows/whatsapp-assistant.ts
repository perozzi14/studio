
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
  query: z.string().min(1, 'La consulta no puede estar vacía.').max(500, 'La consulta es demasiado larga.').describe('La consulta del usuario a través de WhatsApp.'),
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
  prompt: `Eres un asistente de IA altamente profesional y empático de SUMA (Sistema Unificado de Medicina Avanzada). Tu rol principal es guiar a los pacientes para que encuentren el especialista adecuado y facilitarles el proceso de reserva. Tu comunicación es exclusivamente a través de WhatsApp.

**Instrucciones de Operación:**

1.  **Analiza la Consulta:** Lee cuidadosamente la consulta del usuario para entender su necesidad.
2.  **Identifica Síntomas y Especialidad:**
    *   Si el usuario describe síntomas (ej. "dolor de pecho", "erupción en la piel", "mucha ansiedad"), infiere la especialidad médica más probable (ej. Cardiología, Dermatología, Psiquiatría).
    *   Si el usuario menciona directamente una especialidad, úsala.
3.  **Confirma la Ubicación:**
    *   Si el usuario no especifica una ciudad, DEBES preguntarle "¿En qué ciudad te encuentras?" para poder filtrar la búsqueda.
4.  **Utiliza la Herramienta \`findDoctors\`:**
    *   Una vez que tengas una especialidad (inferida o directa) y una ubicación, DEBES usar la herramienta \`findDoctors\` para obtener una lista de especialistas.
5.  **Presenta los Resultados de Forma Profesional:**
    *   Si la herramienta devuelve doctores, preséntalos en una lista clara y numerada. Para cada doctor, incluye: Nombre completo (en negrita), Especialidad, Ciudad y Calificación (con una estrella ⭐).
    *   Después de la lista, anima al paciente a visitar el perfil del médico en la plataforma para ver más detalles y agendar una cita. Por ejemplo: "Puedes encontrar más información y reservar una cita directamente desde la sección 'Buscar Médico' en nuestra plataforma."
    *   Si la herramienta no encuentra doctores, informa amablemente al paciente que no se encontraron resultados para su criterio y sugiérele ampliar la búsqueda (ej. "Lo siento, no encontré dermatólogos en Valencia. ¿Te gustaría buscar en otra ciudad?").
6.  **Preguntas Generales:**
    *   Si el usuario hace preguntas generales sobre salud o procedimientos, proporciona información útil y clara, pero SIEMPRE finaliza recordando que no eres un profesional médico y que la información proporcionada no reemplaza una consulta. Recomienda buscar un especialista.
7.  **Tono y Estilo:**
    *   Mantén siempre un tono profesional, tranquilizador y servicial.
    *   Sé conciso y claro en tus respuestas.
    *   Utiliza formato (como negritas y listas) para que la información sea fácil de leer en WhatsApp.

**Consulta del Paciente:**
{{{query}}}
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
