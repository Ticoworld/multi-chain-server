const mongoose = require('mongoose');

const User = new mongoose.Schema(
    {
        firstname: {type: String, required: true},
        lastname: {type: String, required: true},
        password: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        phone: {type: String, required: true, default: ''},
        country: {type: String, required: true, default: ''},
        username: {type: String, required: true},
        funded: { type: Number },
        capital: { type: Number, default: 0 },
        investment: { type: [Object] },
        transaction: { type: [Object] },
        withdraw: { type: [Object], default: [] },
        deposit: { type: [Object], default: [] },
        profilepicture: { type: String, default: '' },
        totalprofit: { type: Number, default: 0 },
        periodicProfit: { type: Number, default: 0 },
        totaldeposit: { type: Number, default: 0 },
        totalwithdraw: { type: Number, default: 0 },
        promo: { type: Boolean, default: false },
        withdrawDuration: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
            },
    {collection: 'user-data'}
)

const model = mongoose.model('UserData', User)

module.exports = model