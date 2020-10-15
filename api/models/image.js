 const mongoose = require('mongoose');

const imageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    pictureImage: { type: String, required: true}
});

module.exports = mongoose.model('Image', imageSchema); 