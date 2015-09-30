var should = require("should");

var MongoModel = require("../");

var Mongoose = require("mongoose");

var conn = Mongoose.createConnection("mongodb://127.0.0.1/Demo_MongoModel");

var User = MongoModel.Model("User", conn, {
	uname:{type:String,index:true,required:true,unique:true},
	upass:{type:String}
})

describe("Save",function(){
	var user = new User({ uname:"cavacn", upass: "upass"+Date.now() });
	it("The user's uname should be cavacn",function(done){
		user.save().then(function( me ){
			me.uname.should.be.eql("cavacn");
			done();
		},function(err){
			console.log(err.toJSON());
			done();
		});
	})
});