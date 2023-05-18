const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsersModel = require('../database/models/UsersModel');
const BarberModel = require('../database/models/BarberModel');
const cors = require('cors');
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

			res.json({message:'Usuário cadastrado com sucesso!'})


		}else {
			res.json({message: "Usuário já cadastrado!"})
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
				res.json({token: token});
			}else {
				res.json({message: 'E-mail ou senha inválidos.'})
			};
		}else {
			res.json({message: 'Usuário não encontrado.'})
		};
	},

	verifyToken: async (req, res) => {
	  res.json({token: true})
	},

	barberLogin: async (req, res) => {
		const secret = process.env.SECRET;
		let email = req.body.email;
		let password = req.body.senha;

		let confirmBarber = await BarberModel.findOne({email: email});
		console.log(confirmBarber)

		if(confirmBarber){
			let validation = bcrypt.compare(password, confirmBarber.senha);

			if(validation){
				let token = jwt.sign({
					email: confirmBarber.email
				}, secret, {expiresIn: 3600});
				res.status(200).json({token: token});
			}else {
				res.json({message: 'Senha incorreta.'});
			};

		}else {
			res.json({message: 'Usuário não encontrado.'});
		}

	},

	barberAddCut: async (req, res) => {			
		try {
			let user = await UsersModel.findOne({id: req.body.id});
			if(user){
				await UsersModel.findOneAndUpdate({id: req.body.id}, {cortes: user.cortes + 1});
				res.json({message: 'Corte adicionado com sucesso.'});
			}else {
				res.json({message: 'Usuário não encontrado.'})
			}
		}catch(erro){
			res.json({message: 'Ocorreu um erro a adicionar um corte.'})
		}
	},

	clientDatas:  async (req, res) => {		
		let user = await UsersModel.findOne({id: req.decoded.id});
		if(user){
			res.json({name: user.nome, cuts: user.cortes});
		}
	},

	barberDatas:  async (req, res) => {
		let barber = await BarberModel.findOne({email: req.decoded.email})
		if(barber){
			res.json({name: barber.nome});
		}
	},

	findClient: async (req, res) => {
		let user = await UsersModel.findOne({id: req.body.id});
		if(user !== null ){
			res.json({name: user.nome, cuts: user.cortes, id: user.id});
		}else {
			res.json({message: 'Usuário não encontrado'});
		}
	},

	clientAddCut: async (req, res) => {		
		let user = await UsersModel.findOne({id: req.decoded.id});
		if(user){
			await UsersModel.findOneAndUpdate({id: user.id}, {
				cortes: user.cortes + 1
			});
			res.json({message: 'Corte adicionado com sucesso.'});
		}else {
			res.json({message: 'Falha ao adicionar o corte.'})
		};
	}

};

module.exports = controllers ;