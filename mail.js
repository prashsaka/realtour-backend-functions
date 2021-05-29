const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('----');

/***
 * Function to send email with the given:
 * - from email address (ideally, should always be realtour email address),
 * - to email address
 * - subject
 * - body content
 */exports.send = (from, to, subject, body) => {
  console.log(`Sending mail to: ${to}, ${subject}`);
  return sgMail
    .send({
      // TODO: Find a way to change this to text/html
      content: [{ type: 'text/plain', value: body }],
      from: from,
      subject: subject,
      to: to
    })
    .then(() => console.log(`Sent mail to: ${to}, subject: ${subject}`))
    .catch((err) => {
      const statusText = `Error sending mail to: ${to}, subject: ${subject}`;
      console.error(`${statusText} - ${JSON.stringify(err)}`);
      throw { status: 500, statusText: statusText };
    });
};