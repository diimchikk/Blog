const sqlite3 = require('sqlite3').verbose();
const { rejects } = require('assert');
const bcrypt = require('bcrypt');
const { resolve } = require('path');
const db = new sqlite3.Database('./database.db');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
class UserService{
    /**
     * 
     * @param {string} email 
     * @param {string} password 
     */
    async registration(email, password) {
        try{
            const userExists = await this.getUserByEmail(email);
            if(userExists){
                throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`);
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const activationLink = uuid.v4();
            const user = await this.insertUser(email, hashedPassword, activationLink);
            if (!user.id) {
                console.error('Ошибка: user.id равен undefined или null');
                throw new Error('Не удалось создать пользователя: user.id отсутствует');
            }
            
            await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
            const userDto = new UserDto(user);
            const tokens = tokenService.genarateTokens({...userDto});
            await tokenService.saveToken(userDto.id, tokens.refreshToken);

            return {...tokens, user: userDto}
        }catch(error){
            console.error('Ошибка при регистрации пользователя:', error.message);
            throw error;
    }
}
    /**
     * 
     * @param {string} email
     * @returns {Promise<object|null>}
     */
    getUserByEmail(email){
        return new Promise((resolve,reject)=>{
            const query =`SELECT * FROM users WHERE email = ?`;
            db.get(query,[email],(err,row) =>{
                if(err){
                    reject(err);
                }else{
                    resolve(row);
                }
            });
        });
    }
    /**
     * 
     * @param {string} email 
     * @param {string} password
     * @returns {Promise<number>}
     */
    insertUser(email, password, activationLink) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO users (email, password, activationLink)
                VALUES (?, ?, ?)`;
            
            db.run(query, [email, password, activationLink], function(err) {
                if (err) {
                    console.error('Ошибка вставки пользователя:', err.message);
                    reject(err);
                } else {
                    // Возвращаем ID созданного пользователя
                    resolve({ id: this.lastID, email, password, activationLink });
                }
            });
        });
    }
    async activate(activationLink) {
        try {
            const user = await new Promise((resolve, reject) => {
                const query = `SELECT id, email, isActivated FROM users WHERE activationLink = ?`;
                db.get(query, [activationLink], (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (!row) {
                        reject(ApiError.BadRequest('Пользователь с такой ссылкой активации не найден'));
                    } else {
                        resolve(row);
                    }
                });
            });
    
            await new Promise((resolve, reject) => {
                const updateQuery = `UPDATE users SET isActivated = 1 WHERE activationLink = ?`;
                db.run(updateQuery, [activationLink], function (err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        reject(ApiError.BadRequest('Не удалось активировать пользователя — изменений в базе данных нет.'));
                    } else {
                        resolve();
                    }
                });
            });
    
            // Получаем обновленного пользователя и возвращаем его
            const updatedUser = await this.getUserByEmail(user.email);
            return new UserDto(updatedUser);
        } catch (error) {
            console.error('Ошибка активации:', error.message);
            throw error;
        }
    }
    
    
    async login(email, password){
        try{
            if (!email || !password){
                throw ApiError.BadRequest('Email и пароль обязательны');
            }
            const user = await new Promise((resolve,reject) => {
                const query = `SELECT * FROM users WHERE email = ?`;
                db.get(query, [email], (err, row) =>{
                    if(err){
                        reject(err);
                    }else if (!row){
                        reject(ApiError.BadRequest('Пользователь с таким email не найден'));
                    }else{
                        resolve(row);
                    }
                });
            });

            const isPassEquals = await bcrypt.compare(password, user.password);
            if(!isPassEquals){
                throw ApiError.BadRequest('Неверный пароль');
            }
            const userDto = new UserDto(user);
            const tokens = tokenService.genarateTokens({...userDto});
            await tokenService.saveToken(userDto.id, tokens.refreshToken);

            return {...tokens, user: userDto}
        }catch (error){
            console.error('Ошибка при входе:', error.message);
            throw error;
        }

    }
    async logout(refreshToken){
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }
    async removeToken(refreshToken){
        return new Promise((resolve, reject) =>{
            const tokenData = `DELETE FROM tokens WHERE refreshToken = ?`;
            db.run(tokenData, [refreshToken], function (err){
                if(err){
                    console.error('Ошибка удаления токена:', err.message);
                    reject(err);
                }else{
                    resolve({changes: this.changes});
                }
            });
        });
        
    }
    async refresh(refreshToken){
        if(!refreshToken){
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);
        if(!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }
        const user = await new Promise((resolve,reject) => {
            const query = `SELECT * FROM users WHERE id = ?`;
            db.get(query, [userData.id], (err, row) =>{
                if(err){
                    reject(err);
                }else if (!row){
                    reject(ApiError.BadRequest('Пользователь с таким id не найден'));
                }else{
                    resolve(row);
                }
            });
        });
        const userDto = new UserDto(user);
        const tokens = tokenService.genarateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto}
    }
    /*async refresh(refreshToken){
        console.log("Токен из запроса:",refreshToken);    
        if(!refreshToken){
            console.log("Токен отсутствует")
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        console.log("Результат validateRefreshToken:", userData);
        if(!userData) {
            ("Токен Невалиден");
            throw ApiError.UnauthorizedError();
        } 
        const tokenFromDb = await tokenService.findToken(refreshToken);
        console.log("Токен из базы:",tokenFromDb);   
        if(!tokenFromDb){
            console.log("Токен отсутствует в базе");
            throw ApiError.UnauthorizedError();
        }    
        
        const user = await new Promise((resolve,reject) => {
            const query = `SELECT * FROM users WHERE id = ?`;
            db.get(query, [userData.id], (err, row) =>{
                if(err){
                    reject(err);
                }else if (!row){
                    reject(ApiError.BadRequest('Пользователь с таким id не найден'));
                }else{
                    resolve(row);
                }
            });
        });
        const userDto = new UserDto(user);
        const tokens = tokenService.genarateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto}
    }*/
    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users`;
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}
module.exports = new UserService(); 
           
