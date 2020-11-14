
exports.up = function(knex) {
  return knex.schema.createTable('seguidores', function (table) {

		 table.integer('seguidor').unsigned().notNullable();
		 table.foreign('seguidor').references('user_id').inTable('users');

		 table.integer('seguindo').unsigned().notNullable();
		 table.foreign('seguindo').references('user_id').inTable('users');
	})
};

exports.down = function(knex) {
  	return knex.schema.dropTable("seguidores");
};
