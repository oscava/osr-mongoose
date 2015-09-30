var MongoModel = require("../");

var Mongoose = require("mongoose");

var conn = Mongoose.createConnection("mongodb://127.0.0.1/Demo_MongoModel");

var User = MongoModel.Model("User", conn, {
    uname: {
        type: String,
        index: true,
        required: true,
        uniqued: true
    },
    upass: {
        type: String
    },
    age: {
        type: Number
    },
    photos: [{
        path: {
            type: String
        },
        name: {
            type: String
        },
        time: {
            type: Number
        }
    }]
});

// var user = new User({ uname:"cavacn", upass: 'upass'+Date.now() });

// user.save().then(function( _user ){
// 	console.log(_user);
// },function(err){
// 	console.log(err);
// })
// 
var user = new User({
    uname: "cavacn",
    upass: 'upass' + Date.now(),
    age: 1,
});

user.photos = [{
    path: "/hello.png",
    name: 'hello',
    time: Date.now()
},{
    path: "/hello.png",
    name: 'hello',
    time: Date.now()
}];

var query = [
	function(){
		user.save().then(console.log,console.log);
	},
	function(){
		user.upsert().then(console.log,console.log);
	},
	function(){
		user.del().then(console.log,console.log);
	},
	function(){
		// user.del(true).then(console.log,console.log);
	}
]

var interval = setInterval(function(){
	var item = query.shift();
	if(!item){
		clearInterval(interval);
		return;
	}
	item();
},1000);