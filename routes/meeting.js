// Require the necessary packages
const express = require("express");
const router = express.Router();
const db = require("../models");
const axios = require('axios');
const meeting = require("../models/meeting");
const user = require("../models/user");
const task = require("../models/task");

// Routes

// Create Meeting Post Route
  router.post('/', (req, res) => {
    let meetingPin = Math.random().toString().substr(2, 4);
    // set meeting name to variable
    let meetingName = req.body.createMeeting
    //create the meeting room
        db.meeting.create({
        room: meetingName,
        pin: meetingPin,
        })
        .then((meeting)=> {
          res.redirect(`/meeting/${meetingPin}`);
        })
    })


// Get route for the creator to enter the room
  router.get('/:pin', (req, res) => {
    let meetingPin = req.params.pin;
    if (req.cookies.nickname === undefined) {
    console.log("The if route was run");
    // find the meeting at the specific pin
    db.meeting.findOne({
      where: { pin: req.params.pin },
      // include the other databases
      include: [db.task, db.comment, db.user]
    })
    .then((meeting) => {
    // fetch the nickname
    axios.get("http://names.drycodes.com/1?format=text")
    .then((response) => {
      // set nickname to variable
      const randomName = response.data
      // create the user right here
      res.cookie("nickname", randomName, {path: `/meeting/${meetingPin}`});
      db.user.create({
          meetingId: meeting.id,
          nickname: randomName
      }).then((user) => {
        console.log("Test Log");
        console.log(user.get().nickname);
        db.task.findAll({
          where: { meetingId: meeting.id },
          include: [db.meeting, db.user],
        })
        .then((task) => {
          res.render("meeting", { task: task, user: user, meeting: meeting,});
        })
      })
    })
  })
  } else {
    console.log("The else route was run");
    db.meeting.findOne({
      where: { pin: req.params.pin },
      include: [db.task, db.comment, db.user]
    })
    .then((meeting) => {
      db.user.findOne({
        where: {
          nickname: req.cookies.nickname
        },
      })
      .then((user) => {
        db.task.findAll({
          where: { meetingId: meeting.id },
          include: [db.meeting, db.user],
        })
      .then((task) => {
        res.render("meeting", { task: task, user: user, meeting: meeting,});
        })
      })
    })
  }
})

  router.post('/join', (req, res) => {
    // find the meeting based on the inputted pin
    db.meeting.findOne({
      where: {pin: req.body.meetingPin},
      include: [db.user]
    })
    .then((meeting) => {
      // fetch their random name
      axios.get("http://names.drycodes.com/1?format=text")
      .then((response) => {
        // set their random name
        let randomName = response.data
        // create the user in the database
        db.user.findOrCreate({
          where: {
            nickname: randomName,
            meetingId: meeting.id
          },
        })
        .then(() => {
          res.redirect(`/meeting/${meeting.pin}`)
        })
        .catch(err => {
          console.log(err)
        })
      })
      .catch(err => {
        console.log(err)
      })
    })
    .catch(err => {
      console.log(err)
    })
  })


router.post('/:pin/task', (req, res) => {
  let taskContent = req.body.taskInput
  let meetingPin = req.params.pin
  let userName = req.body.nickname

  db.meeting.findOne({
    where: {pin: meetingPin},
    include: [db.task, db.user]
  })
  .then((meeting) => {
    db.task.create({
      content: taskContent,
      meetingId: meeting.id,
      nickname: userName
    })
  })
  res.redirect(`/meeting/${meetingPin}`)
})
// Export the router module
module.exports = router;
