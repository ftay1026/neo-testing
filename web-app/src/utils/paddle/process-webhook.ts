import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  EventEntity,
  EventName,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  TransactionPaidEvent,
  TransactionCompletedEvent,
} from '@paddle/paddle-node-sdk';
import { createClient } from '@/utils/supabase/admin';

export class ProcessWebhook {
  async processEvent(eventData: EventEntity) {
    switch (eventData.eventType) {
      case EventName.TransactionPaid:
        await this.processTransactionEvent(eventData);
        break;
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
        await this.updateSubscriptionData(eventData);
        break;
      case EventName.CustomerCreated:
      case EventName.CustomerUpdated:
        await this.updateCustomerData(eventData);
        break;
    }
  }

  private async updateSubscriptionData(eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent) {
    try {
      const supabase = await createClient();
      const response = await supabase
        .from('subscriptions')
        .upsert({
          subscription_id: eventData.data.id,
          subscription_status: eventData.data.status,
          price_id: eventData.data.items[0].price?.id ?? '',
          product_id: eventData.data.items[0].price?.productId ?? '',
          scheduled_change: eventData.data.scheduledChange?.effectiveAt,
          customer_id: eventData.data.customerId,
        })
        .select();
      console.log(response);
    } catch (e) {
      console.error(e);
    }
  }

  private async updateCustomerData(eventData: CustomerCreatedEvent | CustomerUpdatedEvent) {
    try {
      const supabase = await createClient();
      const response = await supabase
        .from('customers')
        .upsert({
          customer_id: eventData.data.id,
          email: eventData.data.email,
        })
        .select();
      console.log(response);
    } catch (e) {
      console.error(e);
    }
  }

  async processTransactionEvent(eventData: TransactionPaidEvent) {
    try {
      const supabase = await createClient();
      const customerId = eventData.data.customerId; // Get customer email from eventData

      if (!customerId) {
        console.error('Customer ID is missing from the event data.');
        return;
      }

      // Check if the customer exists in the database
      const { data: customer, error } = await supabase
        .from('customers')
        .select('customer_id, email')
        .eq('customer_id', customerId)
        .single();

      if (!customer) {
        console.log('Customer not found, creating a new entry...');
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            customer_id: customerId,
            email: null  // Since we don't have the email in this event, we set it to null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create new customer:', insertError);
          return;
        }

        console.log('New customer created:', newCustomer);
      } else {
        console.log('Existing customer found:', customer);
      }

      const creditsPurchased = 100; // Adjust based on your product

      // Log the transaction and add credits
      const transactionLog = await supabase.rpc('add_credits', {
        p_customer_id: customerId,
        p_amount: creditsPurchased,
        p_description: `Paddle purchase: ${creditsPurchased} credits`,
      });

      console.log('Transaction processed successfully', transactionLog);

    } catch (e) {
      console.error('Error processing transaction event:', e);
    }
  }
}
