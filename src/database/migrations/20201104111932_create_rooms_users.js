
exports.up = function(knex) {
	 return knex.schema.createTable('rooms_users', function (table) {
	   table.integer('room_id').unsigned().notNullable();
		 table.foreign('room_id').references('room_id').inTable('rooms').onDelete('CASCADE');

		 table.integer('user_id').unsigned().notNullable();
		 table.foreign('user_id').references('user_id').inTable('users').onDelete('CASCADE');

		 table.string('pagina').nullable();
		 table.json('registros').nullable();
		 table.string('registros_teste').nullable();
	})
	 
};

exports.down = function(knex) {
  return knex.schema.dropTable("rooms_users");
};
