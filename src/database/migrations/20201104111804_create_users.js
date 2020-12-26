
exports.up = function(knex) {
  return knex.schema.createTable('users', function (table) {
	  table.increments('user_id').primary();
	  table.string('name');
	  table.string('cod_user').unique();
	  table.string('sexo').nullable();
	  table.string('password');
	  table.string('email').unique();
	  table.string('email_contat').unique();
	  table.string('bio').nullable();
	  table.timestamp('email_verified_at').nullable();
	  table.boolean('ativo').defaultTo('1');
	  table.string('url_avatar').nullable();
	  table.string('nome_foto_original').nullable();
	  table.string('cidade').nullable();
	  table.string('estado').nullable();
	  table.string('whatsapp').nullable();
	  table.string('site').nullable();
	  table.string('instagram').nullable();
	  table.string('facebook').nullable();
	  table.string('fone').nullable();
	  table.boolean('oficial').defaultTo('0');
	  table.timestamps();
	})
};

exports.down = function(knex) {
  return knex.schema.dropTable("users");
};
