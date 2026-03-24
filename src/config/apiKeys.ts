// ⚠️ DEPRECATED — This file is NOT imported by the active service layer.
// The HF key is now read from the env variable VITE_HUGGING_FACE_ACCESS_TOKEN.
// See src/services/legalAI.ts for the active AI call logic.

export const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_ACCESS_TOKEN || "";

// Active endpoint used by legalAI.ts (for reference only):
export const HUGGING_FACE_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
