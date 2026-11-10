const Notification = require('../models/Notification');
const { Webhook, WebhookDelivery } = require('../models/Webhook');
const axios = require('axios');
const crypto = require('crypto');

// Create notification for a user
const createNotification = async ({
  userId,
  organizationId,
  type = 'system',
  title,
  message,
  data = {},
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      organization: organizationId,
      type,
      title,
      message,
      data,
    });
    return notification;
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

// Dispatch webhooks asynchronously
const dispatchWebhook = async (organizationId, eventName, payload) => {
  try {
    const webhooks = await Webhook.find({
      organization: organizationId,
      isActive: true,
      events: eventName,
    });

    for (const hook of webhooks) {
      // Run in background without blocking API response
      (async () => {
        const timestamp = Date.now();
        const signature = crypto
          .createHmac('sha256', hook.secret)
          .update(`${timestamp}.${JSON.stringify(payload)}`)
          .digest('hex');

        let responseStatus = null;
        let responseBody = '';
        let success = false;

        try {
          const res = await axios.post(
            hook.url,
            { event: eventName, timestamp, data: payload },
            {
              headers: {
                'X-ProjectFlow-Signature': signature,
                'X-ProjectFlow-Timestamp': timestamp,
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            }
          );
          responseStatus = res.status;
          responseBody = JSON.stringify(res.data).substring(0, 500);
          success = res.status >= 200 && res.status < 300;
        } catch (postErr) {
          responseStatus = postErr.response?.status || 500;
          responseBody = (postErr.message || '').substring(0, 500);
          success = false;
        }

        await WebhookDelivery.create({
          webhook: hook._id,
          event: eventName,
          payload,
          responseStatus,
          responseBody,
          deliveredAt: new Date(),
          success,
        });
      })();
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err.message);
  }
};

module.exports = { createNotification, dispatchWebhook };

