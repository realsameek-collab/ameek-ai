import mongoose from "mongoose";



const fileSchema = new mongoose.Schema({

      name:String,
      content:String,
},{
    _id:false
})
const artifactSchema = new mongoose.Schema({
    
        id:Number,
        type:String,
        title:String,
        file:[fileSchema]
    
},{
    _id:false
})

const messeageSchema = new mongoose.Schema({
        conversationId:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"Conversation"
        },
        role:{
            type:String,
            enum:['user','assistant']
        },
        content:String,
        images:[String]
},{

    timestamps:true
})

const Message = mongoose.model('Message',messeageSchema)

export default Message