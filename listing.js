const db = require('./postgres');
const mail = require('./mail');

const EMAIL = 'realtourservice@gmail.com';
const NEW_VIDEO_MESSAGE = `New video uploaded to ~~ID~~`;

/** All private functions */

/**
 * Sanitizes the given request for find.
 *
 * @param {Object} req The request to sanitize
 * @param {String} req.id The listing id
 * @param {String} req.cityId The city id for the given listing id
 * @returns {Object} returns {id, cityId} from the request; other req fiels are ignored
 * @throws 400 error if id or cityId is missing
 */
const _santizeRequestForFind = (req) => {
  const data = req.body;
  console.log(`Sanitizing for find ${JSON.stringify(data)}`);
  if (!data || !data.cityId || !data.id) {
    throw { status: 400, message: `Invalid data: ${JSON.stringify(data)}` };
  }

  return {
    cityId: data.cityId,
    id: data.id
  };
};

/**
 * Sanitizes the given request for search.
 *
 * @param {Object} req The request to sanitize.
 * @param {String} req.cityId The city id for the given listing id (along with other fields)
 * @returns Object with the applicable search fields; all other req fields are ignored.
 * @throws 400 error if id or cityId is missing
 */
const _santizeRequestForSearch = (req) => {
  const data = req.body;
  console.log(`Sanitizing for search ${JSON.stringify(data)}`);
  if (!data || !data.cityId) {
    throw { status: 400, message: `Invalid data: ${JSON.stringify(data)}` };
  }

  return {
    baths: data.baths || 0,
    beds: data.beds || 0,
    cityId: data.cityId,
    hashtags: data.hashtags || [],
    lastId: data.lastId,
    maxPrice: data.maxPrice,
    minPrice: data.minPrice,
    maxSqft: data.maxSqft,
    minSqft: data.minSqft,
    types: data.types || [],
    zip: data.zip
  };
};

/**
 * Sanitizes the given request for update.
 *
 * @param {Object} req The request to sanitize.
 * @returns Object with the properties to update {agent, cityId, listingId, video}
 * @throws 400 error if required information is missing.
 */
const _santizeRequestForUpdate = (req) => {
  const data = req.body;
  console.log(`Sanitizing for update ${JSON.stringify(data)}`);
  if (!data
    || !data.listingId
    || !data.cityId
    || !data.video
    || !data.agent || !data.agent.agentId || !data.agent.user || !data.agent.user.phone || !data.agent.user.email || !data.agent.user.name) {
    throw { status: 400, message: `Invalid data: ${JSON.stringify(data)}` };
  }

  return {
    agent: data.agent,
    cityId: data.cityId,
    listingId: data.listingId,
    video: `~${data.video}`
  };
};

/**
 * Gets the listing information after removing confidential fields.
 *
 * @param {Object} data The data based on which listing object should be returned.
 * @returns The listing object after removing confidential fields.
 */
const _getListingFromData = (data) => {
  delete data.agentId;
  return data;
};

/** All export functions */

/**
 * Find listing based on the request fields.
 *
 * @param {Object} req Request object with applicable filters.
 * @param {Object} res Response with the applicable data.
 */
exports.find = (req, res) => {
  try {
    const data = _santizeRequestForFind(req);
    return db
      .find(data.cityId, data.id)
      .then(d => {
        console.log(`Success find: ${JSON.stringify(data)}`);
        return res.status(200).send(_getListingFromData(d));
      })
      .catch(err => {
        console.log(`Error find: ${JSON.stringify(data)} - ${JSON.stringify(err)}`);
        return res.status(404).send();
      });
  } catch (ex) {
    console.error(ex);
    res.status(400).send(ex);
  }
};

/**
 * Search for listings based on the request fields.
 *
 * @param {Object} req Request object with applicable filters.
 * @param {Object} res Response with the applicable data.
 */
exports.search = (req, res) => {
  try {
    const data = _santizeRequestForSearch(req);
    return db
      .search(data.cityId, data)
      .then(d => {
        console.log(`Success search: ${JSON.stringify(data)}`);
        return res.status(200).send(d && d.map(e => _getListingFromData(e)));
      })
      .catch(err => {
        console.log(`Error search: ${JSON.stringify(data)} - ${JSON.stringify(err)}`);
        return res.status(404).send();
      });
  } catch (ex) {
    console.error(ex);
    res.status(400).send(ex);
  }
};

/**
 * Updates a given listing with video tours. This is called by agents when they want to
 * associate a new video with their listing.
 *
 * @param {Object} req Request object with applicable video and agent information.
 * @param {Object} res Response with the applicable data.
 * @returns 
 */
exports.update = (req, res) => {
  try {
    const data = _santizeRequestForUpdate(req);
    return db
      .update(data.cityId, data)
      .then(d => {
        console.log(`Success update: ${JSON.stringify(data)}`);
        return res.status(200).send(d);
      })
      .then(() => {
        // TODO: Temporarily disabling new video approval.
        // return mail.send(EMAIL, EMAIL, 'New video for approval', NEW_VIDEO_MESSAGE.replace('~~ID~~', data.listingId));
      })
      .catch(err => {
        console.log(`Error update: ${JSON.stringify(data)} - ${JSON.stringify(err)}`);
        return res.status(404).send();
      });
  } catch (ex) {
    console.error(ex);
    res.status(400).send(ex);
  }
};