const express = require('express');
const crypto = require('crypto');
const conn = require('./database/conn')

const routes = express.Router();

//Index - Obter as 10 salas
routes.get('/v1/rooms', async (req, res) => {
	var rooms = '';
	try {
    rooms = await conn('rooms').join('users', 'rooms.user_id', '=', 'users.user_id').select('users.name', 'rooms.url_img', 'rooms.cod_sala','rooms.room_id', 'users.user_id').limit(7);

  } catch (er) {
    return res.json({status_req: '2'});
  }
	
  if (rooms == '') return res.json({status_req: '0'});

  return res.json({status_req: '1', dados: rooms});
})

//Index - entrar na sala por codigo
routes.get('/v1/enter_room_cod/:cod_sala', async (req, res) => {
	const params = req.params;
	var room = '';

	try {
    room = await conn('users')
	  .join('rooms', 'rooms.user_id', '=', 'users.user_id')
	  .select('users.name', 'rooms.url_img','rooms.room_id','rooms.nome_livro', 'users.user_id','data_inicio', 'data_fim')
	  .where({cod_sala: params.cod_sala})

  } catch (er) {
    return res.json({status_req: '2'});
  }

  if (room == '') return res.json({status_req: '0'});

  return res.json({status_req: '1', dados: room});
})

//Room infor para acessar
routes.get('/v1/room_info/:id_sala', async (req, res) => {
	const params = req.params;
	var status_req = {status_room: '1', status_users: '1'}
	var room = '';
	var users = '';

	try {
		room = await conn('users')
	  .join('rooms', 'rooms.user_id', '=', 'users.user_id')
	  .select('users.name', 'users.user_id', 'rooms.room_id', 'rooms.nome_livro', 'rooms.url_img', 'rooms.infor_regras', 'rooms.data_inicio', 'rooms.data_fim', 'rooms.data_leituras', 'rooms.data_debate')
	  .where({room_id: params.id_sala})
	} catch (er) {
    status_req.status_room  = '2';
  }

  try {
  	// pode vir vazio - nenhum inscrito
		users = await conn('users').join('rooms_users', 'rooms_users.user_id', 'users.user_id' )
		.select('users.url_avatar', 'users.user_id')
		.where('rooms_users.room_id','=', params.id_sala ).limit(5);

	} catch (er) {
    status_req.status_users  = '2';
  }

  if (users == '') status_req.status_users  = '0';

  return res.json({status_req, dados: {room, users}});
})

routes.post('/v1/new_room', async (req, res) => {
	const {user_id, nome_livro, data_inicio, data_fim, data_debate, paginas, total_sala} = req.body;
	//VERIFICAR SE O ID NÃO EXISTE
	console.log()
	var cod_sala = '';
  while (true) {
  	cod_sala = crypto.randomBytes(4).toString('HEX');
  	var [count] = await conn('rooms').where('rooms.cod_sala', '=', cod_sala).count()

  	if (count['count(*)'] === 0) break
  }
	var id = '';
	var status_req = '1'
	try {
		id = await conn('rooms').insert({
		 user_id,
     nome_livro,
     paginas,
     total_sala,
     data_inicio,
     data_fim,
     data_debate,
     cod_sala
		})

	} catch (er) {
    status_req  = '2';
    console.log(er)
  }

  return res.json({status_req, id});
})

//Index - fazer busca - todas as salas
routes.get('/v1/room_all', async (req, res) => {
	const {page = 1} = req.query;
	// const [count] = await conn('rooms').count();
	// res.header('X-Total-Count', count['count(*)']);

	const room = await conn('rooms').join('users', 'rooms.user_id', '=', 'users.user_id').select('users.name', 'rooms.paginas', 'rooms.nome_livro', 'rooms.data_inicio', 'rooms.url_img', 'rooms.cod_sala','rooms.room_id', 'users.user_id').limit(5).offset((page -1) * 5);

  return res.json(room);
})

//usuários - obter as salas que estou participando
routes.get('/v1/room_particip', async (req, res) => {
	const {user, page = 1, tipo} = req.query;
	
	const valor = (tipo === 'one') ? '1' : '3'
	var rooms = '';
	var status_req = '1';
	try {
		rooms = await conn('rooms').innerJoin('rooms_users', 'rooms_users.room_id', 'rooms.room_id').innerJoin('users', 'users.user_id', '=', 'rooms.user_id').where('rooms_users.user_id','=', user ).andWhere('rooms.ativo','=', valor).select('rooms.url_img', 'rooms.room_id', 'users.user_id', 'users.name').limit(6).offset((page -1) * 6);
	} catch (er) {
		status_req = '2';
	}

  return res.json({status_req, rooms});
})

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

// participar de salas
routes.post('/new_room_user', async (req, res) => {
	const {user_id, room_id } = req.body;
	// verificar se o usuario já não está na sala
	// verificar se o usuario não é o dono da sala
	const id = await conn('rooms_users').insert({
		user_id, 
		room_id
	})


  return res.json(id);
})

// atualizar leitura
routes.put('/update_read', async (req, res) => {
	const {user_id, room_id, pagina} = req.body;

	const id = await conn('rooms_users').where('user_id', '=', id_user).update({
		pagina,
	  registros: registros + registrar
	})

  return res.json(id);
})

//index- pesquisar por nome da sala
routes.get('/rooms_search/', async (req, res) => {
	const {room} = req.query;

	if(room == ''){
		return res.json();
	}

	const rooms = await conn('rooms').where('nome_livro', 'like', `%${room}%`);

  return res.json(rooms);
})

//usuários- pesquisar por nome
routes.get('/users_search/', async (req, res) => {
	const {user} = req.query;

	if(user == ''){
		return res.json();
	}

	const users = await conn('users').where('name', 'like', `%${user}%`).select('name','cod_user', 'url_avatar');

  return res.json(users);
})

//usuários- as salas deste usuário
//replicar para aberto e fechado
routes.get('/room_me/', async (req, res) => {
	const {user} = req.query;

	if(user == ''){
		return res.json();
	}

	const users = await conn('rooms').where('user_id', user).select('nome_livro','url_img', 'cod_sala', 'room_id');

  return res.json(users);
})

//update dados do usuário
routes.put('/update_acesso', async (req, res) => {
	const {id_user, password, email  } = req.body;


	const result = await conn('users').where('user_id', '=', id_user).update({
		password,
	  email
	})

  return res.json(result);
})

//update dados
routes.put('/update_dados', async (req, res) => {
	const {id_user, sexo, cidade, estado  } = req.body;


	const result = await conn('users').where('user_id', '=', id_user).update({
		name,
		sexo,
		cidade,
		estado
	})

  return res.json(result);
})

//suspender conta
routes.put('/conta_supender', async (req, res) => {
	const {id_user, senha } = req.body;
	//verificar a senha

	const result = await conn('users').where('user_id', '=', id_user).update({
		ativo: '0'
	})

  return res.json(result);
})

//update avatar
routes.put('/update_avatar', async (req, res) => {
	const {id_user, url_avatar  } = req.body;


	const result = await conn('users').where('user_id', '=', id_user).update({
		url_avatar
	})

  return res.json(result);
})

//update perfil
routes.put('/update_perfil', async (req, res) => {
	const {id_user, bio, whatsapp, site, telegram, instagram, facebook, fone} = req.body;


	const result = await conn('users').where('user_id', '=', id_user).update({
		bio,
		whatsapp,
		site,
		telegram,
		instagram,
		facebook,
		fone
	})

  return res.json(result);
})

//Perfil Outros
routes.get('/perfil', async (req, res) => {
	const {id} = req.query;

	//deve vir com as salas
	const result = await conn('rooms').join('users', 'users.user_id','=', id ).where('users.user_id','=', id );


  return res.json(result);
})

module.exports = routes;
