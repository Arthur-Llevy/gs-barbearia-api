const mongoose = require('mongoose');

const NotificationsSchema = new mongoose.Schema({
	idCliente: {
		type: Number,
		required: true
	},

	nome: {
		required: true,
		type: String
	},

	solicitacaoAceita: {
		type: Boolean,
		required: true,
		default: false
	},

	id: {
		required: true,
		type: Number
	}
}, { timestamps: true });

const NotificationsModel =  mongoose.model('Notificacoes', NotificationsSchema);

module.exports = NotificationsModel;