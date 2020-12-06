
exports.up = function(knex) {
  return knex.schema.createTable('rooms', function (table) {
    	table.increments('room_id').primary();
    	table.integer('user_id').unsigned().notNullable();
    	table.foreign('user_id').references('id').inTable('users');
    	table.string('nome_livro');
        table.string('nome_foto_original');
        table.string('url_img').nullable();
        table.string('infor_regras').nullable();
        table.string('links').nullable();
        table.string('cod_sala').unique();
        table.integer('ativo').defaultTo('0');
        table.string('tipo').defaultTo('1');
        table.date('data_inicio');
        table.date('data_fim');
        table.string('data_leituras').nullable();
        table.string('data_debate').nullable();
        table.integer('paginas');
        table.integer('total_sala');
	    table.timestamps();
	})
};

exports.down = function(knex) {
 		return knex.schema.dropTable("rooms");
};
