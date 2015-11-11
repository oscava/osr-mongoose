var MongoModel = require("../");
var Mongoose = require("mongoose");

var conn = Mongoose.createConnection("mongodb://127.0.0.1/MyDemo");

var Demo = MongoModel.define("Demo",{
	name:{ type:String, index: true }
})(conn);

Demo.pre("save",function(next,done){
	this.name = this.name + Date.now();
	next();
});

var demo = new Demo({name:"name"});
demo.save(function(err,result){
	console.log("result",err,result);
});