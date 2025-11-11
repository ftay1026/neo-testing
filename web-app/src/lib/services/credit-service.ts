import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type CreditUsageRecord = {
  userId: string;
  inputTokens: number;
  outputTokens: number;
  actualCreditsUsed: number;
  customerId: string;
  chatId: string;
  inputMessageId: string;
  outputMessageId: string;
  timestamp: number;
}

export class RedisCreditService {  
  private getUsageKey(customerId: string, chatId: string, inputMessageId: string, outputMessageId: string): string {
    return `credit:usage:${customerId}:${chatId}:${inputMessageId}:${outputMessageId}`;
  }

  private getPendingKey(customerId: string): string {
    return `credit:pending:${customerId}`;
  }

  async trackUsage(usage: CreditUsageRecord): Promise<void> {
    try {
      const key = this.getUsageKey(usage.customerId, usage.chatId, usage.inputMessageId, usage.outputMessageId);
      const pendingKey = this.getPendingKey(usage.customerId);

      // Use pipeline for atomic operations
      const pipeline = redis.pipeline();
      
      pipeline.setex(
        key,
        86400, // 24 hours
        JSON.stringify(usage)
      );

      pipeline.incrby(pendingKey, usage.actualCreditsUsed);
      pipeline.expire(pendingKey, 86400);

      await pipeline.exec();
      
      console.log(`✅ Tracked ${usage.actualCreditsUsed} credits usage in Redis for ${key}`);
    } catch (error) {
      console.error('Failed to track usage in Redis:', error);
    }
  }

  async getPendingCredits(customerId: string): Promise<number> {
    try {
      const pending = await redis.get(this.getPendingKey(customerId));
      return pending ? parseInt(String(pending), 10) : 0;
    } catch (error) {
      console.error('❌ Failed to get pending credits:', error);
      return 0;
    }
  }

  async getAllUsageRecords(): Promise<CreditUsageRecord[]> {
    try {
      const pattern = 'credit:usage:*';
      const keys = await redis.keys(pattern);

      console.log(`🔍 Found ${keys.length} usage records in Redis`);
      console.log('Keys sample:', keys.slice(0, 5));
      
      if (keys.length === 0) {
        return [];
      }

      // Fetch all records in parallel
      const values = await redis.mget(...keys);
      
      console.log(`📦 Fetched ${values.length} values from Redis`);
      console.log('First value type:', typeof values[0]);
      console.log('First value sample:', values[0]);

      // Handle both string and object responses from Upstash
      return values
        .filter((val): val is string | object => val !== null)
        .map((val, index) => {
          try {
            // If it's already an object (Upstash auto-parsed it), return it directly
            if (typeof val === 'object') {
              return val as CreditUsageRecord;
            }
            
            // If it's a string, parse it
            if (typeof val === 'string') {
              return JSON.parse(val) as CreditUsageRecord;
            }
            
            throw new Error(`Unexpected value type: ${typeof val}`);
          } catch (error) {
            console.error(`❌ Error processing value at index ${index} for key ${keys[index]}:`, error);
            console.error('Value was:', val);
            throw error;
          }
        });
    } catch (error) {
      console.error('❌ Failed to get usage records:', error);
      return [];
    }
  }

  async deleteUsageRecords(records: CreditUsageRecord[]): Promise<void> {
    if (records.length === 0) return;
    
    try {
      const keys: string[] = [];
      const customerTotals = new Map<string, number>();

      for (const record of records) {
        keys.push(this.getUsageKey(record.customerId, record.chatId, record.inputMessageId, record.outputMessageId));
        
        const current = customerTotals.get(record.customerId) || 0;
        customerTotals.set(record.customerId, current + record.actualCreditsUsed);
      }
      
      // First, get current pending values for all customers
      const pendingKeys = Array.from(customerTotals.keys()).map(id => this.getPendingKey(id));
      const pendingValues = await redis.mget(...pendingKeys);
      
      const pipeline = redis.pipeline();
        
      // Delete individual usage records
      if (keys.length > 0) {
        pipeline.del(...keys);
      }
      
      // Process each customer's pending counter
      Array.from(customerTotals.entries()).forEach(([customerId, total], index) => {
        const pendingKey = this.getPendingKey(customerId);
        const currentPending = pendingValues[index] ? parseInt(String(pendingValues[index]), 10) : 0;
        const newPending = currentPending - total;
        
        if (newPending <= 0) {
          // Delete the key if it will be 0 or negative
          pipeline.del(pendingKey);
          console.log(`🧹 Will clean up pending key for ${customerId} (${currentPending} - ${total} = ${newPending})`);
        } else {
          // Otherwise just decrement
          pipeline.decrby(pendingKey, total);
        }
      });
      
      await pipeline.exec();

      console.log(`🗑️  Deleted ${keys.length} processed records from Redis`);
      
    } catch (error) {
      console.error('❌ Failed to delete records:', error);
    }
  }

  async getUsageCount(): Promise<number> {
    try {
      const keys = await redis.keys('credit:usage:*');
      return keys.length;
    } catch (error) {
      console.error('❌ Failed to get usage count:', error);
      return 0;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
      return false;
    }
  }
}

export const redisCreditTracker = new RedisCreditService();