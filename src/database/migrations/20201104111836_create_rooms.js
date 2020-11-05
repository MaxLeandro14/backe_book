
exports.up = function(knex) {
  return knex.schema.createTable('rooms', function (table) {
    	table.increments('room_id').primary();
    	table.integer('user_id').unsigned().notNullable();
    	table.foreign('user_id').references('id').inTable('users');
    	table.string('nome_livro');
        table.string('url_img').nullable();
        table.string('infor_regras').nullable();
        table.string('cod_sala');
        table.boolean('ativo').defaultTo('0');
        table.date('data_inicio');
        table.date('data_fim');
        table.date('data_leituras').nullable();
        table.date('data_debate');
        table.integer('paginas');
        table.integer('total_sala');
	    table.timestamps();
	})
};

exports.down = function(knex) {
 		return knex.schema.dropTable("rooms");
};
