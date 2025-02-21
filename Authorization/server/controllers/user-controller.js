const userService = require('../service/user-service');
const{validationResult} = require('express-validator');
const ApiError = require('../exceptions/api-error');
const path = require('path');
const { Domain } = require('domain');
class UserController {
    async registration(req, res, next) {
        try {
            console.log('Тело запроса:', req.body); 
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()))
            }
            const { email, password } = req.body;
    
            const userData = await userService.registration(email, password);
            res.cookie('refreshToken', userData.refreshToken, {
                httpOnly: true,
                secure:true,
                sameSite:'none',
                //domain:'localhost',
                path:'/',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                });
            return res.json({
                message:'Регистрация успешна',
                userData});
        } catch (e) {
            next(e);
        }
    }    
    async login(req, res, next){
        try{
            const{email,password} = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, {
                httpOnly: true,
                secure:true,
                sameSite:'none',
                //domain:'localhost',
                path:'/',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                });
            return res.json(userData);
        } catch(e){
            next(e);
        }
    }
    async logout(req, res, next){
        try{
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken')/*,userData.refreshToken, {
                httpOnly: true,
                secure:false,
                sameSite:"none",
                domain:'localhost',
                path:'/',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                });*/
            return res.json(token);
        } catch(e){
            next(e);
        }
    }
    async activate(req, res, next){
        try{
            //res.json(['123','456']);
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL);
        } catch(e){
            next(e);
        }
    }
    /*async refresh(req, res, next){
        try{
            const {refreshToken} = req.cookies;
            if(!refreshToken){
                return res.status(401).json({ message: 'Пользователь не авторизован refresh user-controller ' });
            }
            console.log("refreshToken из куков:",refreshToken);

            const userData = await userService.refresh(refreshToken);

            res.cookie('refreshToken', userData.refreshToken, {
                httpOnly: true,
                secure:false,
                sameSite:'none',
                //domain:'localhost',
                path:'/',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                });
            console.log('Cookies после установки:', res.cookies);
            return res.json(userData);
        } catch(e){
            console.error('ошибка в методе refresh:', e.message);
            next(e);
        }
    }*/
    async refresh(req, res, next){
            try{
                const refreshToken = req.cookies.refreshToken;
                console.log("refreshToken из куков:",refreshToken);
                const userData = await userService.refresh(refreshToken);
                res.cookie('refreshToken', userData.refreshToken, {
                    maxAge: 30 * 24 * 60 * 60 * 1000,httpOnly: true,});
                console.log('Cookies после установки:',userData.refreshToken);
                return res.json(userData);
            } catch(e){
                next(e);
            }
        }
    async getUsers(req, res, next){
        try{
            const users = await userService.getAllUsers();
             return res.json(users);
        } catch(e){
            next(e);
        }
    }
}

module.exports = new UserController();