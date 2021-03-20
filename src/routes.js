const express = require('express');
const multer = require('multer')
const multerConfig = require('./config/multer')
const multerAvatarConfig= require('./config/multer_avatar')
const upload = multer(multerConfig).single('file')
const uploadAvatar = multer(multerAvatarConfig).single('file')
const crypto = require('crypto');
const jwt = require('./config/jwt');
const conn = require('./database/conn');
const app_url = 'http://localhost:3333';
const path = require('path');
const fs = require('fs');

const routes = express.Router();

// verifica acesso
const authMiddleware = async (req, res, next) => {
  const [, token] = req.headers.authorization.split(' ')
  console.log(req.headers.authorization)
  try {
    const payload = await jwt.verify(token)
    // payload tem o id do usuario logado
    // abaixo salvo os dados do usuario
    req.auth = payload.user

    next()
  } catch (error) {
    return res.json({status_req: '2'});
  }
}

//Index - Obter as 10 salas
routes.get('/v1/rooms', async (req, res) => {
	var rooms = '';
	try {
    rooms = await conn('rooms').join('users', 'rooms.user_id', '=', 'users.user_id').where('rooms.ativo', '1').andWhere('rooms.tipo', '=', '1').select('users.name', 'rooms.url_img', 'rooms.cod_sala','rooms.room_id', 'users.user_id').limit(7);

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
	  .select('users.name', 'rooms.url_img', 'rooms.ativo', 'rooms.room_id','rooms.nome_livro', 'users.user_id','data_inicio', 'data_fim')
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
	var status_req = {status_room: '', status_users: ''}
	var room = '';
	var users = '';

	try {
		room = await conn('users')
	  .join('rooms', 'rooms.user_id', '=', 'users.user_id')
	  .select('users.name', 'users.user_id', 'rooms.room_id', 'rooms.nome_livro', 'rooms.url_img', 'rooms.infor_regras', 'rooms.data_inicio', 'rooms.data_fim', 'rooms.data_leituras', 'rooms.data_debate')
	  .where({room_id: params.id_sala})

	  status_req.status_room = '1'
	} catch (er) {
		status_req.status_room = '2'
		return res.json({status_req});
  }

  try {
  	// pode vir vazio - nenhum inscrito
		users = await conn('users').join('rooms_users', 'rooms_users.user_id', 'users.user_id' )
		.select('users.url_avatar', 'users.user_id')
		.where('rooms_users.room_id','=', params.id_sala ).limit(5);

		status_req.status_users = '1'

	} catch (er) {
    status_req.status_users  = '2';
  }

  if (users == '' && status_req.status_users !== '2') status_req.status_users  = '0';

  return res.json({status_req, dados: {room, users}});
})

routes.post('/v1/new_room', async (req, res) => {
	const {user_id, nome_livro, data_inicio, data_fim, data_debate, paginas, total_sala} = req.body;

	var cod_sala = '';
  while (true) {
  	cod_sala = crypto.randomBytes(4).toString('HEX');
  	var [count] = await conn('rooms').where('rooms.cod_sala', '=', cod_sala).count()

  	if (count['count(*)'] === 0) break
  }
	var id = '';
	var status_req = '1'
	try {
		const tipo = '1'
		const infor_regras = ''
		const links = ''
		const sinopse = ''
		id = await conn('rooms').insert({
		 user_id,
     nome_livro,
     paginas,
     total_sala,
     data_inicio,
     data_fim,
     data_debate,
     cod_sala,
     tipo,
     infor_regras,
     links,
     sinopse
		})

		if (id) {
			await conn('rooms_users').insert({
				user_id,
				room_id: id,
				pagina: '0'
			})
		}

	} catch (er) {
    status_req  = '2'
  }

  return res.json({status_req, id});
})

//Index - fazer busca - todas as salas
routes.get('/v1/room_all', async (req, res) => {
	const {page = 1} = req.query;
	// const [count] = await conn('rooms').count();
	// res.header('X-Total-Count', count['count(*)']);

	const room = await conn('rooms').join('users', 'rooms.user_id', '=', 'users.user_id').where('rooms.ativo', '1').andWhere('rooms.tipo', '=', '1').select('users.name', 'rooms.paginas', 'rooms.nome_livro', 'rooms.data_inicio', 'rooms.url_img', 'rooms.cod_sala','rooms.room_id', 'users.user_id').limit(5).offset((page -1) * 5);

  return res.json(room);
})

//usuários - obter as salas que estou participando
routes.get('/v1/room_particip', async (req, res) => {
	const {user, page = 1, tipo} = req.query;
	
	const valor = (tipo === 'one') ? '1' : '2'
	var rooms = '';
	var status_req = '1';
	try {
		rooms = await conn('rooms').innerJoin('rooms_users', 'rooms_users.room_id', 'rooms.room_id').innerJoin('users', 'users.user_id', '=', 'rooms.user_id').where('rooms_users.user_id','=', user ).andWhere('rooms.ativo','=', valor).select('rooms.url_img', 'rooms.room_id', 'users.user_id', 'users.name').limit(6).offset((page -1) * 6);
	} catch (er) {
		status_req = '2';
	}

  return res.json({status_req, rooms});
})

//usuários- as salas deste usuário
//replicar para aberto e fechado
routes.get('/v1/room_me', async (req, res) => {
	const {user, page = 1, tipo} = req.query;
	
	const valor = (tipo === 'one') ? '!=' : '='
	var rooms = '';
	var status_req = '1';

	try {
		rooms = await conn('rooms').where('user_id', user).andWhere('rooms.ativo', valor, '2').select('rooms.ativo', 'rooms.url_img', 'rooms.cod_sala', 'rooms.room_id').limit(6).offset((page -1) * 6).orderBy('ativo','asc');
	} catch (er) {
		status_req = '2';
	}

	return res.json({status_req, rooms});
})

routes.get('/v1/my_perfil', async (req, res) => {
	const {user} = req.query;
	var perfil = '';
	var status_req = '1';
	try {
		perfil = await conn('users').select('*').where('user_id', user);
	} catch (er) {
		status_req = '2';
	}

	if (perfil === '') status_req = '0'

  return res.json({status_req, perfil});
})

//usuários- pesquisar por nome
routes.get('/v1/users_search/', async (req, res) => {
	const {user, page = 1} = req.query;
	var users = '';
	status_req = '1'
	try {
		users = await conn('users').where('name', 'like', `%${user}%`).select('name', 'user_id', 'cod_user', 'url_avatar').limit(6).offset((page -1) * 6);
	} catch (er) {
		status_req = '2';
	}

  return res.json({users, status_req});
})

//Perfil Outros
routes.get('/v1/perfil', async (req, res) => {
	const {user} = req.query;
	var status_req = '1';
	var perfil = '';

	try {
		perfil = await conn('users').select('*').where('user_id', user);
	} catch (er) {
		status_req = '2';
	}

	if (perfil === '') status_req = '0'

  return res.json({status_req, perfil});
})

routes.get('/v1/room_other', async (req, res) => {
	const {user, page = 1, tipo} = req.query;
	
	const valor = (tipo === 'one') ? '1' : '2'
	var rooms = '';
	var status_req = '1';

	try {
		rooms = await conn('rooms').where('user_id', user).andWhere('rooms.ativo', '=', valor).andWhere('rooms.tipo', '=', '1').select('rooms.ativo', 'rooms.url_img', 'rooms.cod_sala', 'rooms.room_id').limit(6).offset((page -1) * 6).orderBy('ativo','asc');
	} catch (er) {
		status_req = '2';
	}

	return res.json({status_req, rooms});
})

//update perfil
routes.put('/v1/update_perfil', async (req, res) => {
	const {bio, whatsapp, site, instagram, facebook, fone, email_contat} = req.body;
	const {user} = req.query;
	var status_req = '1';
	var result = '';

	try {
		result = await conn('users').where('user_id', '=', user).update({
			bio,
			whatsapp,
			site,
			instagram,
			facebook,
			fone,
			email_contat
		})
	} catch (er) {
		status_req = '2';
	}

  return res.json({status_req, result});
})

//update dados
routes.put('/v1/update_dados', async (req, res) => {
	const {name, sexo, cidade, estado  } = req.body;
	const {user} = req.query;
	var result = ''
	var status_req = '1'
	try {
		result = await conn('users').where('user_id', '=', user).update({
			name,
			sexo,
			cidade,
			estado
		})
	} catch (er) {
		status_req = '2';
	}
	if (result === '' && status_req !== '2') status_req = '0'


  return res.json({status_req});
})

routes.post('/v1/update_foto_capa', (req, res) => {

	upload(req, res, async function (err) {
				var status_req = '1'
        if (err) {
        		if (err.code == "LIMIT_FILE_SIZE") {
        			return res.status(400).send({ status_req: '3', message: 'Arquivo muito grande.' })
        		}
            return res.status(400).send({ status_req: '3', message: err.message })
        }
        // tudo bem
        	const {user, room} = req.query;
					var result = ''
					const url_img = `${app_url}/files/${req.file.filename}`
					const nome_foto_original = req.file.filename
					try {
						const tem = await conn('rooms').where('room_id', room).select('url_img', 'nome_livro', 'nome_foto_original').first();
						if (tem) {
							console.log(tem.url_img)
							if (tem.url_img) {
								const pathOrginal = `${app_url}/tmp/uploads/room/${tem.nome_foto_original}`
								fs.unlinkSync(path.resolve(__dirname, 'tmp', 'uploads' ,'room', tem.nome_foto_original))
							}
							await conn('rooms').where('room_id', '=', room).update({
								url_img,
								nome_foto_original
							})
						}

					} catch (er) {
						console.log(er)
						return res.json({status_req: '2'});
					}

				  return res.json({status_req, url_img});
        //
    })

})
// participar de salas
routes.post('/v1/new_room_user', async (req, res) => {
	const {user_id, room_id } = req.body;
	var status_req = '1'
	var id = ''
	try {
		// verificar se o usuario já não está na sala
		id = await conn('rooms_users').where('room_id', room_id).andWhere('user_id', user_id).select('*').first();
		// verificar se o usuario não é o dono da sala
		if (!id) {
			id = await conn('rooms_users').insert({
			user_id, 
			room_id,
			pagina: '0'
			})
		} else {
			status_req = '3';
		}
	} catch (er) {
		status_req = '2';
	}

	if (id === '' && status_req !== '2') status_req = '0'

  return res.json({status_req, id});
})

routes.get('/v1/room', async (req, res) => {
	const {id} = req.query;
	var status_req = '1';
	var room = ''
	try {
		room = await conn('rooms').select('*').where('room_id', id);
	} catch (er) {
		var status_req = '2';
	}
	if (room === '' && status_req !== '2') status_req = '0'

  return res.json({status_req, room});
})

routes.put('/v1/ativarRoom', async (req, res) => {
	const {user_id, room_id} = req.body;
	var status_req = '1';
	// verificar se o usuário Id é o que está logado

	const id = await conn('rooms').where('user_id', '=', user_id).andWhere('room_id', room_id).update({
		ativo: '1'
	})
	if (id === '') status_req = '0'

  return res.json({status_req, id});
})

//update avatar
routes.post('/v1/update_avatar', async (req, res) => {

	uploadAvatar(req, res, async function (err) {
				var status_req = '1'
        if (err) {
        		if (err.code == "LIMIT_FILE_SIZE") {
        			return res.status(400).send({ status_req: '3', message: 'Arquivo muito grande.' })
        		}
            return res.status(400).send({ status_req: '3', message: err.message })
        }
        // tudo bem
        const { user } = req.query;
				var result = ''
				const url_avatar = `${app_url}/avatar/${req.file.filename}`
				const nome_foto_original = req.file.filename

				try {
						const tem = await conn('users').where('user_id', user).select('url_avatar', 'email', 'nome_foto_original').first();
						if (tem) {
							if (tem.url_avatar) {
								const pathOrginal = `${app_url}/tmp/uploads/perfil/${tem.nome_foto_original}`
								fs.unlinkSync(path.resolve(__dirname, 'tmp', 'uploads' ,'perfil', tem.nome_foto_original))
							}
							await conn('users').where('user_id', '=', user).update({
								url_avatar,
								nome_foto_original
							})
						}

					} catch (er) {
						return res.json({status_req: '2'});
					}

				  return res.json({status_req, url_avatar});
        //
    })
})
//Room infor para acessar
routes.get('/v1/room_readers', async (req, res) => {
	const {user, room, page = 1} = req.query;
	var status_req = '1'
	var users = '';

  try {
  	// pode vir vazio - nenhum inscrito
		users = await conn('users').join('rooms_users', 'rooms_users.user_id', 'users.user_id' )
		.select('users.url_avatar', 'users.name', 'rooms_users.pagina')
		.where('rooms_users.room_id','=', room ).limit(6).offset((page -1) * 6);

	} catch (er) {
    return res.json({status_req: '2'});
  }
  console.log(users)
  if (users == '') status_req  = '0';
 

  return res.json({status_req, users});
})

//update dados
routes.put('/v1/update_room_config', async (req, res) => {
	const {infor_regras, room_id, links, sinopse} = req.body;
	var status_req = '1'
	try {
		const room = await conn('rooms').where('room_id', '=', room_id).update({
			infor_regras,
			links,
			sinopse
		})
		return res.json({status_req, room});
	} catch (er) {
		status_req = '2';
		return res.json({status_req});
	}

})
// adicionar datas de debates - as metas de leituras
routes.put('/v1/update_room_config_leituras', async (req, res) => {
	const {room_id, data_leituras, data_debate} = req.body;
	var status_req = '1'
	try {
		const room = await conn('rooms').where('room_id', '=', room_id).update({
			data_leituras,
			data_debate
		})
		return res.json({status_req, room});
	} catch (er) {
		status_req = '2';
		return res.json({status_req});
	}

})

routes.put('/v1/update_room_config_geral', async (req, res) => {
	const {room_id, tipo, paginas, total_sala} = req.body;
	var status_req = '1'
	try {
		const room = await conn('rooms').where('room_id', '=', room_id).update({
			tipo,
			paginas,
			total_sala
		})
		return res.json({status_req, room: {tipo, paginas, total_sala}});
	} catch (er) {
		status_req = '2';
		return res.json({status_req});
	}

})
// atualizar leitura
routes.put('/v1/update_read', async (req, res) => {
	const {user_id, room_id, pagina} = req.body;
	status_req = '1';
	try {
	const id = await conn('rooms_users').where('user_id', '=', user_id).andWhere('room_id', room_id).update({
		pagina
	})

	return res.json({status_req, id});

	} catch (er) {
		status_req = '2';
		return res.json({status_req});
	}
})

routes.put('/v1/add_debate', async (req, res) => {
	const {user_id, room_id, data_debate, data_leituras} = req.body;
	status_req = '1';
	try {
	const id = await conn('rooms').where('user_id', '=', user_id).andWhere('room_id', room_id).update({
		data_debate,
		data_leituras
	})

	return res.json({status_req, id});

	} catch (er) {
		console.log(er)
		status_req = '2';
		return res.json({status_req});
	}
})

routes.get('/v1/update_read', async (req, res) => {
	const {user, room} = req.query;

	const id = await conn('rooms_users').where('user_id', '=', user).andWhere('room_id', room).select('*')

  return res.json(id);
})

//Room infor minha leitura
routes.get('/v1/room_my_reader', async (req, res) => {
	const {user, room} = req.query;
	var status_req = '1'
	console.log(user, room)
  try {
		const pagina = await conn('rooms_users').where('user_id','=', user ).andWhere('room_id', room).select('pagina').first();
		console.log(pagina)
		if (!pagina) return res.json({status_req: '0'});

		return res.json({status_req, pagina});
	} catch (er) {
    return res.json({status_req: '2'});
  }

  return res.json({status_req, pagina});
})

// dados
routes.get('/v1/room_dados', async (req, res) => {
	const {room} = req.query;
	var status_req = '1'
	console.log(room)
  try {
		const dados =  await conn('users').join('rooms_users', 'rooms_users.user_id', 'users.user_id' ).where('rooms_users.room_id','=', room ).select('users.sexo', 'users.estado');

		if (!dados) return res.json({status_req: '0'});
		var perfil = {}
		var estado = {}
		var tot = 0
		dados.map((item) => {
			tot++
			if (estado[item.estado]) {
				estado[item.estado] = estado[item.estado] + 1
			} else {
				estado[item.estado] = 1
			}
			if (perfil[item.sexo]) {
				perfil[item.sexo] = perfil[item.sexo] + 1
			} else {
				perfil[item.sexo] = 1
			}
		})
		return res.json({status_req, dados: {tot, perfil, estado} });
	} catch (er) {
		console.log(er)
    return res.json({status_req: '2'});
  }

  return res.json({status_req, dados});
})

//Room cria questionario
routes.post('/v1/room_quest', async (req, res) => {
	const { room, quest } = req.body;
	var status_req = '1'
  try {
		const id = await conn('questionario').insert({
			room_id: room,
			quest
		})

		return res.json({status_req, id});
	} catch (er) {
    return res.json({status_req: '2'});
  }
})

//Room cria questionario
routes.get('/v1/room_quest', async (req, res) => {
	const { room } = req.query;
	var status_req = '1'
  try {
		const quest = await await conn('questionario').where('room_id', room).select('quest').first();

		return res.json({status_req, quest});
	} catch (er) {
		console.log(er)
    return res.json({status_req: '2'});
  }
})

//Room up questionario
routes.put('/v1/room_quest', async (req, res) => {
	const { room, quest } = req.body;
	var status_req = '1'
	console.log(room, quest)
  try {
		const id = await conn('questionario').where('room_id', '=', room).update({
			quest
		})

		return res.json({status_req, id});
	} catch (er) {
		console.log(er)
    return res.json({status_req: '2'});
  }
})

routes.put('/v1/fecharRoom', async (req, res) => {
	const {user_id, room_id} = req.body;
	var status_req = '1';
	try {
			const id = await conn('rooms').where('user_id', '=', user_id).andWhere('room_id', room_id).update({
				ativo: '2'
			})

		if (id === '') status_req = '0'

		return res.json({status_req, id});
	} catch (er) {
		console.log(er)
    return res.json({status_req: '2'});
  }
})








// deletar a sala
routes.delete('/v1/room_delete', async (req, res) => {
	const {user_id, room_id} = req.body;
	var status_req = '1'
	try {
		const id = await conn('rooms').where('room_id', '=', room_id).andWhere('user_id', user_id).del()

	  return res.json({status_req, id});
  } catch (er) {
		status_req = '2';
		return res.json({status_req});
	}
})
// sair da sala
routes.delete('/v1/room_sair', async (req, res) => {
	const {user_id, room_id} = req.body;
	var status_req = '1'
	console.log(user_id, room_id)
	// remover da notificação também
	try {
		const id = await conn('rooms_users').where('room_id', '=', room_id).andWhere('user_id', user_id).del()

	  return res.json({status_req, id});
  } catch (er) {
		status_req = '2';
		console.log(er)
		return res.json({status_req});
	}
})







// cadastro
routes.post('/v1/signup', async (req, res) => {
	var status_req = '1'
  try {
  	const {email, senha, name, sexo} = req.body;
  	console.log(email, senha)
  	const password = crypto.createHash('md5').update(senha).digest('hex')
  	var cod_user = '';
	  while (true) {
	  	cod_user = crypto.randomBytes(4).toString('HEX');
	  	var [count] = await conn('users').where('cod_user', '=', cod_user).count()

	  	if (count['count(*)'] === 0) break
	  }
  	const user = await conn('users').insert({
  	 name,
		 cod_user,
		 sexo,
		 password,
		 email,
		 estado: 'Não definido'
		})
  	console.log(user)
    const token = jwt.sign({ user })

    //res.send({ user, token })
    res.json({ user, token })
  } catch (er) {
    status_req = '2';
		console.log(er)
		return res.json({status_req});
  }
})







routes.get('/v1/login', async (req, res) => {
  const [, hash] = req.headers.authorization.split(' ')
  const [email, password] = Buffer.from(hash, 'base64')
    .toString()
    .split(':')
  var status_req = '1';
  const senha = crypto.createHash('md5').update(password).digest('hex')
  console.log(email, password)
  try {
  	const user = conn('users').where('email','=', email).select('password', 'user_id').then(
			function(result){

				if (senha === result[0].password){
					const token = jwt.sign({ user: result[0].user_id })
					return res.json({ user_id: result[0].user_id, token, status_req });
				} else {
					status_req = '2';
					return res.json({status_req});
				}

			}).catch(function(error) {
				status_req = '2';
				return res.json({status_req});
			});

  } catch (er) {
  	status_req = '2';
    return res.json({status_req});
  }
})

routes.get('/users', authMiddleware, async (req, res) => {

	const users = await conn('users').select('*');

  return res.json(users);
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
	  email,
	  estado: 'Não definido'
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

//update dados do usuário
routes.put('/update_acesso', async (req, res) => {
	const {id_user, password, email  } = req.body;


	const result = await conn('users').where('user_id', '=', id_user).update({
		password,
	  email
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


module.exports = routes;
