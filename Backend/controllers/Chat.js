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

        // Save the new message
        const newMessage = new Chat({
            booking: bookingId,
            sender: senderId,
            senderModel,
            message: message.trim(),
        });
        await newMessage.save();

       
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

        const messages = await Chat.find({ booking: bookingId }).sort({ timestamp: 1 });

        // Return empty array if no messages found instead of a 404 error
        res.status(200).json(messages);  // Empty array if no messages, but still 200 OK
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
};

module.exports = {getMessages,sendMessage};