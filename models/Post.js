const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const PostSchema = new Schema({
    name: String,
    age: String,
    sexo: String,
    esterilizado: String,
    city: String,
    pets: String,
    desc: String,
    cover: String,
    createdBy:{type:Schema.Types.ObjectId, ref:'User'},
}, {
    timestamps: true,
});

const PostModel = model('Post', PostSchema);

module.exports = PostModel;