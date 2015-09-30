"use strict";
var Class = require("osr-class");

var Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var ObjectId = Schema.ObjectId;

var promise = require("promise");

var debug = require("debug")("osr-mongoose");

var MongoModel = Class.extends({
    /**
     * 构造函数
     * @param  {inobject}
     * @return {this}
     */
    $: function(params) {
        if (!params) {
            params = {};
        }
        for (var key in this.__schema) {
            if (undefined == params[key]) continue;
            this[key] = params[key];
        }
        if (params["_id"]) {
            this["_id"] = params["_id"];
        }
        Object.defineProperty(this, "condition", {
            get: function() {
                var condition = {};
                if (this["_id"]) {
                    condition["_id"] = this["_id"];
                } else {
                    for (var key in this.__schema) {
                        if (undefined == this[key] || !this.__schema[key].required) {
                            continue;
                        }
                        condition[key] = this[key];
                    }
                }
                condition["__isdelete"] = false;
                return condition;
            }
        })
    },
    /**
     * 保存
     * @return {promise}
     */
    save: function() {
        var db = new this.__db();
        for (var key in this.__schema) {
            if (undefined == this[key]) {
                continue;
            }
            db[key] = this[key];
        }
        if (undefined != this["__isdelete"]) {
            db[key] == this["__isdelete"] || false;
        }
        db["__edit"] = [Date.now() + "@create"];
        var _this = this;
        return promise.denodeify(db.save).bind(db)().then(function(me) {
            for (var key in _this.__schema) {
                _this[key] = me[key];
            }
            return _this;
        });
    },
    /**更新
     * @param  {[updates]}
     * @param  {[options]}
     * @return {[promise]}
     */
    update: function(updates, options) {
        // var condition = {};
        options = options || {};
        var condition = this.condition;
        // if (this["_id"]) {
        //     condition["_id"] = this["_id"];
        // } else {
        //     for (var key in this.__schema) {
        //         if (undefined == this[key] || !this.__schema[key].required) {
        //             continue;
        //         }
        //         condition[key] = this[key];
        //     }
        // }
        // condition["__isdelete"] = false;
        var _this = this;
        var key = "update";
        if (options.upsert) {
            key = "upsert";
        }
        if(!updates.$push){
            updates.$push = {};
        }
        updates.$push["__edit"] = Date.now() + "@"+key+"@" + JSON.stringify(updates) + "@" + JSON.stringify(options);
        // this.db.update( condition, updates, options ) ;
        return promise.denodeify(this.__db.update).bind(this.__db)(condition, updates, options).then(function(count) {
            if (!count) {
                throw new Error(_this.__name + " : Queryed 0 result");
            }
            return count;
        }).then(function(count) {
            return _this.me();
        });
        // var _this = this;
        // var fn = function(condition, updates, options, cb){
        //  _this.__db.findOneAndUpdate( condition, updates, options, cb );
        // }
        // fn(condition, updates, options, function( err, msg){
        //  console.log(err, msg );
        // });
        // return promise.denodeify(function(cb){})();
        // return promise.denodeify(fn)( condition, updates, options ).then(function(me){
        //  console.log(me);
        // })
        // return promise.denodeify(this.__db.findOneAndUpdate).bind(this.__db)(condition, updates, options).then(function(me) {
        //     if (!me) {
        //         throw new Error(_this.__name + " : Queryed 0 result");
        //     }
        //     for (var key in _this.__schema) {
        //         _this[key] = me[key];
        //     }
        //     return _this;
        // });
    },
    /**
     * 更新或者插入
     * @return {[type]}
     */
    upsert: function() { //更新或者插入
        var updates = {};
        for (var key in this.__schema) {
            if(this.__schema[key].hidden)continue;
            if (this[key] instanceof Array) {
                // updates[key] = { $push: this[key] };
                if(this.__schema[key][0].hidden)continue;
                if (!updates["$pushAll"]) {
                    updates["$pushAll"] = {};
                }
                updates["$pushAll"][key] = this[key];
            } else if ("number" == typeof(this[key])) {
                if (!updates["$inc"]) {
                    updates["$inc"] = {};
                }
                updates["$inc"][key] = this[key];
                // updates[key] = { $inc: this[key] };
            } else if (undefined == typeof(this[key]) || undefined == this[key]) {
                continue;
            } else {
                if (!updates["$set"]) {
                    updates["$set"] = {};
                }
                updates["$set"][key] = this[key];
            }
        }
        return this.update(updates, {
            upsert: true
        });
    },
    /**
     * 删除
     * @param  {Boolean}
     * @return {promise}
     */
    del: function(isPhysica) {
        if(undefined == isPhysica){
            isPhysica = true;
        }
        // var condition = {};
        // if (this["_id"]) {
        //     condition["_id"] = this["_id"];
        // } else {
        //     for (var key in this.__schema) {
        //         if (undefined == this[key]) {
        //             continue;
        //         }
        //         condition[key] = this[key];
        //     }
        // }
        // if (isPhysica) {
        //     return promise.denodeify(this.__db.remove).bind(this.__db)(this.condition);
        // } else {
        //     return promise.denodeify(this.__db.update).bind(this.__db)(this.condition, {
        //         $set: {
        //             __isdelete: true,
        //             __deletetime: Date.now()
        //         }
        //     });
        // }
        // this.__db.remove(this.condition,function( err, result){
        //  if(result.result){
        //      console.log(result.result);
        //  }
        // });
        // return this.update({
        //     $set: {
        //         __isdelete: true,
        //         __deletetime: Date.now()
        //     }
        // });
        var _this = this;
        var condition = this.condition;
        if (isPhysica) {
            delete condition.__isdelete;
            return promise.denodeify(this.__db.remove).bind(this.__db)(condition).then(function(result) {
                // console.log(result);
                // if (result.result.n == 0) {
                //     throw new Error(_this.__name + " : Queryed 0 result");
                // }
                return result.result.ok;
            });
        } else {
            return this.update({
                $set: {
                    __isdelete: true,
                    __deletetime: Date.now()
                }
            }).then(function( me ){
                return 0;
            },function(err){
                return 1;
            });
        }
    },
    /**
     * @param  {fields}
     * @param  {options}
     * @return {promise}
     */
    me: function(fields, options) {
        // var condition = {};
        // if (this["_id"]) {
        //     condition["_id"] = this["_id"];
        // } else {
        //     for (var key in this.__schema) {
        //         if (undefined == this[key] || !this.__schema[key].required) {
        //             continue;
        //         }
        //         condition[key] = this[key];
        //     }
        // }
        var _this = this;
        return promise.denodeify(this.__db.findOne).bind(this.__db)(this.condition, (fields || this.__fields), options).then(function(one) {
            if (one instanceof Array) {
                one = one[0];
            }
            if (!one) {
                throw new Error(_this.__name + " : Queryed 0 result");
            }
            for (var key in _this.__schema) {
                if (undefined == typeof(one[key]) || undefined == one[key]) {
                    continue;
                }
                _this[key] = one[key];
            }
            return _this;
        });
    }
});
//定义模型
MongoModel.Model = function(name, conn, schema) {
    //设置逻辑删除
    schema.__isdelete = {
        type: Boolean,
        index: true,
        default: false,
        hidden: true,
    };
    //删除时间
    schema.__deletetime = {
        type: Number,
        hidden: true,
    };
    //创建时间
    schema.__edit = [{
        type: String,
        hidden: true,
    }];
    var fields = {};
    for (var key in schema) {
        if (schema[key] instanceof Array) {
            var item = schema[key][0] || {
                hidden: false
            };
            if (!item.hidden) {
                fields[key] = true;
            }
            continue;
        }
        if (!!schema[key].hidden) {
            // fields[key] = false;
        } else {
            fields[key] = true;
        }
    }
    var ModelClass = MongoModel.extends({});
    //数据库对象
    ModelClass.prototype.__db = conn.model(name, new Schema(schema), name);
    //数据结构
    ModelClass.prototype.__schema = schema;
    //模型名称
    ModelClass.prototype.__name = name;
    ModelClass.prototype.__class = ModelClass;
    ModelClass.prototype.__fields = fields;
    //查找一个
    ModelClass.findOne = function(condition, fields, options) {
        if (condition) {
            condition["__isdelete"] = false;
        }
        return new ModelClass(condition).me(fields, options);
        // return promise.denodeify(ModelClass.prototype.__db.findOne).bind(ModelClass.prototype.__db)( conditon, fields, options ).then(function( one ){
        // if(!one){
        // throw new Error(ModelClass.prototype.__name + " : Queryed 0 result");
        // }
        // return new ModelClass( one );
        // });
    };
    //查找
    ModelClass.find = function(condition, fields, options) {
        if (condition) {
            condition["__isdelete"] = false;
        }
        return promise.denodeify(ModelClass.prototype.__db.find).bind(ModelClass.prototype.__db)(condition, fields || ModelClass.prototype.__fields, options).then(function(some) {
            if (some.length == 0) {
                throw new Error(ModelClass.prototype.__name + " : Queryed 0 result");
            }
            var result = [];
            some.forEach(function(item, index) {
                result.push(new ModelClass(item));
            });
            return result;
        });
    };
    //更新
    ModelClass.update = function(condition, updates, options) {
        if (condition) {
            condition["__isdelete"] = false;
        }
        // return promise.denodeify(ModelClass.prototype.__db.update).bind(ModelClass.prototype.__db)( condition, updates, options );
        return new ModelClass(condition).update(updates, options);
    };
    //查找到一个同时并更新
    // ModelClass.findOneAndUpdate = function(condition, updates, options) {
    //     if (condition) {
    //         condition["__isdelete"] = false;
    //     }
    //     // return new ModelClass( condition ).me().then(function( me ){
    //     // return me.update( updates, options );
    //     // });
    //     return promise.denodeify(ModelClass.prototype.__db.findOneAndUpdate).bind(ModelClass.prototype.__db)(condition, updates, options).then(function(one) {
    //         if (!one) {
    //             throw new Error(ModelClass.prototype.__name + " : Queryed 0 result");
    //         }
    //         return new ModelClass(one);
    //     });
    // }
    return ModelClass;
}

module.exports = exports = MongoModel;
