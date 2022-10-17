const express = require("express");
const app = express();
const path = require ("path")
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io")
const io = socketio(server);
const formatMessage = require ('./utils/messages')
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
  } = require("./utils/users");
  


app.use(express.static(path.join(__dirname, "public")));

//Run when client connect
io.on('connection', socket =>{

    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        socket.emit('message', formatMessage('Bot','Welcome to my chat app'))

        socket.broadcast.to(user.room).emit('message' ,formatMessage('Bot',`${user.username} has joined in the chat`))


        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        })
    });

    //listen for chat message
    socket.on('chatMessage', (msg) =>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formatMessage(user.username, msg));
    })
    // runs on disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage('Bot',`${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
});





const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on ${PORT}`))