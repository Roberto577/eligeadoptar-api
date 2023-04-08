const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
    userName: {type: String, required: true, unique: true},
    userEmail: {type: String, required: true, unique: true},
    password: {type: String, required: true, min: 4},
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;