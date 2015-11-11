var Class = require("osr-class");

var Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var ObjectId = Schema.ObjectId;

var MongoModel = Class.extends({
	$ : function( param ){
		var _this = this;
		this._schema.eachPath(function(key,item){
			if(undefined == param[key])return;
			_this[key] = param[key];
		});
	},
	save : function(cb){
		var db = new this._model();
		var _this = this;
		this._schema.eachPath(function(key,item){
			if(undefined == _this[key])return;
			db[key] = _this[key];
		});
		db.save(cb);
	},
	me:function( cb ){
		
	}
});

MongoModel.define = function( name, schema, collectionsname ){
	return function( conn ){
		conn = conn || Mongoose;
		var _schema = new Schema(schema);
		var model = conn.model( name, _schema , collectionsname || name );
		var modelClass = MongoModel.extends({
			_schema			: _schema,
			_name			: name,
			_collectionname	: collectionsname || name,
			_model 			: model
		});
		modelClass.pre = _schema.pre.bind(_schema);
		modelClass.post = _schema.post.bind(_schema);
		return modelClass;
	};
}

module.exports = MongoModel;