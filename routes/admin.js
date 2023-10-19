const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
require("../models/Categoria")
require("../models/Postagem")
const Postagem = mongoose.model("postagens")
const Categoria = mongoose.model("categorias")

router.get("/", (req, res) => {
    res.render("admin/index")
})

router.get("/posts", (req, res) => {
    res.send("Página de posts")
})

router.get("/categorias", (req, res) => {
    Categoria.find()
        .sort({ date: "desc" })
        .lean()
        .then((categorias) => {
            res.render("admin/categorias", { categorias: categorias })
        })
        .catch((error) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin")
        })
})

router.get("/categorias/add", (req, res) => {
    res.render("admin/addcategorias")
})

router.post("/categorias/nova", (req, res) => {
    let erros = []

    if (!req.body.name || typeof req.body.name == undefined || req.body.name == null) {
        erros.push({ text: "Nome inválido" })
    }
    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ text: "Slug inválido" })
    }
    if (req.body.name.length < 2) {
        erros.push({ text: "Nome da categoria é muito pequeno" })
    }

    if (erros.length > 0) {
        res.render("admin/addcategorias", { erros: erros })
    } else {
        const novaCategoria = {
            nome: req.body.name,
            slug: req.body.slug,
        }

        new Categoria(novaCategoria)
            .save()
            .then(() => {
                req.flash("success_msg", "Categoria criada com sucesso!")
                res.redirect("/admin/categorias")
            })
            .catch((error) => {
                req.flash("error_msg", "Houve um erro ao salvar a categoria")
            })
    }
})

router.get("/categorias/edit/:id", (req, res) => {
    Categoria.findOne({ _id: req.params.id })
        .lean()
        .then((categoria) => {
            res.render("admin/editcategorias", { categoria: categoria })
        })
        .catch((error) => {
            req.flash("error_msg", "Essa categoria não existe")
            res.redirect("/admin/categorias")
        })
})

router.post("/categorias/edit", (req, res) => {
    Categoria.findOne({ _id: req.body.id })
        .then((categoria) => {
            categoria.nome = req.body.name
            categoria.slug = req.body.slug
            categoria
                .save()
                .then(() => {
                    req.flash("success_msg", "Categoria editada com sucesso")
                    res.redirect("/admin/categorias")
                })
                .catch((error) => {
                    req.flash("error_msg", "Houve um erro interno ao salvar a edição da categoria")
                    res.redirect("/admin/categorias")
                })
        }).catch((error) => {
            req.flash("error_msg", "Houve um erro ao editar a categoria")
            res.redirect("/admin/categorias")
        })
})

router.post("/categorias/deletar", (req, res) => {
    
    Categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!")
        res.redirect("/admin/categorias")
    }).catch((error) => {
        req.flash("error_msg", "Erro ao deletar categoria")
        res.redirect("/admin/categorias")
    }) 
})

// Rotas de postagens

router.get("/postagens", (req, res) => {
    Postagem.find().populate("categoria").sort({date: "desc"}).lean()
    .then((postagens) => {
        res.render("admin/postagens", {postagens: postagens})
    })
    .catch((error) => {
        req.flash("error_msg", "Houve erro ao listar as postagens")
        res.redirect("/admin")
    })
})

router.get("/postagens/add", (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagens", {categorias: categorias})
    }).catch((error) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário.")
        res.redirect("admin")
    })
})

router.post("/postagens/nova", (req, res) => {
    let erros = []

    if (req.body.categoria == 0)
        erros.push({ texto: "Categoria inválida, registre uma categoria"})
    if (erros.length > 0)
        res.render("admin/addpostagens", {erros: erros}) 
    else {
        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            data: req.body.data
        }
        new Postagem(novaPostagem).save()
        .then(() => {
            req.flash("success_msg", "Postagem criada com sucesso")
            res.redirect("/admin/postagens")
        })
        .catch((error) => {
            req.flash("error_msg", "Houve um erro durante o salvamento da postagem")
            res.redirect("/admin/postagens")
        })
    }
})

router.get("/postagens/edit/:id", (req, res) => {
    Postagem.findOne({_id: req.params.id}).lean()
    .then((postagem) => {
        Categoria.find().lean()
        .then((categorias) => {
            res.render("admin/editpostagens", {postagem: postagem, categorias: categorias})
        })
        .catch((error) => {
            req.flash("error_msg", "Houve um erro ao listar categorias")
            res.redirect("/admin/postagens")
        })
    })
    .catch((error) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário de edição")
        res.redirect("/admin/postagens")
    })
})

router.post("/postagens/edit", (req, res) => {
    Postagem.findOne({_id: req.body.id})
    .then((postagem) => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save()
        .then(() => {
            req.flash("success_msg", "Postagem editada com sucesso!")
            res.redirect("/admin/postagens")
        })
        .catch((error) => {
            req.flash("error_msg", "Houve interno")
            res.redirect("/admin/postagens")
        })
    })
    .catch((error) => {
        req.flash("error_msg", "Houve um erro ao salvar a edição")
        res.redirect("/admin/postagens")
    })
})

router.get("/postagens/deletar/:id", (req, res) => {
    Postagem.findByIdAndRemove({_id: req.params.id})
    .then(() => {
        req.flash("success_msg", "Postagem deletada com sucesso!")
        res.redirect("/admin/postagens");
    })
    .catch((error) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/admin/postagens")
    })
})

module.exports = router
