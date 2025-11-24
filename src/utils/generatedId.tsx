/**
 * Tạo ID ngẫu nhiên cho block
 */
export const generateId = () => Math.random().toString(36).substring(2, 9)

/**
 * Tạo block mới với ID duy nhất
 */
export const createBlock = (type: string, content = "") => {
  return {
    id: `block-${type}-${generateId()}`,
    type,
    content,
  }
}

