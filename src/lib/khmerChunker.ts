export const chunkKhmerText = (text: string, maxLength: number = 1500): string[] => {
  const chunks: string[] = [];
  
  // Clean up text
  const cleanText = text.trim();
  if (!cleanText) return chunks;

  // Split by paragraphs first
  const paragraphs = cleanText.split(/\n+/);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      chunks.push(paragraph);
    } else {
      // Split by Khmer punctuation and common sentence enders
      // ។ (Khan), ៕ (Bariyosan), ?, !
      // We use a regex that keeps the delimiter with the sentence.
      const sentences = paragraph.split(/(?<=[។៕?!])\s*/);
      
      let currentChunk = '';
      for (const sentence of sentences) {
        if (!sentence.trim()) continue;
        
        if ((currentChunk + sentence).length <= maxLength) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
            currentChunk = '';
          }
          
          // If a single sentence is still larger than max length, we have to split it by words/spaces
          if (sentence.length > maxLength) {
            const words = sentence.split(/\s+/);
            for (const word of words) {
              if ((currentChunk + word).length <= maxLength) {
                currentChunk += (currentChunk ? ' ' : '') + word;
              } else {
                if (currentChunk) chunks.push(currentChunk);
                // If a single word is insanely long, just substring it (rare in normal text)
                if (word.length > maxLength) {
                  let start = 0;
                  while (start < word.length) {
                    chunks.push(word.substring(start, start + maxLength));
                    start += maxLength;
                  }
                } else {
                  currentChunk = word;
                }
              }
            }
          } else {
            currentChunk = sentence;
          }
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }
  }

  return chunks;
};
