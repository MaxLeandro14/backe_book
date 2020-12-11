
exports.up = function(knex) {
  return knex.schema.createTable('seguidores', function (table) {

		 table.integer('seguidor').unsigned().notNullable();
		 table.foreign('seguidor').references('user_id').inTable('users').onDelete('CASCADE');

		 table.integer('seguindo').unsigned().notNullable();
		 table.foreign('seguindo').references('user_id').inTable('users').onDelete('CASCADE');
	})
};

exports.down = function(knex) {
  	return knex.schema.dropTable("seguidores");
};
