import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        text: {
            type: String,
            required: true,
        },
        isImage: {
            type: Boolean,
            default: false,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
