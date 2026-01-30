const chatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // User joins their own room based on their ID
        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        // Handle sending message
        socket.on("sendMessage", (message) => {
            const { receiverId } = message;
            // Emit to the receiver's room
            socket.to(receiverId).emit("receiveMessage", message);
        });

        // Handle typing status
        socket.on("typing", ({ receiverId, senderId }) => {
            socket.to(receiverId).emit("userTyping", { senderId });
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};

export default chatSocket;
