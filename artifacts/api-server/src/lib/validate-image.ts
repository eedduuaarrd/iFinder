import { ai } from "@workspace/integrations-gemini-ai";

export interface ValidationResult {
  accepted: boolean;
  confidence: number;
  reason: string;
  detectedLabel: string | null;
  detectedColor: string | null;
  isRealPhoto: boolean;
}

interface ValidateOptions {
  itemName: string;
  description: string;
  requiredColor?: string | null;
  cocoLabel: string;
  imageBase64: string;
}

const CONFIDENCE_THRESHOLD = 0.7;

function stripDataUrl(input: string): { mimeType: string; base64: string } {
  const match = input.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (match) return { mimeType: match[1], base64: match[2] };
  return { mimeType: "image/jpeg", base64: input };
}

export async function validateHuntImage(opts: ValidateOptions): Promise<ValidationResult> {
  const { itemName, description, requiredColor, cocoLabel, imageBase64 } = opts;
  const { mimeType, base64 } = stripDataUrl(imageBase64);

  const colorRule = requiredColor
    ? `\n- REQUIRED COLOR: the ${cocoLabel} must be predominantly ${requiredColor}`
    : "";

  const prompt = `You are a strict, fair judge for a real-world scavenger hunt photo game.

TARGET: "${itemName}" (a real ${cocoLabel})
DESCRIPTION: ${description}${colorRule}

Analyze the photo and decide if it should count as a valid catch of the target.

REJECT the photo when ANY of these are true:
- The target object is NOT visible
- The target is too small, blurry, dark, or obscured to identify with confidence
- The image is a screenshot, drawing, painting, illustration, render, or computer-generated
- The image shows a screen (phone, monitor, TV) rather than the real world
- The image is a photo of a printed photograph or magazine page${requiredColor ? `\n- The object is not predominantly ${requiredColor}` : ""}
- The image looks staged with another image inside (e.g. holding a phone showing the object)

ACCEPT only when:
- The image is a genuine real-world photograph taken with a camera
- The target object is clearly and unambiguously present
- It would be obvious to any human that the player actually photographed a real ${cocoLabel}${requiredColor ? ` and it is ${requiredColor}` : ""}

Respond ONLY with strict JSON, no markdown, no commentary:
{
  "detected": boolean,
  "isRealPhoto": boolean,
  "confidence": number between 0 and 1,
  "reason": "short english sentence under 80 chars",
  "detectedLabel": "what you actually see, or null",
  "detectedColor": "dominant color of the target, or null"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      temperature: 0.1,
    },
  });

  const raw = response.text ?? "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      accepted: false,
      confidence: 0,
      reason: "AI returned invalid response",
      detectedLabel: null,
      detectedColor: null,
      isRealPhoto: false,
    };
  }

  const detected = Boolean(parsed.detected);
  const isRealPhoto = Boolean(parsed.isRealPhoto);
  const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
  const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : "No reason";
  const detectedLabel = typeof parsed.detectedLabel === "string" ? parsed.detectedLabel : null;
  const detectedColor = typeof parsed.detectedColor === "string" ? parsed.detectedColor : null;

  const accepted = detected && isRealPhoto && confidence >= CONFIDENCE_THRESHOLD;

  return {
    accepted,
    confidence,
    reason,
    detectedLabel,
    detectedColor,
    isRealPhoto,
  };
}
