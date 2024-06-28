// worker.js
const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const File = require('./models/File'); // Assuming you have a File model in models/File.js

// Create a queue named fileQueue
const fileQueue = new Bull('fileQueue');

// Process the queue
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Find the document based on fileId and userId
  const fileDoc = await File.findOne({ _id: fileId, userId: userId });
  if (!fileDoc) throw new Error('File not found');

  const filePath = fileDoc.path; // Assuming fileDoc contains a path field

  const thumbnailSizes = [500, 250, 100];
  for (let size of thumbnailSizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(filePath, options);
    const thumbnailPath = path.join(
      path.dirname(filePath),
      `${path.basename(filePath, path.extname(filePath))}_${size}${path.extname(filePath)}`
    );

    await fs.writeFile(thumbnailPath, thumbnail);
  }
});

module.exports = fileQueue;

