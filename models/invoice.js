const mongoose = require("mongoose");

const schema  = mongoose.Schema;

const materialsSchema = new schema({
    name:{
        type:String,
    },
    price:{
        type:Number,
    },
    no_of_items:{
        type:Number,
    }
})

const invoiceSchema = new schema({
    email:{
        type:String,
        required:true,
    },
    labour:{
        hours_Of_Work:{
            type:Number,
        },
        price_per_hour:{
            type:Number,
        }
    },
    materialUsed:{
        type: [materialsSchema],
        default:undefined,
    },
    dueDate:{
        type:Number,
        required:true,
        default: new Date().getTime(),
    },
    notes:{
        type:String,
    },
    onlinePayment:{
        upiId:{
            type:String,
            default:"",
        },
    },
    offlinePayment:{
        accountNumber:{
            type:Number,
        },
        ifscCode:{
            type:String,
            default:"",
        },
    },
    status:{
        type:String,
        required:true,
    },
},{timestamps:true});

module.exports = mongoose.model('Invoice', invoiceSchema);