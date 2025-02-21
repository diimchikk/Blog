const{Schema, model} = require('sqlite3');
const TokenSchema = new Schema({
    user:{type: Schema.Types.ObjectId, ref: 'User'},
    refreshToken:{type: String, require: true}, 
})

module.exports = model('Token', TokenSchema);