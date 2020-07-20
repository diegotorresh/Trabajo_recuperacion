const bodyparser = require("body-parser");
const expressValidator = require("express-validator");
var {check, validationResult} = require("express-validator/check");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Post= require("./models/Post");

module.exports= function(app){
    const regValidation = [
        check("email")
      .not()
      .isEmpty()
      .withMessage("Email es obligatorio")
      .isEmail()
      .withMessage("Email necesita una direccion de email"),
    check("firstname")
      .not()
      .isEmpty()
      .withMessage("Nombre es obligatorio")
      .isLength({ min: 2 })
      .withMessage("Minimo 2 letras")
      .matches(/^([A-z]|\s)+$/)
      .withMessage("Nombre no acepta numeros"),
    check("lastname")
      .not()
      .isEmpty()
      .withMessage("Apellidos es obligatorio")
      .isLength({ min: 2 })
      .withMessage("Necesita mas de 2 caracteres"),
    check("username")
      .not()
      .isEmpty()
      .withMessage("Username es obligatorio")
      .isLength({ min: 2 })
      .withMessage("Username necesita mas de 2 caracteres"),
    check("password")
      .not()
      .isEmpty()
      .withMessage("Password es obligatorio")
      .isLength({ min: 6 })
      .withMessage("Password necesita como minimo 6 caracteres"),
    check(
      "password_con",
      "Se necesita confirmacion de password o que coincidan estas"
    ).custom(function(value, { req }) {
      if (value !== req.body.password) {
        throw new Error("No concuerdan las contraseñas");
      }
      return value;
    }),
    check("email").custom(value => {
      return User.findOne({ email: value }).then(function(user) {
        if (user) {
          throw new Error("Este email ya esta en uso");
        }
      });
    })
    ];

    function registro(req, res) {
      var errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.send({ errors: errors.mapped() });
      }
      var user = new User(req.body);
      user.password = user.hashPassword(user.password);
      user
        .save()
        .then(user => {
          return res.json(user);
        })
        .catch(err => res.send(err));
    }
  
    app.post("/api/register", regValidation, registro);
    app.get("/", (req, res) => res.json("sdasdsa"));
    //---------------------------------------------
    const logValidation = [
      check("email")
        .not()
        .isEmpty()
        .withMessage("Email is required"),
      check("password")
        .not()
        .isEmpty()
        .withMessage("Password is required")
    ];
    function loginUser(req, res) {
      var errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.send({ errors: errors.mapped() });
      }
      User.findOne({
        email: req.body.email
      })
        .then(function(user) {
          if (!user) {
            return res.send({ error: true, message: "User does not exist!" });
          }
          if (!user.comparePassword(req.body.password, user.password)) {
            return res.send({ error: true, message: "Wrong password!" });
          }
          req.session.user = user;
          req.session.isLoggedIn = true;
          return res.send({ message: "You are signed in" });
          res.send(user);
        })
        .catch(function(error) {
          console.log(error);
        });
    }
    app.post("/api/login", logValidation, loginUser);
    //----------------------------------------------------
    function isLoggedIn(req, res, next) {
      if (req.session.isLoggedIn) {
        res.send(true);
      } else {
        res.send(false);
      }
    }
    app.get("/api/isloggedin", isLoggedIn);
  
    //--------------------------------------
  
    const postValidation = [
      check("post")
        .not()
        .isEmpty()
        .withMessage("Please write something.")
    ];
  
    function addPost(req, res) {
      var errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.send({ errors: errors.mapped() });
      }
      var post = new Post(req.body);
      if (req.session.user) {
        post.user = req.session.user._id;
        post
          .save()
          .then(post => {
            res.json(post);
          })
          .catch(error => {
            res.json(error);
          });
      } else {
        return res.send({ error: "You are not logged in!" });
      }
    }
    app.post("/api/addpost", postValidation, addPost);
    //----------------------------------------------
    app.post("/api/postupvote/:id", (req, res) => {
      Post.findById(req.params.id).then(function(post) {
        post.vote = post.vote + 1;
        post.save().then(function(post) {
          res.send(post);
        });
      });
    });
  
    //------------------------------------------------------
    function showPosts(req, res) {
      Post.find()
        .populate("user", ["username", "email"])
        .sort({ vote: "desc" })
        .then(post => {
          res.json(post);
        })
        .catch(error => {
          res.json(error);
        });
    }
    app.get("/api/showposts", showPosts);
  
    app.get("/api/logout", (req, res) => {
      req.session.destroy();
      res.send({ message: "Logged out!" });
    });
  };
  