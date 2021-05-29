const db = require('./postgres');
const mail = require('./mail');
const text = require('./text');


/** All application constants **/
const ACTION_BOOK = 'book';
const ACTION_HEART = 'heart';
const ACTION_MAIL = 'mail';
const ACTION_TEXT = 'text';
const ACTIONS = [ACTION_BOOK, ACTION_HEART, ACTION_MAIL, ACTION_TEXT];
const FROM_EMAIL = 'realtourservice@gmail.com';
const FROM_TEXT = '5412348687';
const SERVER = 'https://realtournetwork.com';
const HEART_BCC = `~~NAME~~ at ~~EMAIL~~ and ~~PHONE~~ liked the property ${SERVER}/details/~~LISTING_ID~~`;
const HEART_MESSAGE = `Hi ~~NAME~~, Your RealTour ❤️ listing is here - ${SERVER}/details/~~LISTING_ID~~`;
const HEART_SUBJECT = `RealTour ❤️ listing!`;
const MAIL_MESSAGE = `~~NAME~~ at ~~EMAIL~~ and ~~PHONE~~ sent a mail about the property ${SERVER}/details/~~LISTING_ID~~`;
const TEXT_MESSAGE = `~~NAME~~ at ~~EMAIL~~ and ~~PHONE~~ sent a text about the property ${SERVER}/details/~~LISTING_ID~~`;


/** All private functions */

/**
 * Sanitizes the given request.
 *
 * @param {Object} req Request that needs to be sanitized.
 * @returns {action, email, listingId, name, notes, phone} from the request; other fields are ignored.
 * @throws 400 error if:
 * - required information is missing
 * - action is not one of: book, heart, mail, text.
 */
const _santizeRequest = (req) => {
  const data = req.body;
  console.log(`Sanitizing ${JSON.stringify(data)}`);
  if (!data || !data.action || ACTIONS.indexOf(data.action) < 0) {
    throw { status: 400, message: `Invalid action: ${JSON.stringify(data)}` };
  } else if (!data.listingId || !data.user || !data.user.name || !data.user.email || !data.user.phone) {
      throw { status: 400, message: `Missing data: ${JSON.stringify(data)}` };
  }
  console.log(`Valid ${JSON.stringify(data)}`);

  const listingId = data.listingId;
  const name = data.user.name;
  const email = data.user.email.trim();
  const phone = data.user.phone.trim().replace(/\D/g, '').replace(/^1/, '');
  if (!email.match(/[a-zA-Z0-9_.-]*@[a-zA-Z0-9_.-]*\.[a-zA-Z0-9_.-]*/) || !phone.match(/^[0-9]{10}$/)) {
    throw { status: 400, message: `Invalid data: ${JSON.stringify(data)}` };
  }

  return {
    action: data.action,
    email: email,
    listingId: listingId,
    name: name,
    notes: data.notes,
    phone: phone
  };
};

/**
 * Returns message text for the given data.
 *
 * @param {String} template The message template to use
 * @param {Object} data The object with the message data.
 * @returns {String} The message text for the given data.
 */
const _getMessage = (template, data) => {
  return template
    .replace('~~NAME~~', data.name)
    .replace('~~EMAIL~~', data.email)
    .replace('~~PHONE~~', data.phone)
    .replace('~~LISTING_ID~~', data.listingId)
};

/**
 * Send the applicable message for the given data.
 *
 * @param {Object} data The object with the message data.
 * @returns {Promise} Promise that resolves when the message is sent.
 */
const _processAction = (data) => {
  console.log(`Processing action ${JSON.stringify(data)}`);
  switch (data.action) {
    case ACTION_HEART:
      const heartMessage = _getMessage(HEART_MESSAGE, data);
      const heartBccMessage = _getMessage(HEART_BCC, data);
      return Promise.all([
        mail.send(FROM_EMAIL, FROM_EMAIL, `${HEART_SUBJECT} from ${data.email}`, heartBccMessage),
        mail.send(FROM_EMAIL, data.email, HEART_SUBJECT, heartMessage),
        text.send(FROM_TEXT, data.phone, heartMessage)
      ]);
    case ACTION_MAIL:
      const mailMessage = _getMessage(MAIL_MESSAGE, data);
      return mail.send(FROM_EMAIL, FROM_EMAIL, 'Listing email', mailMessage);
    case ACTION_TEXT:
      const textMessage = _getMessage(TEXT_MESSAGE, data);
      return mail.send(FROM_EMAIL, FROM_EMAIL, 'Listing email', textMessage);
  }
};


exports.run = (req, res) => {
  const errors = [];
  try {
    const data = _santizeRequest(req);
    const collection = req.body.action;
    db
      .add(collection, data)
      // TODO: Temporarily disable sending the actual message.
      // .then(() => _processAction(data))
      .then(d => {
        console.log(`Success adding: ${JSON.stringify(data)}`);
        return res.status(200).send();
      })
      .catch(err => {
        if (!err || !err.status) return res.status(500).send(err);
        return res.status(err.status).send(err);
      });
  } catch (ex) {
    console.error(ex);
    res.status(400).send(ex);
  }
};