const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
	nome: {
		type: String,
		required: true
	},

	id: {
		type: Number,
		required: true
	},

	cortes: {
		type: Number,
		required: true
	},

	email: {
		type: String,
		required: true
	},

	senha: {
		type: String,
		required: true
	}
}, { timestamps: true });

const UsersModel = mongoose.model('Users', UsersSchema);

module.exports = UsersModel;