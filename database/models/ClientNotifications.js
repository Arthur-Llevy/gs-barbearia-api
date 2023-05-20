const mongoose = require('mongoose');

const ClientNotificationsSchema = new mongoose.Schema({
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
	}
});

const ClientNotificationsModel =  mongoose.model('NotificacoesCliente', ClientNotificationsSchema);

module.exports = ClientNotificationsModel;