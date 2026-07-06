import { getMySQLPool } from "@/lib/mysql";

interface ChatLog {
  userId: string;
  question: string;
  answer: string;
  source: "mysql_faq" | "ai" | "fallback";
}

/**
 * Save chat interaction to MySQL database
 * @param log - Chat log entry
 */
export async function saveChatLog(log: ChatLog): Promise<void> {
  try {
    const query = `
      INSERT INTO chat_logs (user_id, question, answer, source)
      VALUES (?, ?, ?, ?)
    `;

    await getMySQLPool().execute(query, [log.userId, log.question, log.answer, log.source]);
  } catch (error) {
    console.error("Error saving chat log:", error);
    // Don't throw - chat logging should not break the bot
  }
}

/**
 * Get chat history for a user
 * @param userId - User's LINE ID
 * @param limit - Number of recent messages to fetch (default 20)
 * @returns Array of chat logs ordered by timestamp descending
 */
export async function getChatHistory(
  userId: string,
  limit: number = 20
): Promise<ChatLog[]> {
  try {
    const query = `
      SELECT user_id, question, answer, source
      FROM chat_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [rows] = await getMySQLPool().execute(query, [userId, limit]);
    return rows as ChatLog[];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}