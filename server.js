const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { stringify } = require('nodemon/lib/utils');
const mongoose = require('mongoose')
var port = process.env.PORT;

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

let auth = false;
let userID = '';

const User = mongoose.model("user", userSchema);
const Todo = mongoose.model("todo", notesSchema);

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static("public"));

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
    auth = false;
    userID = '';
    res.redirect("/")
})

app.get('/todo', (req, res) => {
    Todo.find({ user: userID }).then((t) => {
        if (auth) {
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
            if (result.password === passwordUser) {
                auth = true;
                userID = result._id;
                res.redirect("/todo")
            }
            else
                res.redirect('/login');
        }
    })
})

app.post('/signup', (req, res) => {
    var nameUser = req.body.name;
    var passwordUser = req.body.password;
    const newuser = new User({
        name: nameUser,
        password: passwordUser
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
        user: userID,
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