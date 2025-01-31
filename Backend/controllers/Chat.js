const Chat = require('../Models/Chatmodel');
const Booking = require('../Models/Bookingmodel');

const sendMessage = async (req, res) => {
    const { bookingId, message, senderId, senderModel } = req.body;

    try {
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ msg: 'Message content cannot be empty.' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found.' });
        }

        if (booking.status !== 'Accepted') {
            return res.status(401).json({ msg: 'Booking is not accepted yet, so you cannot chat.' });
        }

        let chat = await Chat.findOne({ booking: bookingId });
        if (!chat) {
            chat = new Chat({ booking: bookingId, messages: [] });
        }

        const newMessage = {
            sender: senderId,
            senderModel,
            text: message.trim(),
            timestamp: new Date(),
            seenBy: [],
        };

        chat.messages.push(newMessage);
        await chat.save();

        global.io.to(bookingId).emit('newMessage', newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
};

const getMessages = async (req, res) => {
    const { bookingId } = req.params;

    try {
        if (!bookingId || bookingId.trim() === '') {
            return res.status(400).json({ msg: 'Booking ID is required.' });
        }

        const chat = await Chat.findOne({ booking: bookingId }).populate('messages.sender');
        if (!chat) {
            return res.status(404).json({ msg: 'No messages found for this booking.' });
        }

        res.status(200).json(chat.messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
};

const GetallConversations = async (req, res) => {
    const { driverId } = req.params;
    try {
        const chats = await Chat.find({ 'messages.sender': driverId });
        if (!chats.length) {
            return res.status(400).json({ message: 'No chats exist' });
        }
        return res.status(200).json(chats);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { getMessages, sendMessage, GetallConversations };