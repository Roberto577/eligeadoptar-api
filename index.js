const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require('./models/Post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const app = express();

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
//Direccion para mostrar imagen en post
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://robert:ubr0AcU26aCT59vP@cluster0.oam2yva.mongodb.net/?retryWrites=true&w=majority')

app.post('/register', async (req,res) => {
    const {userName,userEmail,password} = req.body;
    try{
        const userDoc = await User.create({
            userName,
            userEmail,
            password:bcrypt.hashSync(password,salt),
        });
        res.json(userDoc);
    } catch(e){
        console.log(e)
        res.status(400).json(e)
    }
});

app.post('/login', async (req,res) => {
    const {userEmail,password} = req.body;
    const userDoc = await User.findOne({userEmail});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if(passOk){
        //LOGED IN
        jwt.sign({userEmail,id:userDoc._id, userName:userDoc.userName}, secret, {}, (err,token) => {
            if(err) throw err;
            res.cookie('token',token).json({
                id:userDoc._id,
                userEmail,
                userName:userDoc.userName,
            });
        });
    }else{
        res.status(400).json('Credenciales incorrectas')
    }
});

//Comienza el proceso para saber si esta loggeado
app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
        if(err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
});

//Guarda la imagen cargada del formulario en la capeta uploads
//renameSync asigna el nombre que tendra en la carpeta
//Para publicar un post
app.post('/create', uploadMiddleware.single('file'), async (req,res) => {
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);

    //Para pasarle el creador del post
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if(err) throw err;
        const {name,city,age,sexo, esterilizado,pets,desc} = req.body;
        const postDoc = await Post.create({
            name,
            age,
            sexo,
            esterilizado,
            city,
            pets,
            desc,
            cover: newPath,
            createdBy: info.id,
    });
        res.json(postDoc);
    });
});

// Para obtener el post
app.get('/post', async (req,res) => {
    res.json(await Post.find().populate('createdBy',['userName']));
});

app.get('/post/:id', async (req,res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('createdBy',['userName']);
    res.json(postDoc)
});

app.put('/post', uploadMiddleware.single('file'), async (req,res) =>{
    //Asignamos nombre a file
    let newPath = null;
    if(req.file){
        const {originalname, path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path+'.'+ext;
        fs.renameSync(path, newPath);
    }

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if(err) throw err;
        const {id,name,city,age,sexo, esterilizado,pets,desc} = req.body;
        const postDoc = await Post.findById(id);
        const isCreatedBy = JSON.stringify(postDoc.createdBy) === JSON.stringify(info.id);
        if(!isCreatedBy){
            return res.status(400).json('You are not the author');
        }

        await postDoc.updateOne({
            name,
            age,
            sexo,
            esterilizado,
            city,
            pets,
            desc,
            cover: newPath ? newPath : postDoc.cover,
        });
        res.json(postDoc);
    });
})

app.listen(4000);

//robert
//ubr0AcU26aCT59vP
//mongodb+srv://robert:<password>@cluster0.oam2yva.mongodb.net/?retryWrites=true&w=majority