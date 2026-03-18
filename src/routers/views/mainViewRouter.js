import {Router} from 'express';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {createAuthHandler} from '../../middlewares.js';

//****************************************************************************//
//                                                                            //
// Main view router                                                           //
//                                                                            //
//****************************************************************************//


export function createMainViewRouter(passport, superuserLowtags) {
  const authHandler = createAuthHandler(passport);
  const logger = createLogger();

  return new Router()
    .get('/', authHandler({failureRedirects: '/login'}), renderPoistot)
    .get('/login', authHandler({successRedirects: '/', allowUnauthorized: true}), renderLogin);


  function renderPoistot(req, res, next) {
    try {
      const renderedView = 'poistot';
      const {authorization} = req.user;
      const username = req.user.displayName || req.user.id || 'melinda-user';
      const lowTags = authorization.includes('KVP') ? superuserLowtags : authorization;
      const localVariable = {title: 'Poistot', username, lowTags, onload: 'initialize()'};

      return res.render(renderedView, localVariable);
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  function renderLogin(req, res) {
    const renderedView = 'loginpage';
    const localVariable = {title: 'Kirjaudu | Poistot', isLogin: true, onload: 'initialize()'};
    return res.render(renderedView, localVariable);
  }
}
