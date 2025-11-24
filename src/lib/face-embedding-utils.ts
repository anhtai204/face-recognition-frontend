// Mock face embedding generation utility
export interface EmbeddingResult {
  embedding: number[]
  confidence: number
  detectedFaces: number
}

// Simulate face detection and embedding generation
export async function generateFaceEmbedding(imageData: string): Promise<EmbeddingResult> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate mock 512-dimensional embedding vector
  const embedding = Array(512)
    .fill(0)
    .map(() => Math.random() * 2 - 1)

  // Simulate detection results
  const detectedFaces = Math.random() > 0.1 ? 1 : 0
  const confidence = detectedFaces > 0 ? 0.85 + Math.random() * 0.15 : 0

  return {
    embedding,
    confidence,
    detectedFaces,
  }
}

// Simulate face matching between embeddings
export function calculateEmbeddingSimilarity(embedding1: number[], embedding2: number[]): number {
  // Cosine similarity calculation
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
    norm1 += embedding1[i] * embedding1[i]
    norm2 += embedding2[i] * embedding2[i]
  }

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  return (similarity + 1) / 2 // Normalize to 0-1 range
}


export function checkEmbeddingConsistency(embeddings: number[][]): {
  isConsistent: boolean
  similarities: number[]
  averageSimilarity: number
  threshold: number
} {
  if (embeddings.length < 2) {
    return {
      isConsistent: true,
      similarities: [],
      averageSimilarity: 1,
      threshold: 0.6,
    }
  }

  // Compare all embeddings pairwise
  const similarities: number[] = []
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = calculateEmbeddingSimilarity(embeddings[i], embeddings[j])
      similarities.push(similarity)
    }
  }

  const averageSimilarity = similarities.length > 0 ? similarities.reduce((a, b) => a + b) / similarities.length : 1
  const threshold = 0.6 // Threshold for same person

  return {
    isConsistent: averageSimilarity >= threshold,
    similarities,
    averageSimilarity,
    threshold,
  }
}
