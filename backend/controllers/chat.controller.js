import Message from "../models/Chat.model.js";
import User from "../models/User.model.js";

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

    // Logic to update unread count or last message can be added here or handled by sockets

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
