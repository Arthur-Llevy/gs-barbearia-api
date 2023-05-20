const connection = require('./database/db');
const UsersModel = require('./database/models/UsersModel');
const BarberModel = require('./database/models/BarberModel');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const controllers  = require('./controllers/index');
const middlewares = require('./middlewares/index');

app.use(cors());
dotenv.config();
app.use(express.json());
const secret = process.env.SECRET;
connection();

// Route to register a new client
app.post('/cadastrarCliente', controllers.registerNewClient);
 
// Client Login 
app.post('/login/cliente', controllers.clientLogin);

// Verify token
app.post('/verificarToken', middlewares.verifyToken, controllers.verifyToken)

//Find client datas
app.post('/dadosCliente', middlewares.verifyToken, controllers.clientDatas);

//Add cut to client (Barber)
app.patch('/barbeiro/adicionarCorte', middlewares.verifyToken, controllers.barberAddCut);

// Barber login
app.post('/loginBarbeiro', controllers.barberLogin);

// Find clients
app.post('/barbeiro/procurarCliente', middlewares.verifyToken, controllers.findClient);

// Barber datas
app.post('/dadosBarbeiro', middlewares.verifyToken, controllers.barberDatas);

// Request cut for barber
app.post('/cliente/solicitarCorte', middlewares.verifyToken, controllers.clientRequestCut);

// Get all notifications
app.get('/barbeiro/notificacoes', middlewares.verifyToken, controllers.notifications);

// Get client notifications
app.post('/cliente/notificacoes', middlewares.verifyToken, controllers.notifications);

// Confirm cut request
app.patch('/barbeiro/confirmarSolicitacao', middlewares.verifyToken, controllers.confirmCutRequest);

// Delete notification
app.delete('/barbeiro/excluirNotificacao', middlewares.verifyToken, controllers.deleteNotification);
app.delete('/cliente/excluirNotificacao', middlewares.verifyToken, controllers.deleteNotification);

app.listen(5000, () => console.log('Server on.'));