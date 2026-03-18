import express from 'express';
import {engine} from 'express-handlebars';
import path from 'path';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';
import cors from 'cors';

import {createExpressLogger} from '@natlibfi/melinda-backend-commons';

import {AlephStrategy} from '@natlibfi/passport-melinda-aleph';
import {MelindaJwtStrategy, verify, cookieExtractor} from '@natlibfi/passport-melinda-jwt';

import {createApiRouter, createAuthRouter, createStatusRouter, createMainViewRouter} from './routers/routers.js';
import {appLogger, pathCheck, handleAppError, handlePageNotFound} from './middlewares.js';

/*****************************************************************************/
/* START THE APP                                                             */
/*****************************************************************************/

//////////////////////////////////////////////////////////////////
// The function startApp creates server and returns it.
// The parameter is a set of environment variables

export async function startApp(configOptions) {
  // Basic https and app options
  const {httpsPort, tlsKeyPath, tlsCertPath, allowSelfSignedApiCert, sharedLocationOptions, superuserLowtags} = configOptions;

  // Auth login options
  const {xServiceURL, userLibrary, ownAuthzURL, ownAuthzApiKey, jwtOptions, keycloakOptions, recordImportApiOptions} = configOptions;

  const server = await initExpress();

  server.on('close', () => {
    logger.info('Shutting down softly');
  });

  return server;

  //////////////////////////////////////////////////////////////////


  //----------------------------------------------------//
  // Defining the Express server

  // Add async when you need await in route construction

  async function initExpress() {

    //---------------------------------------------------//
    // Set the application as an Express app (function)

    const app = express();

    //---------------------------------------------------//
    // Setup Alpeh authentication with passport
    appLogger.debug('Setting up auth');

    passport.use(new AlephStrategy({
      xServiceURL, userLibrary,
      ownAuthzURL, ownAuthzApiKey
    }));

    passport.use(new MelindaJwtStrategy({
      ...jwtOptions,
      secretOrKey: jwtOptions.secretOrPrivateKey,
      jwtFromRequest: cookieExtractor
    }, verify));

    app.use(passport.initialize());

    //---------------------------------------------------//
    // Setup Express Handlebars view engine
    appLogger.debug('Setting up view Engine');

    const {sharedPartialsLocation, sharedPublicLocation, sharedViewsLocation} = sharedLocationOptions;

    const handlebarsOptions = {
      extname: '.hbs',
      defaultLayout: 'default',
      layoutsDir: path.join(__dirname, 'views/layouts'),
      partialsDir: [
        {dir: path.join(__dirname, 'views/partials'), namespace: 'localPartials'},
        {dir: path.join(__dirname, sharedPartialsLocation), namespace: 'sharedPartials'}
      ],
      helpers: {
        shared(param) {
          return param.startsWith('/')
            ? `/shared${param}`
            : `sharedPartials/${param}`;
        },
        object({hash}) {
          return hash;
        },
        array() {
          return Array.from(arguments).slice(0, arguments.length - 1);
        }
      }
    };

    app.engine('.hbs', engine(handlebarsOptions));

    app.set('view engine', '.hbs');

    app.set('views', [
      path.join(__dirname, 'views'),
      path.join(__dirname, sharedViewsLocation)
    ]);


    //---------------------------------------------------//
    // Setup Express logger
    appLogger.debug('Setting up request logging and middlewares');

    app.use(createExpressLogger());
    app.use(cors());

    //---------------------------------------------------//
    // Setup Express built-in middleware function 'express.urlencoded'
    // option extended is set as false:
    //    data is parsed with querystring library

    app.use(express.urlencoded({extended: false}));


    //---------------------------------------------------//
    // Setup Express built-in middleware function 'express.json' and cookie parser
    //    parses requests with JSON payload

    app.use(express.json());
    app.use(cookieParser());

    //---------------------------------------------------//
    // Setup Express built-in middleware function 'express.static'
    // The directory where static assets are served from is given as argument.
    appLogger.debug('Setting up static paths');

    app.use('/shared', express.static(path.join(__dirname, sharedPublicLocation)));
    app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
    app.use('/styles', express.static(path.join(__dirname, 'styles')));

    app.use(pathCheck);
    //---------------------------------------------------//
    // Setup Express Routers for these defined routes
    //   - require authentication to all but status route
    appLogger.debug('Setting up active paths');

    app.use('/', createMainViewRouter(passport, superuserLowtags));
    app.use('/status', createStatusRouter());
    app.use('/logout', passport.authenticate('jwt', {session: false}), (req, res) => {
      res.redirect('/auth/logout');
    });
    app.use('/api', passport.authenticate('jwt', {session: false}), await createApiRouter(recordImportApiOptions, keycloakOptions));
    app.use('/auth', createAuthRouter(passport, jwtOptions));

    //---------------------------------------------------//
    // Setup handling for all other routes
    // When page is not found:
    //    -catch 404 and forward to error handler
    appLogger.debug('Setting up 404 page');

    app.use(handlePageNotFound);


    //---------------------------------------------------//
    // Setup Express error handler
    appLogger.debug('Setting up error handling');

    app.use(handleAppError);


    //----------------------------------------------------//
    // Setup server to listen for connections on the specified port
    if (!tlsKeyPath || !tlsCertPath) {
      const server = app.listen(httpsPort, () => appLogger.info(`Started Melinda Poistot in port ${httpsPort}`));
      return server;
    }


    const tlsConfig = {
      key: fs.readFileSync(tlsKeyPath, 'utf8'),
      cert: fs.readFileSync(tlsCertPath, 'utf8'),
      rejectUnauthorized: allowSelfSignedApiCert
    };

    return https.createServer(tlsConfig, app).listen(httpsPort, appLogger.log('info', `Started Melinda Poistot in port ${httpsPort}`));
  }
}
