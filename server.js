const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_KEY = "mysecretkey";


let users = [];
let students = [];


app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    users.push({ username, password });
    res.json({ message: "User registered successfully" });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

    res.json({
        message: "Login successful",
        token: token
    });
});
// 

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = user;
        next();
    });
}


app.post('/students', authenticateToken, (req, res) => {
    const { rollno, name, section, branch } = req.body;

    if (!rollno || !name || !section || !branch) {
        return res.status(400).json({ message: "All fields required" });
    }

    const exists = students.find(s => s.rollno === rollno);
    if (exists) {
        return res.status(400).json({ message: "Student already exists" });
    }

    students.push(req.body);
    res.json({ message: "Student added", data: req.body });
});


app.get('/students', authenticateToken, (req, res) => {
    res.json(students);
});


app.get('/students/:rollno', authenticateToken, (req, res) => {
    const student = students.find(s => s.rollno == req.params.rollno);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
});


app.put('/students/:rollno', authenticateToken, (req, res) => {
    const student = students.find(s => s.rollno == req.params.rollno);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    const { name, section, branch } = req.body;

    if (name) student.name = name;
    if (section) student.section = section;
    if (branch) student.branch = branch;

    res.json({ message: "Student updated", data: student });
});


app.delete('/students/:rollno', authenticateToken, (req, res) => {
    const index = students.findIndex(s => s.rollno == req.params.rollno);

    if (index === -1) {
        return res.status(404).json({ message: "Student not found" });
    }

    const deleted = students.splice(index, 1);

    res.json({
        message: "Student deleted",
        data: deleted
    });
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
