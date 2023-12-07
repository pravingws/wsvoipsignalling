const http = require("http")
const Socket = require("websocket").server
const server = http.createServer(()=>{})

server.listen(3000,()=>{

})

const webSocket = new Socket({httpServer:server})

const users = []
console.log("Running Wrkspot signalling server...");




webSocket.on('request',(req)=>{
    const connection = req.accept()



    connection.on('message',(message)=>{
        const data = JSON.parse(message.utf8Data)
        console.log(data);
        const user = findUser(data.name)

        console.log("message type..."+data.type);
        console.log("message user..."+data.target);

       
        switch(data.type){
            case "call_reject":{
             let user = findUser(data.target)
                                        if(user){
                                            user.conn.send(JSON.stringify({
                                                type:"call_reject",
                                                data:data.data
                                            }))
                                        }
            }
            break

            case "call_end":{
            let user = findUser(data.target)
                            if(user){
                                user.conn.send(JSON.stringify({
                                    type:"call_end",
                                    data:data.data
                                }))
                            }
            }
            break

            case "store_user":
                if(user !=null){
                    //our user exists
                    connection.send(JSON.stringify({
                        type:'user already exists'
                    }))
                    return

                }

                const newUser = {
                    name:data.name, conn: connection
                }
                users.push(newUser)
            break

            case "start_call":
                let userToCall = findUser(data.target)


                if(userToCall){
               console.log("message start_call userToCall..."+userToCall.name);

                    connection.send(JSON.stringify({
                        type:"call_response", data:"user is ready for call", callType:data.callType
                    }))
                } else{
                               console.log("message start_call userToCall not found !!");

                    connection.send(JSON.stringify({
                        type:"call_response", data:"user is not online"
                    }))
                }

            break
            
            case "create_offer":
                let userToReceiveOffer = findUser(data.target)
               console.log("message create_offer userToReceiveOffer..."+userToReceiveOffer);

                if (userToReceiveOffer){
                    userToReceiveOffer.conn.send(JSON.stringify({
                        type:"offer_received",
                        name:data.name,
                        data:data.data.sdp,
                        callType: data.callType
                    }))
                }
            break
                
            case "create_answer":
                let userToReceiveAnswer = findUser(data.target)
                if(userToReceiveAnswer){
                    userToReceiveAnswer.conn.send(JSON.stringify({
                        type:"answer_received",
                        name: data.name,
                        data:data.data.sdp
                    }))
                }
            break

            case "ice_candidate":
                let userToReceiveIceCandidate = findUser(data.target)
                if(userToReceiveIceCandidate){
                    userToReceiveIceCandidate.conn.send(JSON.stringify({
                        type:"ice_candidate",
                        name:data.name,
                        data:{
                            sdpMLineIndex:data.data.sdpMLineIndex,
                            sdpMid:data.data.sdpMid,
                            sdpCandidate: data.data.sdpCandidate
                        }
                    }))
                }
            break


        }

    })
    
    connection.on('close', () =>{
        users.forEach( user => {
            if(user.conn === connection){
                users.splice(users.indexOf(user),1)
            }
        })
    })





})

const findUser = username =>{
    for(let i=0; i<users.length;i++){
        if(users[i].name === username)
        return users[i]
    }
}