import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';
import {parseBoolean} from '@natlibfi/melinda-commons';

// Basic https
export const httpsPort = readEnvironmentVariable('HTTPS_PORT', {defaultValue: 8080, format: v => Number(v)});
export const tlsKeyPath = readEnvironmentVariable('TLS_KEY_PATH', {defaultValue: false});
export const tlsCertPath = readEnvironmentVariable('TLS_CERT_PATH', {defaultValue: false});
export const allowSelfSignedApiCert = readEnvironmentVariable('ALLOW_API_SELF_SIGNED', {defaultValue: false, format: parseBoolean});

export const superuserLowtags = readEnvironmentVariable('SUPERUSER_LOWTAGS', {defaultValue: [], format: (v) => JSON.parse(v)});

// Aleph login
export const xServiceURL = readEnvironmentVariable('ALEPH_X_SVC_URL');
export const userLibrary = readEnvironmentVariable('ALEPH_USER_LIBRARY');
export const ownAuthzURL = readEnvironmentVariable('OWN_AUTHZ_URL');
export const ownAuthzApiKey = readEnvironmentVariable('OWN_AUTHZ_API_KEY');
export const jwtOptions = {
  secretOrPrivateKey: readEnvironmentVariable('JWT_SECRET'),
  issuer: readEnvironmentVariable('JWT_ISSUER', {defaultValue: 'melinda-test.kansalliskirjasto.fi'}),
  audience: readEnvironmentVariable('JWT_AUDIENCE', {defaultValue: 'melinda-test.kansalliskirjasto.fi'}),
  algorithms: readEnvironmentVariable('JWT_ALGORITHMS', {defaultValue: ['HS512'], format: (v) => JSON.parse(v)})
};

export const recordImportApiOptions = {
  profileId: readEnvironmentVariable('RECORD_IMPORT_API_PROFILE_ID', {defaultValue: false}),
  recordImportApiUrl: readEnvironmentVariable('RECORD_IMPORT_API_URL', {defaultValue: false}),
  userAgent: readEnvironmentVariable('API_CLIENT_USER_AGENT', {defaultValue: '_RECORD-IMPORT-POISTOT'}),
  allowSelfSignedApiCert: readEnvironmentVariable('ALLOW_API_SELF_SIGNED', {defaultValue: false, format: parseBoolean}),
  cfHeader: readEnvironmentVariable('CF_HEADER', {defaultValue: undefined})
};

// Keycloak options
export const keycloakOptions = {
  issuerBaseURL: readEnvironmentVariable('KEYCLOAK_ISSUER_BASE_URL', {defaultValue: 'KEYCLOAK_ISSUER_BASE_URL env is not set!'}),
  serviceClientID: readEnvironmentVariable('KEYCLOAK_SERVICE_CLIENT_ID', {defaultValue: 'KEYCLOAK_SERVICE_CLIENT_ID env is not set!'}),
  serviceClientSecret: readEnvironmentVariable('KEYCLOAK_SERVICE_CLIENT_SECRET', {defaultValue: 'KEYCLOAK_SERVICE_CLIENT_SECRET env is not set!'})
};

export const sharedLocationOptions = {
  sharedPartialsLocation: readEnvironmentVariable('SHARED_PARTIALS_LOCATION', {defaultValue: '../node_modules/@natlibfi/melinda-ui-commons/src/views/partials'}),
  sharedPublicLocation: readEnvironmentVariable('SHARED_PUBLIC_LOCATION', {defaultValue: '../node_modules/@natlibfi/melinda-ui-commons/src'}),
  sharedViewsLocation: readEnvironmentVariable('SHARED_VIEWS_LOCATION', {defaultValue: '../node_modules/@natlibfi/melinda-ui-commons/src/views'})
};

