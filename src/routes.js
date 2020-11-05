const express = require('express');
const crypto = require('crypto');
const conn = require('./database/conn')

const routes = express.Router();

routes.post('/new_user', async (req, res) => {
	const {name, email, password, sexo  } = req.body;
	const cod_user = crypto.randomBytes(3).toString('HEX');
	const timestamp = Date.now();
	//VERIFICAR SE O ID NÃO EXISTE

	const id = await conn('users').insert({
		name,
		cod_user,
		sexo,
		password,
	  email  
	})


  return res.json(id);
})

routes.get('/users', async (req, res) => {

	const users = await conn('users').select('*');

  return res.json(users);
})

routes.post('/new_room', async (req, res) => {
	const {user_id, nome_livro, data_inicio, data_fim, data_debate, paginas, total_sala  } = req.body;
	const cod_sala = crypto.randomBytes(3).toString('HEX');

	//VERIFICAR SE O ID NÃO EXISTE

	const id = await conn('rooms').insert({
		 user_id,
     nome_livro,
     cod_sala,
     data_inicio,
     data_fim,
     data_debate,
     paginas,
     total_sala
	})


  return res.json(id);
})

//Index - Obter as 10 salas
routes.get('/rooms', async (req, res) => {

	const rooms = await conn('rooms').join('users', 'rooms.user_id', '=', 'users.user_id').select('users.name', 'rooms.url_img', 'rooms.cod_sala','rooms.room_id', 'users.user_id').limit(10);

  return res.json(rooms);
})

routes.post('/new_room_user', async (req, res) => {
	const {user_id, room_id } = req.body;

	const id = await conn('rooms_users').insert({
		user_id, 
		room_id
	})


  return res.json(id);
})

//Index - entrar na sala por codigo
routes.get('/enter_room_cod/:cod_sala', async (req, res) => {
	const params = req.params;

	const room = await conn.select('url_img','room_id', 'nome_livro', 'data_inicio', 'data_fim').from('rooms').where('cod_sala', params.cod_sala);

  return res.json(room);
})

module.exports = routes;
