
const sendNotificationSchema = {
    type : "object" ,
    properties : {
        email : {type: "string" , format : 'email'},
        password : {type: "string" ,  minLength : 2 },
    },
    required : ['email' , 'password'],
    additionalProperties: false

    
}



export { sendNotificationSchema };
