const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { stringify } = require('nodemon/lib/utils');
const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
var port = process.env.PORT;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static("public"));
app.use(cookieParser());

// a variable to save a session
var session;

const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    secret: `${process.env.SECRET}`,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

const DB = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.erkiv.mongodb.net/notesDb?retryWrites=true&w=majority`;
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connection Successful");
}).catch((err) => {
    console.log(err);
});

const userSchema = new mongoose.Schema({
    name: String,
    password: String
});

const notesSchema = new mongoose.Schema({
    user: String,
    title: String,
    desc: String
});

const User = mongoose.model("user", userSchema);
const Todo = mongoose.model("todo", notesSchema);

app.get("/", (req, res) => {
    res.render("index");
})
app.get("/spotify", (req, res) => {
    res.render("spotify");
})
app.get("/pomodoro", (req, res) => {
    res.render("pomodoro");
})
app.get("/about", (req, res) => {
    res.render("about");
})
app.get("/randompassword", (req, res) => {
    res.render("randompassword");
})
app.get("/urlshort", (req, res) => {
    res.render("urlshortner");
})
app.get('/signup', (req, res) => {
    res.render("signup")
})

app.get('/login', (req, res) => {
    res.render("login")
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/")
})

app.get('/todo', (req, res) => {
    session = req.session;
    Todo.find({ user: session.userid }).then((t) => {
        if (session.userid) {
            res.render("todo", { fulData: t })
        }
        else
            res.redirect('/login');
    })
})

app.get('/update/:sno', (req, res) => {
    const id = req.params.sno;
    Todo.find({ _id: id }).then((t) => {
        res.render("update", { fulData: t });
    })
})

app.post('/login', (req, res) => {
    var nameUser = req.body.name;
    var passwordUser = req.body.password;
    // LOGIN
    User.findOne({ name: nameUser }).then(result => {
        if (result == null)
            res.redirect("/signup");
        else {
            if (bcrypt.compare(passwordUser, result.password)) {
                // SESSION
                session = req.session;
                session.userid = result._id;
                res.redirect("/todo")
            }
            else
                res.redirect('/login');
        }
    })
})

app.post('/signup',async (req, res) => {
    var nameUser = req.body.name;
    var passwordUser = req.body.password;
    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordUser, salt);
    const newuser = new User({
        name: nameUser,
        password: hashedPassword
    });
    User.findOne({ name: nameUser }).then(result => {
        if (result == null)
            newuser.save().then(res.redirect('/login'));
        else {
            res.redirect('/signup')
            console.log('User already exists')
        }
    })

})

app.post('/addtodo', (req, res) => {
    const newTitle = req.body.title;
    const newDesc = req.body.desc;
    const newTodo = new Todo({
        user: session.userid,
        title: newTitle,
        desc: newDesc
    });
    newTodo.save().then(res.redirect('/todo'));
})

app.get('/delete/:sno', (req, res) => {
    const id = req.params.sno;
    Todo.deleteOne({ _id: id }).then(e => {
        if (e.acknowledged)
            res.redirect('/todo');
        else
            console.log(e);
    });
})

app.post('/update/:sno', (req, res) => {
    const id = req.params.sno;
    const newTitle = req.body.title;
    const newDesc = req.body.desc;
    Todo.updateOne({ _id: id }, { title: newTitle, desc: newDesc }, (e) => {
        if (e) {
            console.log(e);
        } else {
            res.redirect("/todo")
        }
    })
})

if (port == null || port == "") {
    port = 3000;
}

app.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`)
})