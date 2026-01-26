// Gemini Flash REST API for fast translation
export type SupportedLanguage =
  | "English"
  | "Malay"
  | "Manglish"
  | "Tamil"
  | "Mandarin"
  | "Unknown";

interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

/**
 * Auto-detect language from text
 */
export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  try {
    const prompt = `Detect the primary language of this text. Respond with ONLY ONE of these exact words: English, Malay, Manglish, Tamil, Mandarin, Unknown

Text: "${text}"

Language:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Language detection API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return "Unknown";
    }

    const data = await response.json();
    const detectedLanguage =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Validate response
    const validLanguages: SupportedLanguage[] = [
      "English",
      "Malay",
      "Manglish",
      "Tamil",
      "Mandarin",
    ];

    if (validLanguages.includes(detectedLanguage as SupportedLanguage)) {
      return detectedLanguage as SupportedLanguage;
    }

    return "Unknown";
  } catch (error) {
    console.error("Language detection error:", error);
    return "Unknown";
  }
}

/**
 * Translate text from one language to another
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage,
): Promise<TranslationResult> {
  try {
    // If source language not provided, detect it
    const detectedLanguage = sourceLanguage || (await detectLanguage(text));

    // If already in target language, skip translation
    if (detectedLanguage === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        detectedLanguage,
        targetLanguage,
      };
    }

    // Special handling for Manglish
    let translationPrompt = "";
    if (targetLanguage === "Manglish") {
      translationPrompt = `Translate this text to Malaysian English (Manglish) - a casual mix of English and Malay commonly used in Malaysia. Use Malaysian slang and code-switching naturally.

Examples:
- "Where are you?" → "You kat mana?"
- "I'm coming now" → "I coming now lah"
- "Wait for me" → "Tunggu I kejap"

Text to translate: "${text}"

Manglish translation:`;
    } else if (detectedLanguage === "Manglish") {
      translationPrompt = `Translate this Manglish (Malaysian English/Malay mix) text to proper ${targetLanguage}.

Text: "${text}"

${targetLanguage} translation:`;
    } else {
      translationPrompt = `Translate this text from ${detectedLanguage} to ${targetLanguage}. Provide ONLY the translation, no explanations.

Text: "${text}"

Translation:`;
    }

    // Call Gemini REST API for translation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: translationPrompt }] }],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Translation API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `Translation API failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const translatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    return {
      originalText: text,
      translatedText,
      detectedLanguage,
      targetLanguage,
    };
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return {
      originalText: text,
      translatedText: text,
      detectedLanguage: sourceLanguage || "Unknown",
      targetLanguage,
    };
  }
}

/**
 * Translate dispatcher message to caller's language
 */
export async function translateDispatcherMessage(
  message: string,
  callerLanguage: SupportedLanguage,
): Promise<TranslationResult> {
  return translateText(message, callerLanguage, "English");
}

/**
 * Translate caller message to English for dispatcher
 */
export async function translateCallerMessage(
  message: string,
): Promise<TranslationResult> {
  return translateText(message, "English");
}

/**
 * Batch translate multiple messages (for efficiency)
 */
export async function batchTranslate(
  messages: Array<{ text: string; targetLanguage: SupportedLanguage }>,
): Promise<TranslationResult[]> {
  try {
    // Use Promise.all for parallel translation
    const translations = await Promise.all(
      messages.map((msg) => translateText(msg.text, msg.targetLanguage)),
    );

    return translations;
  } catch (error) {
    console.error("Batch translation error:", error);
    // Return original texts on error
    return messages.map((msg) => ({
      originalText: msg.text,
      translatedText: msg.text,
      detectedLanguage: "Unknown" as SupportedLanguage,
      targetLanguage: msg.targetLanguage,
    }));
  }
}
