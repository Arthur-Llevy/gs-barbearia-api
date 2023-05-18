const mongoose = require('mongoose');

const BarberSchema = new mongoose.Schema({
	nome: {
		type: String,
		required: true
	},

	email: {
		type: String,
		required: true
	},

	senha: {
		type: String,
		required: true
	},
});

const BarberModel = mongoose.model('Barber', BarberSchema);

module.exports = BarberModel;