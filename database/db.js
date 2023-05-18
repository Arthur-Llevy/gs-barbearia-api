const mongoose = require('mongoose');

const connection = async () => {
	await mongoose.connect(process.env.API_URL).
	then(() => console.log('Conectou ao banco.')).
	catch(erro => console.log(`Erro ao conectar ao banco: ${erro}`))
};

module.exports = connection;