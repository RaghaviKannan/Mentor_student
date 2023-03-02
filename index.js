const express = require('express');
const app = express();
const mongodb = require('mongodb')
const mongoclient = mongodb.MongoClient
const dotenv = require('dotenv').config()
const URL = process.env.DB
app.use(express.json())

//to create mentor
app.post('/create-mentor', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("mentor_student")
        const mentor = await db.collection("mentors").insertOne(req.body)
        await connection.close()
        res.json({ message: "Mentor created" })
    } catch (error) {
        console.log(error)
    }
})

//to create student
app.post('/create-student', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("mentor_student")
        const mentor = await db.collection("students").insertOne(req.body)
        await connection.close()
        res.json({ message: "Student created" })
    } catch (error) {
        console.log(error)
    }
})

//to get unassigned students
app.get('/unassigned-students', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("mentor_student")
        const unassignedStudents = await db.collection("students").find({ isAssigned: false }).toArray()
        await connection.close()
        res.json(unassignedStudents)
    } catch (error) {
        console.log(error)
    }
})

//to assign the multiple students to one mentor
app.post('/assign-students/:mentorid', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("mentor_student")
        const selectedStudentIds = req.body.selectedStudentIds
        const mentor = await db.collection("mentors").findOneAndUpdate(
            { _id: new mongodb.ObjectId(req.params.mentorid) },
            { $push: { assignedStudents: { $each: selectedStudentIds } } },
            { returnOriginal: false }
        );
        const mentorName = mentor.value.name;

        for (const studentId of selectedStudentIds) {
            const updatedStudent = await db.collection("students").findOneAndUpdate(
                { _id: new mongodb.ObjectId(studentId) },
                { $set: { isAssigned: true, mentor: mentorName } },
                { returnOriginal: false }
            );
        }
        await connection.close()
        res.json({ message: "Students are assigned to mentor" })
    } catch (error) {
        console.log(error)
    }
});

//to select one student and assign or update mentor
app.post('/assign-mentor/:studentid', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL)
        const db = await connection.db("mentor_student")
        const mentorid = req.body.mentorId
        const mentor = await db.collection("mentors").findOneAndUpdate({ _id: new mongodb.ObjectId(mentorid) }, { $push: { assignedStudents: { $each: [req.params.studentid] } } })
        const mentorName = mentor.value.name
        const studentId = req.params.studentid.trim()
        console.log(studentId)
        const student = await db.collection("students").findOneAndUpdate({ _id: new mongodb.ObjectId(studentId) }, { $set: { isAssigned: true, mentor: mentorName } })
        await connection.close()
        res.json({ message: "Mentor is assigned to the Student" })
    } catch (error) {
        console.log(error)
    }
})

//to get students for particular mentor
app.get('/getstudents/:mentorid', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL)
        const db = await connection.db("mentor_student")
        const mentor = await db.collection("mentors").findOne({_id: new mongodb.ObjectId(req.params.mentorid)})
        const students = mentor.assignedStudents
        await connection.close()
        res.send(students)
    } catch (error) {
        console.log(error)
    }
})

app.listen('3000', () => {
    console.log('Server is running on port 3000')
})