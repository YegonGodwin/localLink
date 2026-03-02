import Message from "../models/Chat.model.js";
import User from "../models/User.model.js";
import { getIO } from "../sockets/io.instance.js";

// @desc    Get message history with a specific user
// @route   GET /api/chat/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
        $or: [
            { sender: myId, receiver: userId },
            { sender: userId, receiver: myId },
        ],
    }).sort({ createdAt: 1 });

    res.json(messages);
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req, res) => {
    const { receiverId, text, isImage } = req.body;
    const senderId = req.user._id;

    const message = new Message({
        sender: senderId,
        receiver: receiverId,
        text,
        isImage: isImage || false,
    });

    const savedMessage = await message.save();

    const io = getIO();
    if (io) {
        const receiverRoom = receiverId?.toString?.() || String(receiverId);
        const senderRoom = senderId?.toString?.() || String(senderId);
        const createdAt = savedMessage.createdAt?.toISOString?.() || new Date().toISOString();

        const livePayload = {
            _id: savedMessage._id,
            sender: senderRoom,
            receiver: receiverRoom,
            text: savedMessage.text,
            isImage: savedMessage.isImage,
            createdAt,
        };

        io.to(receiverRoom).emit("chat:message", livePayload);
        io.to(senderRoom).emit("chat:message", livePayload);

        const senderUser = await User.findById(senderId).select("name");
        io.to(receiverRoom).emit("notification:new", {
            id: `msg-${senderRoom}-${createdAt}`,
            type: "message",
            title: `New message from ${senderUser?.name || "User"}`,
            description: savedMessage.text,
            timestamp: createdAt,
            targetView: "messages",
        });
    }

    res.status(201).json(savedMessage);
};

// @desc    Get chat contacts
// @route   GET /api/chat/contacts
// @access  Private
export const getChatContacts = async (req, res) => {
    const myId = req.user._id;

    // Find all messages involving me
    const messages = await Message.find({
        $or: [{ sender: myId }, { receiver: myId }],
    }).sort({ createdAt: -1 });

    const contactsMap = new Map();

    messages.forEach((msg) => {
        const otherId = msg.sender.toString() === myId.toString() ? msg.receiver.toString() : msg.sender.toString();

        if (!contactsMap.has(otherId)) {
            contactsMap.set(otherId, {
                userId: otherId,
                lastMessage: msg.text,
                lastMessageTime: msg.createdAt,
                unread: msg.receiver.toString() === myId.toString() && !msg.read ? 1 : 0,
            });
        } else {
            if (msg.receiver.toString() === myId.toString() && !msg.read) {
                const contact = contactsMap.get(otherId);
                contact.unread += 1;
                contactsMap.set(otherId, contact);
            }
        }
    });

    const contactInfos = await User.find({
        _id: { $in: Array.from(contactsMap.keys()) },
    }).select("name avatar status");

    const results = contactInfos.map((info) => {
        const contactData = contactsMap.get(info._id.toString());
        return {
            id: info._id,
            name: info.name,
            avatar: info.avatar,
            online: info.status === "ACTIVE", // Basic mapping
            ...contactData,
        };
    });

    res.json(results);
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:userId
// @access  Private
export const markAsRead = async (req, res) => {
    const { userId } = req.params;
    const myId = req.user._id;

    await Message.updateMany({ sender: userId, receiver: myId, read: false }, { $set: { read: true } });

    res.json({ message: "Messages marked as read" });
};
