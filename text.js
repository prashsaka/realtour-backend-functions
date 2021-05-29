const twillioClient = require('twilio')('---', '---');

/***
 * Function to send text with the given:
 * - from phone number (ideally, should always be realtour phone number),
 * - to phone number
 * - message content
 */
 exports.send = (from, to, message) => {
  return twillioClient
    .messages
    .create({
      body: message,
      from: from,
      to: to
    })
    .then(() => console.log(`Sent text to: ${to} message: ${message}`))
    .catch((err) => {
      const statusText = `Error sending text to: ${to} message: ${message}`;
      console.error(`${statusText} - ${JSON.stringify(err)}`);
      throw { status: 500, statusText: statusText };
    });
}