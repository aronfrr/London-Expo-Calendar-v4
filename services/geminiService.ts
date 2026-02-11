
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessEvent, Industry, EventType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const INDUSTRIES: Industry[] = [
  'Major Projects',
  'Manufacturing (Aero/Defence)',
  'Financial Services',
  'Tech & Cyber',
  'Pharma & Life Sciences',
  'Public Sector'
];

const EVENT_TYPES: EventType[] = [
  'Trade Show',
  'Panel Discussion',
  'Invite-Only Dinner',
  'Networking Mixer',
  'Executive Roundtable'
];

export const fetchTradeShows = async (month: number, year: number): Promise<{ shows: BusinessEvent[], sources: any[] }> => {
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month));
  
  const prompt = `
    ACT AS A HIGH-END CONCIERGE. Search for and verify a comprehensive list of upcoming business events, major trade shows, and elite networking opportunities in London, UK for ${monthName} ${year}.
    
    TARGET INDUSTRIES: ${INDUSTRIES.join(', ')}.

    SEARCH CRITERIA:
    1. EXPOS: Major trade shows at ExCeL, Olympia, The O2, or Business Design Centre.
    2. PANELS: Significant sector-specific summits.
    3. EXCLUSIVE: Invite-only dinners, executive roundtables.
    4. NETWORKING: Industry mixers.
    5. FREE EVENTS: Include high-quality free networking events, community meetups, and open-access industry briefings.

    VERIFICATION PROTOCOL:
    - ONLY return events that are officially confirmed for ${monthName} ${year}.
    - WEBSITES: Ensure 'websiteUrl' is the official registration page.
    - COST: Explicitly identify if the event is FREE TO ATTEND or requires a PAID TICKET.

    OUTPUT FORMAT: Return a clean JSON array of objects.
    Schema:
    - name: string
    - industry: one of [${INDUSTRIES.map(i => `"${i}"`).join(', ')}]
    - type: one of [${EVENT_TYPES.map(t => `"${t}"`).join(', ')}]
    - startDate: string (YYYY-MM-DD)
    - endDate: string (YYYY-MM-DD)
    - venue: string
    - description: string
    - websiteUrl: string
    - isInviteOnly: boolean
    - isFree: boolean (True if the event is free to attend/register)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              industry: { type: Type.STRING },
              type: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              venue: { type: Type.STRING },
              description: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              isInviteOnly: { type: Type.BOOLEAN },
              isFree: { type: Type.BOOLEAN },
            },
            required: ["name", "industry", "type", "startDate", "endDate", "venue", "description", "websiteUrl", "isInviteOnly", "isFree"]
          }
        }
      }
    });

    const rawEvents = JSON.parse(response.text || '[]');
    const shows: BusinessEvent[] = rawEvents.map((s: any) => ({
      ...s,
      id: `${s.name.replace(/[^\w]/g, '-').toLowerCase()}-${s.startDate}`
    }));

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { shows, sources };
  } catch (error) {
    console.error("Error fetching verified events:", error);
    return { shows: [], sources: [] };
  }
};
