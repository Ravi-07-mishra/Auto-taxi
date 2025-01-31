const express = require('express');
const Notification = require('../Models/Notification');
const router = express.Router();


const GetallNotifications = async(req,res)=>{
    const {userId} = req.params;
    const {page = 1,limit = 5} = req.query;
    try {
        const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      const total = await Notification.countDocuments({userId});
      res.json({notifications,total});
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
}

const MarkRead = async(req,res)=>{
    const {id}  = req.params;
    try {
        await Notification.findByIdAndUpdate(id,{isRead: true});
        res.json({success:true});
    } catch (error) {
        res.status(500).json({
            error: 'Server error'
        })
    }
}

module.exports = {GetallNotifications,MarkRead}
