const path = require('path')
const express = require('express')
const morgan = require('morgan')
const fs = require('fs')
const multer  = require('multer');
const upload = multer();
const atob = require('atob')

const app = express()
module.exports = app

// logging middleware
app.use(morgan('dev'))

// body parsing middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const cwd = path.resolve()  //why is __dirname not defined???
const pubDir = path.join(cwd, 'public')
const htmlFile = path.join(pubDir,'index.html')

console.log(cwd, pubDir, htmlFile)

// static file-serving middleware
app.use(express.static(pubDir))

app.get('/', (req, res)=> res.sendFile(htmlFile) );

app.get('/audio/:id',(req,res,next)=>{
  console.log(req.params.id)
  
  fs.readFile(req.params.id,{encoding:'base64'}, (err,data)=>{
    if (err) {
      res.status(500).send('problem')
    } 
    else {
      console.log('read file in')
      res.status(200).send(data)
    }
  })

})

app.post('/audio/:id',  upload.single('audiofile'), (req,res,next)=>{

  console.log(req.file)

  const binary = atob(req.file.buffer)

  const fileName = req.params.id + '.ogg'
  fs.open(fileName,'w+', (err,fd)=>{
    fs.writeFile(fd,req.file.buffer,(err)=>{
      fs.close(fd, (err)=>{
        res.status(201).send('audioText.mp3')
      })
    })
  })

  //res.status(200).send('duh')

})

// any remaining requests with an extension (.js, .css, etc.) send 404
app.use((req, res, next) => {
  if (path.extname(req.path).length) {
    const err = new Error('Not found')
    err.status = 404
    next(err)
  } else {
    next()
  }
})

// sends index.html
app.use('*', (req, res) => {
  res.sendFile(htmlFile);
})

// error handling endware
app.use((err, req, res, next) => {
  console.error(err)
  console.error(err.stack)
  res.status(err.status || 500).send(err.message || 'Internal server error.')
})
