const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const hostname = '127.0.0.1';
const expressPort = 3000;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

let mydb;

const mongoUrl = 'mongodb+srv://phungkieu:<password>@cluster0.102xixg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

MongoClient.connect(mongoUrl)
    .then(client => {
        console.log("MongoDB connected...");
        mydb = client.db(); // Update with your database name if not using the default 'test' database

        app.listen(expressPort, hostname, () => {
            console.log(`Express server running at http://${hostname}:${expressPort}/`);
        });
    })
    .catch(err => {
        console.error(err);
    });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/list', (req, res) => {
    mydb.collection('post').find().toArray((err, result) => {
        if (err) throw err;
        res.render('list', { data: result });
    });
});

app.get('/enter', (req, res) => {
    res.render('enter', { data: null });
});

app.get('/edit/:id', (req, res) => {
    const id = new ObjectId(req.params.id);
    mydb.collection("post").findOne({ _id: id })
        .then(result => {
            res.render("enter", { data: result });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error retrieving content');
        });
});

app.post('/save', upload.single('image'), (req, res) => {
    const postData = {
        title: req.body.title,
        content: req.body.content,
        date: req.body.someDate,
        path: req.file ? '/images/' + req.file.filename : ''
    };

    if (!req.body.id) {
        mydb.collection('post').insertOne(postData)
            .then(result => {
                res.redirect('/list');
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error saving data');
            });
    } else {
        const id = new ObjectId(req.body.id);
        mydb.collection('post').updateOne({ _id: id }, { $set: postData })
            .then(result => {
                res.redirect('/list');
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Error updating data');
            });
    }
});

app.post('/delete/:id', (req, res) => {
    const id = new ObjectId(req.params.id);
    mydb.collection('post').deleteOne({ _id: id })
        .then(result => {
            console.log('Data deleted successfully');
            res.redirect('/list');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error deleting data');
        });
});
