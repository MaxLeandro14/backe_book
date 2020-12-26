
exports.up = function(knex) {
	return knex.schema.createTable('questionario', function (table) {
		table.integer('room_id').unsigned().notNullable();
		table.foreign('room_id').references('room_id').inTable('rooms').onDelete('CASCADE');
  	table.string('quest').nullable();
	})
};

exports.down = function(knex) {
  return knex.schema.dropTable("questionario");
};
