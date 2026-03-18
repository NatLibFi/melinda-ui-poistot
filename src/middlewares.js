import {createLogger} from '@natlibfi/melinda-backend-commons';

/*****************************************************************************/
/* CUSTOM MIDDLEWARES FOR APP                                                */
/*****************************************************************************/

//---------------------------------------------------//
// Create loggers: use natlibfi middleware helpers
// appLogger is used for in-app (debug) logging

export const appLogger = createLogger();

export function pathCheck(req, res, next) {
  appLogger.info(`Path check: ${req.method} - ${req.path}`);
  next();
}

//---------------------------------------------------//
// Middleware function to handle 404 pages

export function handlePageNotFound(req, res, next) {
  //const {user} = req.oidc;
  const username = req.user.displayName ?? req.user.id ?? 'melinda-user';

  appLogger.warn(`Error: it seems that this page is not found!`);
  appLogger.verbose(`Request method: ${req.method} | Path: ${req.path} | Query parameters: ${JSON.stringify(req.query)}`);

  const renderedView = 'pageNotFound';
  const localVariable = {title: 'Sivua ei löydy', username};
  //const localVariable = {title: 'Sivua ei löydy', username: user.id};

  res.status(404);
  res.render(renderedView, localVariable);
}


//---------------------------------------------------//
//Middleware function to handle errors

export function handleAppError(err, req, res, next) {
  appLogger.info('APP: handleError');
  appLogger.error(err);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  const renderedView = 'error';
  const localVariable = {title: `Error | Poistot`};

  res.status(err.status || 500);
  res.render(renderedView, localVariable);
}

/**
* Create auth handler
*
* @param {Passport} [passport]
* @returns {Function;} - function to handle auth checkking and reroroute
*
* @example
* import passport from 'passport';
* passport.use(new Strategy({strategyOptions}, verify));
* app.use(passport.initialize());
* // create authHandler
* const authHandler = createAuthHandler(passport);
*/
export function createAuthHandler(passport) {
  return authHandler;

  /**
   * Middleware to check authentication using JWT strategy and handle redirection based on the result
   *
   * @param {object} [params={}]
   * @param {string} [params.failureRedirects] - url path to redirect to when error or no userdata after authentication
   * @param {string} [params.successRedirects] - url path to redirect to when authentication is successfull and accepted
   * @param {boolean} [params.allowUnauthorized=false] - option to give not logged in users access to, used for example with /login making sure authorized users dont get access to login again
   * @returns {Function} - middleware function to handle auth and reroroute
   *
   * @example
   * // Use without any redirection options, unauth unauthorized sends unauthorized response
   * app.get('/', authCheck(), (req, res) => {
   *     res.sendStatus(HttpStatus.OK);
   * });
   *
   * @example
   * // Redirect to /login if authentication fails
   * app.get('/', authCheck({ failureRedirect: '/login' }), (req, res) => {
   *     res.sendStatus(HttpStatus.OK);
   * });
   *
   * @example
   * // Redirect to /dashboard if authentication succeeds
   * app.get('/', authCheck({ successRedirect: '/dashboard' }), (req, res) => {
   *     res.sendStatus(HttpStatus.OK);
   * });
   *
   * @example
   * // Redirect to /login if authentication fails, and to /dashboard if authentication succeeds
   * app.get('/', authCheck({ failureRedirect: '/login', successRedirect: '/dashboard' }), (req, res) => {
   *     res.sendStatus(HttpStatus.OK);
   * });
   *
   */
  function authHandler(params = {}) {
    const {failureRedirects, successRedirects, allowUnauthorized = false} = params;
    return (req, res, next) => {
      // eslint-disable-next-line no-unused-vars
      passport.authenticate('jwt', {session: false}, (err, user, info) => {
        if (err || !user) {
          if (failureRedirects) {
            return res.redirect(failureRedirects);
          }
          if (allowUnauthorized) {
            return next();
          }
          return res.status(401).send('Unauthorized');
        }

        //make sure useradata is included in req
        req.user = user;

        if (successRedirects) {
          return res.redirect(successRedirects);
        }

        return next();
      })(req, res, next);
    };
  }
}
