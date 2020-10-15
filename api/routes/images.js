const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const tf = require('@tensorflow/tfjs');
const { Canvas } = require('canvas');
const fs = require('fs');
const jpeg = require('jpeg-js');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

let model;
async function loadModel() {
    model = await tf.loadLayersModel('https://galatis-giuliano.github.io/keras_model/model.json');
    console.log("Runs");
    //console.log(model);
    //preprocess(3);
};

function preprocess(img) {
    var imageTest = new Canvas(96, 96);
    imageTest.src = 'http://localhost:4000/uploads/Justin.jpg';
    let tensor = tf.browser.fromPixels(imageTest, 3)
    .resizeNearestNeighbor([96, 96]) // change the image size
    .expandDims()
    .toFloat()
    return tensor;
}

const Image = require('../models/image');

const readImage = path => {
    const buf = fs.readFileSync(path)
    const pixels = jpeg.decode(buf, true)
    return pixels
  }

  const imageToInput = (image, numChannels) => {
    const values = imageByteArray(image, numChannels)
    const outShape = [image.height, image.width, numChannels];
    const input = tf.tensor3d(values, outShape, 'float32');
    
    return input
  }

  const imageByteArray = (image, numChannels) => {
    const pixels = image.data
    const numPixels = image.width * image.height;
    const values = new Float32Array(numPixels * numChannels);
  
    for (let i = 0; i < numPixels; i++) {
      for (let channel = 0; channel < numChannels; ++channel) {
        values[i * numChannels + channel] = (pixels[i * 4 + channel])/255;
       
      }
    }
    console.log(values)
    return values
  }

router.post('/', upload.single('pictureImage'), (req, res, next) => {
    console.log(req.file);
    const image = new Image({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        pictureImage: req.file.path
    }); 
    //let imageTest = readImage(image.pictureImage)
    //console.log(imageTest);
    //const input = imageToInput(imageTest, 3)
    //const imageReshaped = tf.expandDims(input)
    //console.log(imageReshaped)
    //input.shape = [null,96,96,3];
    //const prediction = model.predict(imageReshaped).print()
    //console.log("Predictions: ",model.predict(imageReshaped).print());

    //let prediction = model.predict("uploads\\Justin.jpg");
    
    let imageTest = readImage(image.pictureImage)
    //console.log(imageTest);
    const input = imageToInput(imageTest, 3)
    const imageReshaped = tf.expandDims(input)
    

    const prediction = model.predict(imageReshaped)
    const value = prediction.dataSync()[0]
    //console.log(value)

    image.save().then(result => {
        console.log(result);
        res.status(201).json({ 
            message:  "Image uploaded successfully",
            result: "Values greater than .5 = male, less than .5 = female",
            maleFemale: value    
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
    }); 
});

module.exports = router;

loadModel();