import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SchemaAnalysisResult } from "../types";

const getSchemaAnalysis = async (input: string): Promise<SchemaAnalysisResult> => {
  // Vite exposes env vars on import.meta.env.
  // They MUST start with VITE_ to be visible in the browser.
  // We check for your specific name first, then the generic one.
  // @ts-ignore
  const apiKey = import.meta.env.VITE_API_KEY_SCHEMA || import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    console.error("API Key missing. VITE_API_KEY_SCHEMA not found.");
    throw new Error("Configuratiefout: API Key ontbreekt. Voeg 'VITE_API_KEY_SCHEMA' toe aan je Vercel Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Define the output schema for strict JSON generation
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "Een korte samenvatting van de validatieresultaten in het Nederlands." },
      detectedTypes: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Lijst van gedetecteerde schema types (bijv. Article, Product)." 
      },
      entities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            propertiesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingRecommended: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["type", "propertiesFound", "missingRequired", "missingRecommended"],
        }
      },
      issues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: ["error", "warning", "info"] },
            type: { type: Type.STRING, enum: ["syntax", "schema", "inconsistency"] },
            message: { type: Type.STRING, description: "Beschrijving van het probleem in het Nederlands." },
            entity: { type: Type.STRING },
            property: { type: Type.STRING },
          },
          required: ["severity", "type", "message"],
        }
      },
      healthScore: { 
        type: Type.NUMBER, 
        description: "Een score van 0 tot 100 die de kwaliteit van de schema implementatie weergeeft." 
      },
      correctedJsonLdString: {
        type: Type.STRING,
        description: "Het volledig gecorrigeerde en valide JSON-LD object als een string serialized JSON.",
      }
    },
    required: ["summary", "detectedTypes", "entities", "issues", "healthScore", "correctedJsonLdString"],
  };

  const prompt = `
    Je bent een expert Schema Markup Validator.
    Analyseer de volgende structured data input (JSON-LD, Microdata, RDFa, of Code Fragment):
    
    INPUT START:
    ${input}
    INPUT END

    Taken:
    1. Detecteer alle structured-data formaten.
    2. Valideer strikt tegen de schema.org vocabulary.
    3. Vind syntaxfouten, schema-fouten (zoals verkeerde types), en inconsistenties (ontbrekende logische velden).
    4. Genereer een "Schema Health Score" (0-100) op basis van volledigheid en correctheid.
    5. Genereer ALTIJD een verbeterde, complete JSON-LD versie. Retourneer dit als een JSON string in het veld 'correctedJsonLdString'.

    BELANGRIJK: Alle tekstuele output (summary, messages) MOET in het Nederlands zijn.
    
    Geef antwoord als JSON volgens het opgegeven schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for consistent analysis
      },
    });

    const text = response.text;
    if (!text) throw new Error("Geen antwoord van Gemini");

    const rawResult = JSON.parse(text);

    // Transform raw result to match SchemaAnalysisResult interface
    let correctedJsonLd = {};
    if (rawResult.correctedJsonLdString) {
      try {
        correctedJsonLd = JSON.parse(rawResult.correctedJsonLdString);
      } catch (e) {
        console.error("Error parsing nested JSON string", e);
        // Fallback or keep empty
      }
    }

    return {
      summary: rawResult.summary,
      detectedTypes: rawResult.detectedTypes,
      entities: rawResult.entities,
      issues: rawResult.issues,
      healthScore: rawResult.healthScore,
      correctedJsonLd: correctedJsonLd
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Provide more specific error messages to help user debug API key issues
    const msg = error.message || error.toString();
    if (msg.includes('403') || msg.includes('API key')) {
        throw new Error("Toegang geweigerd (403): Controleer in Vercel Settings of je Environment Variable 'VITE_API_KEY_SCHEMA' heet en de juiste waarde heeft. Controleer ook je Google Cloud Console domein restricties.");
    }
    
    throw new Error("Het analyseren van de schema is mislukt. Probeer het opnieuw.");
  }
};

export { getSchemaAnalysis };