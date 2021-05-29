const { Pool } = require('pg');
const pool = new Pool({
  database: 'dev',
  host: '35.196.167.212',
  host: '/cloudsql/realtour:us-east1:realtour',
  password: '----',
  user: 'dev-user',
  port: 5432,
});

const database_tables = {
  'boston-ma': 'boston_ma',
  heart: 'hearts',
  mail: 'mails',
  text: 'texts'
};

const _convertRowToListing = (row) => {
  return {
    baths: row.baths_full,
    beds:  row.beds,
    facts: row.facts,
    hashtags: row.hashtags,
    id: row.id,
    idxOpenHouses: row.idx_open_houses,
    idxVirtualTours: row.idx_virtual_tours,
    listingId: row.listing_id,
    pictures: row.pictures,
    price: row.price,
    remarks: row.remarks,
    sortId: row.sort_id,
    sqft: row.sqft,
    status: row.status,
    streetName: row.street_name,
    streetNo: row.street_no,
    videos: row.videos,
    zip: row.zip
  };
};

const QUERY_ADD_ACTION = 'insert into ~~TABLE_NAME~~ (email, listing_id, name, notes, phone) values ($1, $2, $3, $4, $5)';
exports.add = (collection, data) => {
  console.log(`Adding: to collection: ${collection} ${ JSON.stringify(data) }`);
  const query = {
    text: QUERY_ADD_ACTION.replace('~~TABLE_NAME~~', database_tables[collection]),
    values: [ data.email, data.listingId, data.name, data.notes, data.phone ]
  };  
  console.log(`query: ${ JSON.stringify(query) }`);

  return pool
    .connect()
    .then(client => client
      .query(query)
      .then(res => {
        client.release();
        console.log(`Added: ${ JSON.stringify(data) }`);
      })
    )
    .catch(err => {
      const statusText = `Error adding: to collection: ${collection} ${ JSON.stringify(data) }`;
      console.error(`${statusText} - ${JSON.stringify(err)}`);
      throw { status: 500, statusText: statusText };
    });
};

const QUERY_FIND_LISTING = "select * from ~~TABLE_NAME~~ where listing_id = $1 and status = 'ACT' limit 1"
exports.find = (collection, listingId) => {
  console.log(`Finding: ${ JSON.stringify(listingId) }`);
  const query = {
    text: QUERY_FIND_LISTING.replace('~~TABLE_NAME~~', database_tables[collection]),
    values: [ listingId ]
  };
  console.log(`query: ${ JSON.stringify(query) }`);

  return pool
    .connect()
    .then(client => client
      .query(query)
      .then(res => {
        client.release();
        console.log(`Found: ${ res.rows && res.rows.length }`);
        return _convertRowToListing(res.rows[0]);
      })
    )
    .catch(err => {
      const statusText = `Error finding: ${ JSON.stringify(listingId) }`;
      console.error(`${statusText} - ${JSON.stringify(err)}`);
      throw { status: 500, statusText: statusText };
    });
};

const QUERY_SEARCH_LISTINGS = "select * from ~~TABLE_NAME~~ where status = 'ACT' ~~WHERE_CLAUSE~~ order by open_house_soon desc NULLS LAST, sort_id desc limit 30";
exports.search = (collection, data) => {
  const searchCriteria = [];
  const values = [];
  let counter = 1;
  if (data.baths) {
    searchCriteria.push(` baths_full >= $${ counter } `);
    values.push(data.baths);
    counter++;
  }
  if (data.beds) {
    searchCriteria.push(` beds >= $${ counter } `);
    values.push(data.beds);
    counter++;
  }
  data.hashtags = data.hashtags && data.hashtags.filter(h => h && h.trim());
  if (data.hashtags && data.hashtags.length) {
    searchCriteria.push(` $1 && hashtags `);
    values.push(data.hashtags);
    counter++;
  }  
  if (data.lastId) {
    searchCriteria.push(` sort_id < $${ counter } `);
    values.push(data.lastId);
    counter++;
  }
  if (data.maxPrice) {
    searchCriteria.push(` price <= $${ counter } `);
    values.push(data.maxPrice);
    counter++;
  }
  if (data.minPrice) {
    searchCriteria.push(` price >= $${ counter } `);
    values.push(data.minPrice);
    counter++;
  }
  if (data.maxSqft) {
    searchCriteria.push(` sqft <= $${ counter } `);
    values.push(data.maxSqft);
    counter++;
  }
  if (data.minSqft) {
    searchCriteria.push(` sqft >= $${ counter } `);
    values.push(data.minSqft);
    counter++;
  }
  if (data.types.length) {
    const ins = [];
    data
      .types
      .forEach(t => {
        ins.push(` type = $${ counter } `);
        values.push(t);
        counter++;
      });
    searchCriteria.push(` ( ${ ins.join(' or ') } ) `);
  }
  if (data.zip) {
    searchCriteria.push(` zip = $${ counter } `);
    values.push(data.zip);
    counter++;
  }
  console.log(`Searching: ${ JSON.stringify(searchCriteria) }`);

  const query = {
    text: QUERY_SEARCH_LISTINGS.replace('~~TABLE_NAME~~', database_tables[collection]).replace('~~WHERE_CLAUSE~~', searchCriteria.length ? ' and ' + searchCriteria.join(' and ') : ''),
    values: values
  };
  console.log(`query: ${ JSON.stringify(query) }`);

  return pool
    .connect()
    .then(client => client
      .query(query)
      .then(res => {
        client.release();
        console.log(`Searched: ${ res.rows && res.rows.length }`);
        return res.rows.map(_convertRowToListing);
      })
    )
    .catch(err => {
      const statusText = `Error searching: ${ JSON.stringify(searchCriteria) }`;
      console.error(`${statusText} - ${JSON.stringify(err)}`);
      throw { status: 500, statusText: statusText };
    });
};

const QUERY_ADD_VIDEO = "update ~~TABLE_NAME~~ set videos = videos || ARRAY[$1], sort_id = '60-' || listing_id where listing_id = $2 and agent_id = $3 ";
exports.update = (collection, data) => {
  console.log(`Updating ${collection} ${JSON.stringify(data)}`);
  const query = {
    text: QUERY_ADD_VIDEO.replace('~~TABLE_NAME~~', database_tables[collection]),
    values: [ data.video, data.listingId, data.agentId ]
  };
  console.log(`query: ${ JSON.stringify(query) }`);

  return pool
    .connect()
    .then(client => client
      .query(query)
      .then(res => {
        if (!res.rowCount) {
          const statusText = `Invalid property ${JSON.stringify(data)}`;
          console.error(`${statusText} at ${collection} - ${JSON.stringify(err)}`);
          throw { status: 404, statusText: statusText };
        }
        client.release();
        console.log(`Added video: ${ JSON.stringify(res) }`);
      })
    )
    .catch(err => {
      const statusText = `Error searching: ${ JSON.stringify(searchCriteria) }`;
      console.error(`${statusText} - ${JSON.stringify(err)}`);
      throw { status: 500, statusText: statusText };
    });
};
