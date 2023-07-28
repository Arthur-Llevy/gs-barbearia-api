const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsersModel = require('../database/models/UsersModel');
const BarberModel = require('../database/models/BarberModel');
const NotificationsModel = require('../database/models/NotificationsModel');
const cors = require('cors');
const ClientNotificationsModel = require('../database/models/ClientNotifications');
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();

app.use(express.json());
app.use(cors())

let emailTransporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.NODEMAILER_EMAIL,
		pass: process.env.NODEMAILER_PASS
	}
});

const controllers = {

	registerNewClient: 	async (req, res) => {
	
		let { name, email, password } = req.body;
		
		if(name === undefined) return res.status(400).json({msg: 'O nome é obrigatório.'});
		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatório.'});
		if(password === undefined) return res.status(400).json({msg: 'A senha é obrigatória.'});

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
				.then(data => {
					res.status(201).json({message:`Usuário cadastrado com sucesso! Seu id para busca é ${allUsers.length + 1}`})
				})

		}else {
			res.status(200).json({message: "Usuário já cadastrado!"})
		};
	},

	clientLogin: async (req, res) => {
		const secret = process.env.SECRET;
		let { email, password } = req.body;	

		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatório.'});
		if(password === undefined) return res.status(400).json({msg: 'A senha é obrigatória.'});

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

	clientRegisterWithGoogle: async (req, res) => {
		const { email, name }  = req.body;

		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatório.'});
		if(name === undefined) return res.status(400).json({msg: 'O nome é obrigatória.'});

		let user = await UsersModel.findOne({email: email});
		let allUsers = await UsersModel.find({});
		if(!user){
			await UsersModel.create({
				email: email,
				nome: name,
				cortes: 0,
				id: allUsers.length + 1
			}).then(() => res.status(201).json({message:`Usuário cadastrado com sucesso! Seu id para busca é ${allUsers.length + 1}`}))
			.catch(() => res.status(500).json({message: 'Falha ao cadastrar o cliente. Tente novamente mais tarde.'}))
		}else {
			res.status(200).json({message: 'Cliente já cadastrado.'})
		}
	},

	clientLoginWithGoogle: async (req, res) => {
		let email = req.body.email;

		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatório.'});

		let user = await UsersModel.findOne({email: email});
		const secret = process.env.SECRET;
		if(user){
			let token = jwt.sign({
				email: email
			}, secret, {expiresIn: 3600});
			res.status(200).json({token})
		}else{
			res.status(404).json({message: 'Usuário não encontrado.'})
		};
	},

	clientForgotPassword: async (req, res) => {
		let { email } = req.body;

		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatório.'});

		const secret = process.env.SECRET;
		try {
		  await UsersModel.findOne({ email: email })		  	
		    .then(async (user) => {
		    	let token = jwt.sign({
		    		id: user.id
		    	}, secret, {expiresIn: 3600})
		      await emailTransporter.sendMail({
		        from: process.env.NODEMAILER_EMAIL,
		        to: email,
		        subject: 'Esqueceu sua senha?',
		        text: 'Clique no link abaixo para redefinir sua senha:',
		        html: `<a href='http://localhost:3000/cliente/esqueceuSenha?token=${token}'>Redefinir senha</a>`
		      });
		      res.status(200).json({
		        message: 'Um e-mail foi enviado para sua conta com as instruções para a recuperação de sua senha.'
		      });
		    })
		    .catch(() =>
		      res.status(500).json({
		        message: 'Falha no servidor. Tente novamente mais tarde.'
		      })
		    );
		} catch (error) {
		  res.status(500).json({ message: 'Falha no servidor. Tente novamente mais tarde.' });
		};
	},

	clientChangePassword: async (req, res) => {
		let { password } = req.body;

		if(password === undefined) return res.status(400).json({msg: 'A senha é obrigatória.'});

		let passwordHash = await bcrypt.hash(password, 10);
		await UsersModel.findOne({id: req.decoded.id})
		.then(async data => {			
			await UsersModel.findOneAndUpdate({id: data.id}, {senha: passwordHash})
			.then(() => res.status(200).json({message: 'Senha alterada com sucesso'}))
			.catch(() => res.status(500).json({message: 'Falha ao alterar a senha. Tente novamente mais tarde.'}))
		})
		.catch(() => res.status(500).json({message: 'Falha ao redefinir a senha. Tente novamente mais tarde.'}))
	},

	verifyToken: async (req, res) => {
	  res.status(200).json({token: true})
	},

	barberLogin: async (req, res) => {
		const secret = process.env.SECRET;
		let { email, password } = req.body;

		if(password === undefined) return res.status(400).json({msg: 'A senha é obrigatória.'});
		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatória.'});

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

	barberLoginWithGoogle: async (req, res) => {
		let email = req.body.email;

		if(email === undefined) return res.status(400).json({msg: 'O email é obrigatória.'});

			let user = await BarberModel.findOne({email: email});
			const secret = process.env.SECRET;
			if(user){
				let token = jwt.sign({
					email: email
				}, secret, {expiresIn: 3600});
				res.status(200).json({token})
			}else{
				res.status(404).json({message: 'Usuário não encontrado.'})
			};
	},

	barberAddCut: async (req, res) => {			
		try {
			let user = await UsersModel.findOne({id: req.body.id});
			if(user.cortes >= 6){
				await UsersModel.findOneAndUpdate({id: req.body.id}, {cortes: 0});
				res.status(200).json({message: 'Quantidade de cortes zerado com sucesso.'});
			}else if(user){
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
		if(decoded.id){
			let user = await UsersModel.findOne({id: req.decoded.id});
			if(user){
				res.status(200).json({name: user.nome, cuts: user.cortes});
			}
		}else if(decoded.email){
			let user = await UsersModel.findOne({email: req.decoded.email});
			if(user){
				res.status(200).json({name: user.nome, cuts: user.cortes});
			}
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
		let decoded = req.decoded;
		if(decoded.id){
			let user = await UsersModel.findOne({id: decoded.id});
			if(user){				
				let allNotifications = await NotificationsModel.find({});
				await NotificationsModel.create({
					idCliente: decoded.id,
					nome: user.nome,
					id: allNotifications.length + 1
				}).
					then(() => {
						ClientNotificationsModel.create({
						idCliente: decoded.id,
						nome: user.nome,
						id: allNotifications.length + 1
					}).
						then(() => res.status(200).json({message: 'Solicitação enviada ao barbeiro.'}))	
					}).
					catch(() => res.status(500).json({message: 'Falha ao enviar a solicitação, tente novamente mais tarde.'}));
			}else {
				res.status(500).json({message: 'Falha ao enviar a solicitação, tente novamente mais tarde.'});
			}
		}else if(decoded.email){			
			let user = await UsersModel.findOne({email: decoded.email});
			let allNotifications = await NotificationsModel.find({});
			if(user){				
				await NotificationsModel.create({
					idCliente: user.id,
					nome: user.nome,
					id: allNotifications.length + 1
				}).
					then(() => {
						ClientNotificationsModel.create({
						idCliente: user.id,
						nome: user.nome,
						id: allNotifications.length + 1
					}).
						then(() => res.status(200).json({message: 'Solicitação enviada ao barbeiro.'}))	
					}).
					catch((erro) => res.status(500).json({message: 'erro' + erro}));
			}else {
				res.status(500).json({message: 'Falha ao enviar a solicitação, tente novamente mais tarde.'});
			}
		}
	},

	notifications: async (req, res) => {	

		if(req.method === 'GET'){
			await NotificationsModel.find({}).
				then((data) => {
					res.status(200).json(data)
			});
		}else {
			if(req.decoded.id){
				await ClientNotificationsModel.find({idCliente: req.decoded.id}).
					then(data => {
						res.status(200).json(data)
					}).
					catch(() => res.status(500).json({message: 'Falha ao buscar as notificações, tente novamente mais tarde.'}))
			}else if(req.decoded.email){
				let user = await UsersModel.findOne({email: decoded.email});
				if(user){
					await ClientNotificationsModel.find({idCliente: user.id}).
						then(data => res.status(200).json(data)).
						catch(() => res.status(500).json({message: 'Falha ao buscar as notificações, tente novamente mais tarde.'}))
				}
			}
		};

	},

	confirmCutRequest: async (req, res) => {
		let { clientId, id } = req.body;

		if(clientId === undefined) return res.status(400).json({msg: 'O id do cliente é obrigatório.'});
		if(id === undefined) return res.status(400).json({msg: 'O id é obrigatório.'});

		let user =  await UsersModel.findOne({id: clientId});
		if(user.cortes >= 6){
			await UsersModel.findOneAndUpdate({id: clientId}, {
				cortes: 0
			}).then(() => res.status(200).json({message: 'Cortes zerados.'})).
			catch(() => res.status(500).json({message: 'Falha ao zerar a quantidade de cortes, tente novamente mais tarde.'}))
		}else {
			await UsersModel.findOneAndUpdate({id: clientId}, {
				cortes: user.cortes + 1
			}).
				then(() => {}).catch(() => {
						res.status(500).json({message: 'Falha ao confirmar solicitação de corte, tente novamente mais tarde.'})					
					})
		}
		await NotificationsModel.findOneAndUpdate({id: id}, {solicitacaoAceita: true}).
				then(() => {		
					ClientNotificationsModel.findOneAndUpdate({id: id}, {solicitacaoAceita: true}).then(() => res.status(200).json({message: 'Solicitação aceita. Corte adicionado ao cliente'}))
					
				}).
				catch(() => res.status(500).json({message: 'Falha ao confirmar solicitação de corte, tente novamente mais tarde.'}))
		},

		deleteNotification: async (req, res) => {
			let id = req.body.id;
			if(id === undefined) return res.status(400).json({msg: 'O id é obrigatório.'});

			if(req.url === '/barbeiro/excluirNotificacao'){
				await NotificationsModel.findOneAndDelete({id: id}).
					then(() => res.status(200).json({message: 'Notificação excluida com sucesso.'})).
					catch(() => res.status(500).json({message: 'Falha ao excluir a notificação. Tente novamente mais tarde.'}))				
			}else {
					await ClientNotificationsModel.findOneAndDelete({id: id}).
					then(() => res.status(200).json({message: 'Notificação excluida com sucesso.'})).
					catch(() => res.status(500).json({message: 'Falha ao excluir a notificação. Tente novamente mais tarde.'}))
			}
		}

};

module.exports = controllers ;