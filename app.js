const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const { title } = require("process");

const app = express();
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();

let player = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req,res) =>{
    res.render("index", {title: "Chess"});
});

io.on("connection", function(uniqueSocket) { //unique socket is the unique info of the connected
    console.log("Connected");

    if (!player.white) {
        player.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    }

    else if(!player.black) {
        player.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
    }
    else{
        uniqueSocket.emit("spectator");
    }

    uniqueSocket.on("disconnect", function()
    {
        if (uniqueSocket.id === player.white) 
            {
                delete player.white;
            }
        else if(uniqueSocket.id === player.black)
            {
                delete player.black;
            }
    });

    uniqueSocket.on("move", (move)=> {
        try {
            if(chess.turn() === "w" && uniqueSocket.id !== player.white) return;
            if(chess.turn() === "b" && uniqueSocket.id !== player.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen())
                
            }
            else{
                console.log("Invalid move: ", move);
                uniqueSocket.emit("Invalid Move", move);
            }
        } 
        catch (error) {
            console.log(error);
            uniqueSocket.emit("Invalid Move: ", move);
        }
    })

});





server.listen(3000, function (){
    console.log("Listening on port 3000")
});

