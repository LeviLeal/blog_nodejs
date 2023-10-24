// Carregando modulos
const express = require("express")
const handlebars = require("express-handlebars")
const bodyParser = require("body-parser")
const app = express()
const admin = require("./routes/admin")
const usuarios = require("./routes/usuario")
const path = require("path")
const mongoose = require("mongoose")
const session = require("express-session")
const flash = require("connect-flash")
const { error } = require("console")
require("./models/Postagem")
const Postagem = mongoose.model("postagens")
require("./models/Categoria")
const Categoria = mongoose.model("categorias")
const passport = require("passport")
require("./config/auth")(passport)


// # CONFIGURACOES #
// SESSAO
//  ;express-session
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session({
    secret: "123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 }
}))

// ;flash
app.use(flash())

// ;mensagem do flash / Middlewares
/* O flash e util para retornar mensagens apos requisicoes. 
    As mensagens são temporárias, então ao recarregar a página, elas somem*/
    


app.use((req, res, next) => {
    // essas variaveis sao globais
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user  = req.user || null
    next()
})

// BODYPARSER
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// HANDLEBARS
//  ;seta o handlebars como view engine do express
app.engine("handlebars", handlebars.engine({ defaultLayout: "main" }))
app.set("view engine", "handlebars")

// MONGOOSE
mongoose.Promise = global.Promise
mongoose
    .connect("mongodb://localhost/BlogApp")
    .then(() => {
        console.log("conectado ao mongo")
    })
    .catch((error) => {
        console.log("erro ao se conectar " + error)
    })
// PUBLIC

// define o caminho dos arquivos estaticos
app.use(express.static(path.join(__dirname, "public")))

// ROTAS

//  ;rota admin

app.get("/", (req, res) => {
    Postagem.find().populate("categoria").sort({data: "desc"}).lean()
    .then((postagens) => {
        res.render("index", {postagens: postagens})
    }).catch((error) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/404")
    }) 

})

app.get("/postagem/:slug", (req, res) => {
    Postagem.findOne({slug: req.params.slug}).populate("categoria").lean().then((postagem) => {
        if (postagem) {
            res.render("postagem/index", {postagem: postagem, categoria: postagem.categoria})
        } else {
            req.flash("error_msg", "Esta postagem não existe")
            res.redirect("/")
        }
    }).catch((error) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/")
    })
})

app.get("/categorias/", (req, res) => {
    Categoria.find().lean()
    .then((categorias) => {
        res.render("categorias", {categorias: categorias})
    }).catch((error) => {
        req.flash("error_msg", "Houve um erro interno ao lista as categorias")
        res.redirect("/")
    })
})

app.get("/categorias/:slug", (req, res) => {
    Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
        if(categoria) {
            Postagem.find({categoria: categoria}).lean()    
            .then((postagens) => {
                res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
            })
            .catch((error) => {
                req.flash("Houve um erro ao listar os posts")
                res.redirect("/")
            })
        } else {
            req.flash("error_msg", "Essa categoria não existe")
            res.redirect("/")
        }
    }).catch((error) => {
        req.flash("error_msg", "Houve um erro interno ao carregar a página desta categoria")
        res.redirect("/")
    })
})

app.get("/404", (req, res) => {
    res.send("Erro 404!")
})

app.use("/admin", admin)
app.use("/usuarios", usuarios)

// EXPRESS PARA RODAR E ESCUTAR A PORTA DEFINIDA

const PORT = process.env.PORT || "8081"
app.listen(PORT, () => {
    console.log("== Server rodando ==")
})
