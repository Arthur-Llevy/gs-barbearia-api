const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsersModel = require('../database/models/UsersModel');
const BarberModel = require('../database/models/BarberModel');
const NotificationsModel = require('../database/models/NotificationsModel');
const cors = require('cors');
const ClientNotificationsModel = require('../database/models/ClientNotifications');
const express = require('express');
const app = express();

app.use(express.json());


const controllers = {

	registerNewClient: 	async (req, res) => {
	
		let name = req.body.nome;
		let email = req.body.email;
		let password = req.body.senha;

		let salt = await bcrypt.genSalt(10);
		let passwordHash = await  bcrypt.hash(password, salt);

		let allUsers = await UsersModel.find({});
		let notExist = await UsersModel.findOne({email: email});

		if(notExist === null){
			let newUser = await UsersModel.create({
				nome: name,
				email: email,
				senha: passwordHash,
				cortes: 0,
				id: allUsers.length + 1
			})

			res.status(201).json({message:'Usuário cadastrado com sucesso!'})


		}else {
			res.status(200).json({message: "Usuário já cadastrado!"})
		};
	},

	clientLogin: async (req, res) => {
		const secret = process.env.SECRET;
		let email = req.body.email;	
		let password = req.body.senha;		

		let user = await UsersModel.findOne({email: email});
		
		if(user){		
			let compare = await bcrypt.compare(password, user.senha);
			if(compare){
				let token = jwt.sign({
					id: user.id
				}, secret, {expiresIn: 3600});
				res.status(200).json({token: token});
			}else {
				res.status(401).json({message: 'E-mail ou senha inválidos.'})
			};
		}else {
			res.status(404).json({message: 'Usuário não encontrado.'})
		};
	},

	verifyToken: async (req, res) => {
	  res.status(200).json({token: true})
	},

	barberLogin: async (req, res) => {
		const secret = process.env.SECRET;
		let email = req.body.email;
		let password = req.body.senha;

		let confirmBarber = await BarberModel.findOne({email: email});		

		if(confirmBarber){
			let validation = await bcrypt.compare(password, confirmBarber.senha);			

			if(validation){
				let token = jwt.sign({
					email: confirmBarber.email
				}, secret, {expiresIn: 3600});
				res.status(200).json({token: token});
			}else {
				res.status(401).json({message: 'Senha incorreta.'});
			};

		}else {
			res.status(404).json({message: 'Usuário não encontrado.'});
		}

	},

	barberAddCut: async (req, res) => {			
		try {
			let user = await UsersModel.findOne({id: req.body.id});
			if(user){
				await UsersModel.findOneAndUpdate({id: req.body.id}, {cortes: user.cortes + 1});
				res.status(200).json({message: 'Corte adicionado com sucesso.'});
			}else {
				res.status(404).json({message: 'Usuário não encontrado.'})
			}
		}catch(erro){
			res.status(500).json({message: 'Ocorreu um erro a adicionar um corte.'})
		}
	},

	clientDatas:  async (req, res) => {		
		let user = await UsersModel.findOne({id: req.decoded.id});
		if(user){
			res.status(200).json({name: user.nome, cuts: user.cortes});
		}
	},

	barberDatas:  async (req, res) => {
		let barber = await BarberModel.findOne({email: req.decoded.email})
		if(barber){
			res.status(200).json({name: barber.nome});
		}
	},

	findClient: async (req, res) => {
		let user = await UsersModel.findOne({id: req.body.id});
		if(user !== null ){
			res.status(200).json({name: user.nome, cuts: user.cortes, id: user.id});
		}else {
			res.status(404).json({message: 'Usuário não encontrado'});
		}
	},

	clientRequestCut: async (req, res) => {			
		let id = req.decoded.id;
		let user = await UsersModel.findOne({id: id});
		if(user){				
			await NotificationsModel.create({
				idCliente: id,
				nome: user.nome
			}).
				then(() => {
					ClientNotificationsModel.create({
					idCliente: id,
					nome: user.nome
				}).
					then(() => res.status(200).json({message: 'Solicitação enviada ao barbeiro.'}))	
				}).
				catch(() => res.status(500).json({message: 'Falha ao enviar a solicitação, tente novamente mais tarde.'}));
		}else {
			res.status(500).json({message: 'Falha ao enviar a solicitação, tente novamente mais tarde.'});
		}
	},

	notifications: async (req, res) => {	

		if(req.method === 'GET'){
			await NotificationsModel.find({}).
				then((data) => {
					res.status(200).json(data)
			});
		}else {
			await ClientNotificationsModel.find({idCliente: req.decoded.id}).
				then(data => res.status(200).json(data)).
				catch(() => res.status(500).json({message: 'Falha ao buscar as notificações, tente novamente mais tarde.'}))
		};

	},

	confirmCutRequest: async (req, res) => {
		let id = req.body.id;
		let user =  await UsersModel.findOne({id: id});
		await UsersModel.findOneAndUpdate({id: id}, {
			cortes: user.cortes + 1
		}).
			then(() => {}).catch(() => {
					res.status(500).json({message: 'Falha ao confirmar solicitação de corte, tente novamente mais tarde.'})					
				})
		await NotificationsModel.findOneAndUpdate({idCliente: id}, {solicitacaoAceita: true}).
				then(() => {		
					ClientNotificationsModel.findOneAndUpdate({idCliente: id}, {solicitacaoAceita: true}).then(() => res.status(200).json({message: 'Solicitação aceita. Corte adicionado ao cliente'}))
					
				}).
				catch(() => res.status(500).json({message: 'Falha ao confirmar solicitação de corte, tente novamente mais tarde.'}))
		},

		deleteNotification: async (req, res) => {
			let id = req.body.id;
			if(req.url === '/barbeiro/excluirNotificacao'){
				await NotificationsModel.findOneAndDelete({idCliente: id}).
					then(() => res.status(200).json({message: 'Notificação excluida com sucesso.'})).
					catch(() => res.status(500).json({message: 'Falha ao excluir a notificação. Tente novamente mais tarde.'}))				
			}else {
					await ClientNotificationsModel.findOneAndDelete({idCliente: id}).
					then(() => res.status(200).json({message: 'Notificação excluida com sucesso.'})).
					catch(() => res.status(500).json({message: 'Falha ao excluir a notificação. Tente novamente mais tarde.'}))
			}
		}

};

module.exports = controllers ;