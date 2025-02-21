require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const  path = require('path');
const  cors = require('cors');
const  cookieParser = require('cookie-parser');
const  router = require("./Authorization/server/router/index.js");
const errorMiddleware = require('./Authorization/server/middlewares/error-middleware.js');
const tokenService = require('./Authorization/server/service/token-service.js');
//const expressValidator = require('express-validator');


const app = express();
const db = new sqlite3.Database('./database.db');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('public')); 
app.use(cookieParser()); 
app.use(cors({
    credentials:true,
    origin:process.env.CLIENT_URL
})); 
app.use('/api', router);
app.use(errorMiddleware);
//app.use(bodyParser.json());

//Configure Multer For Image File Uploads
const storage = multer.diskStorage({
    destination: 'public/uploads',
    filename:(req,file, cb) =>{
        cb(null, Date.now() + path.extname(file.originalname))
    },
});
const upload = multer({storage});

//Initialize Database 
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT,
        content TEXT NOT NULL,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error("Error creating table:", err.message);
        } else {
            console.log("Table 'posts' created or already exists.");
        }
    });
});
db.serialize(() =>{
    db.run(`
        CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isActivated BOOLEAN DEFAULT 0,
        activationLink TEXT)
        `);
    db.run(`
    CREATE TABLE IF NOT EXISTS  tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    refreshToken TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
    )`
)});

/*db.run(`
    INSERT INTO users(email, password, isActivated, activationLink)
    VALUES (?, ?, ?, ?)`,
    ['example@gmail.com', 'password123', '0', 'link123'],function(err){
        if(err){
            return console.error(err.message);
        }
        console.log(`User added with ID: ${this.lastID}`);
    }
)*/

/*db.run(`
    INSERT INTO tokens (userID, refreshToken)
    VALUES(?, ?)`,
    [1, 'exemple_refresh_token'], function(err){
    if(err){
        return console.error(err.message);
    }
    console.log(`Token added with ID: ${this.lastID}`);
    });*/

/*db.close();*/




//Routes

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

//posts, category

app.get('/posts',(req, res) =>{
    if(req.query.category){
        db.all('SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC ', [req.query.category], (err, rows)=>{
            if(err){
                throw err;
            }
            console.log(rows);
            res.json(rows);
        });
    }else{
        db.all('SELECT * FROM posts  ORDER BY created_at DESC ', [], (err, rows)=>{
            if(err){
                throw err;
            }
            console.log(rows);
            res.json(rows);
        });
    }
    
});

app.get('/post/:title', (req, res) => {
    const postTitle = req.params.title.replace(/-/g, ' ').toLowerCase().trim();
    db.get(
        'SELECT * FROM posts WHERE TRIM(LOWER(title)) = ?',
        [postTitle],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Database error' });
                return;
            }
            if (!row) {
                res.status(404).json({ error: 'Post Not Found' });
                return;
            }
            res.json(row);
        }
    );
});

app.get('/post-details/:title', (req, res) =>{
    res.sendFile(path.join(__dirname, "views", "post_details.html"));
});


app.post('/add', upload.single('image'), (req,res) => {
    const {title, category,content} = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
        "INSERT INTO posts(title, category, content, image, created_at) VALUES(?,?,?,?, CURRENT_TIMESTAMP)",
        [title, category, content, image],
    (err) =>{
        if(err){
            return console.log(err.message);
        }
        res.redirect("/");
    }
    );
});
//Delete Route
app.post("/delete/:id", (req, res) =>{
    const id = req.params.id;
    db.run("DELETE FROM posts WHERE id = ?", id, (err) => {
        if(err) {
            return console.log(err.message);
        }
        res.status(200).send({message: "Post delete successfully"});
    })
})
app.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({message: "logout successful"});
});

app.get('/auth-status',(req,res) =>{
    if(req.cookies.refreshToken){
        console.log("Cookies:", req.cookies);
        res.json({authorized:true});
    }else{
        res.json({authorized:false});
    };
});

app.get('/add', (req, res) =>{
    console.log("Cookies:", req.cookies);
    const token = req.cookies.refreshToken;
    console.log("Token:",token);
    if(!token){
        return res.status(401).json({
            message: "Пользователь не авторизован.Авторизуйтесь или зарегистрируйтесь"
        })
        //return res.redirect('http://localhost:3000/login');
    }
    const userData = tokenService.validateAccessToken(token);
    if(!userData){
        return res.status(403).json({
            message: "Доступ Запрещен. Неверный или истекший токен"
        });
        //send("Доступ Запрещен. Неверный или истекший токен");
    }
    res.sendFile(path.join(__dirname, "views", "add.html"));
});

//раскоментировал ниже запрос рефреш
app.get('/refresh',(req,res) =>{
    try{
        const {refreshToken} = req.cookies;
        if(!refreshToken){
            return res.status(401).json('Не авторизован');
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        if(!userData){
            return res.status(401).json("не авторизован");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.get('/admin', (req, res) =>{
    res.sendFile(path.join(__dirname, "views", "admin.html"));
});
app.get('/login', (req, res) => {
    res.redirect('http://localhost:3000/login');
});

app.get('/registration', (req, res) => {
    res.redirect('http://localhost:3000/registration');
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, () =>{
    console.log(`Server runnig on port ${PORT}`);

});