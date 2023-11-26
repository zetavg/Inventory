const express = require('express');
const nano = require('nano');
const app = express();

// Import configuration
const config = require('./config.json');

// Build CouchDB connection string
const couchUrl = `${config.couchdb.url}`;
const couchAuth = `${config.couchdb.username}:${config.couchdb.password}`;
const couch = nano(`${couchUrl.replace('//', `//${couchAuth}@`)}`);

app.get('/:database_name/images/:image_id.:ext', async (req, res) => {
  const { database_name, image_id } = req.params;
  const db = couch.use(database_name);

  try {
    const docId = `zz20-image-${image_id}`;
    // Fetch the document by ID
    const doc = await db.get(docId, { attachments: true });

    // Check if the document is of type 'image'
    if (doc.type !== 'image' || !doc._attachments['image-1440']) {
      return res.status(404).send('Image Not Found');
    }

    // Fetch the image attachment
    const imageStream = await db.attachment.getAsStream(docId, 'image-1440');

    // Set the correct content type for the image
    res.set('Content-Type', doc._attachments['image-1440'].content_type);

    // Pipe the image stream to the response
    imageStream.pipe(res);
  } catch (error) {
    if (error.message === 'not_found' || error.message === 'missing' || error.message === 'deleted') {
      res.status(404).send('Not Found');
    } else {
      console.error('Error fetching image:', error);
      res.status(500).send('Internal Server Error');
    }
  }
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
