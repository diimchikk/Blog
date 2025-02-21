require('dotenv').config();
const { error } = require('console');
const { resolveSoa } = require('dns');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promiseHooks } = require('v8');

if(!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET ){
    throw new error('Не заданы JWT_ACCESS_SECRET или JWT_REFRESH_SECRET в переменных окружения');
}


const db = new sqlite3.Database(path.resolve(__dirname, '../../../database.db'),(err) =>{
    if(err){
        console.error('Ошибка подкючения к базе данных:', err.message);
    } else {
        console.log('Успешное подключение к базе данных');
    }
});



class TokenService{
    genarateTokens(payload){
        console.log(process.env.JWT_ACCESS_SECRET);
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn:'1h'});
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn:'30d'});
        return {
            accessToken,
            refreshToken
        };
    }

    validateAccessToken(token){
        try{
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        }catch(e){
            return null;
        }
    }
    validateRefreshToken(token){
        try{
            console.log("секрет для токена:",process.env.JWT_REFRESH_SECRET);
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData;
        }catch(e){
            console.log("Ошибка при проверке токена:",e.message);
            return null;
        }
    }

    saveToken(userID,refreshToken){
        console.log('Сохранение токена. userID:', userID, 'refreshToken:', refreshToken);
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO tokens (userId,refreshToken) VALUES(?, ?)`;
            db.run(query,[userID, refreshToken], function (err){
                if(err){
                    console.error('Ошибка сохранения токена:', err.message);
                    reject(err);
                }else{
                    console.log('Токен успешно сохранен');
                    resolve({id: this.lastID });
                }
            });
        });
    }
    removeToken(refreshToken){
        return new Promise((resolve, reject) => {
            const query =`DELETE FROM tokens WHERE refreshToken =?`;
            db.run(query,[refreshToken], function(err){
                if(err){
                    console.error('Ошибка удаления токена:', err.message);
                    reject(err);
                }else{
                    console.log('Токен успешно удален');
                    resolve(true);
                }
            });
        });
    }
    findToken(refreshToken){
        return new Promise((resolve,reject) => {
            const query = `SELECT * FROM tokens WHERE refreshToken = ?`;
            db.get(query,[refreshToken], (err,row) => {
                if(err){
                    console.error('Ошибка поиска токена в базе:', err.message);
                    reject(err);
                }else{
                    resolve(row);
                }
            });
        });
    }
}

module.exports = new TokenService();


/*Пример использования:
Добавьте этот сервис в маршруты для работы с токенами
const TokenService = require('../service/token-service'); // Убедитесь, что путь корректен

// Пример сохранения токена
const userId = 1; // ID пользователя
const { refreshToken } = TokenService.generateTokens({ id: userId });

TokenService.saveToken(userId, refreshToken)
    .then(() => console.log('Токен сохранён!'))
    .catch((err) => console.error(err));

// Пример поиска токена
TokenService.findToken(refreshToken)
    .then((token) => console.log('Найден токен:', token))
    .catch((err) => console.error(err));

// Пример удаления токена
TokenService.removeToken(refreshToken)
    .then(() => console.log('Токен удалён!'))
    .catch((err) => console.error(err));

*/ 