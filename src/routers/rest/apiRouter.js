import HttpStatus from 'http-status';
import {Router} from 'express';
import {createApiClient as createRecordImportApiClient} from '@natlibfi/melinda-record-import-commons';
import {createLogger} from '@natlibfi/melinda-backend-commons';

export async function createApiRouter(recordImportApiOptions, keycloakOptions) {
  const logger = createLogger();
  // logger.info(JSON.stringify(recordImportApiOptions));
  // logger.info(JSON.stringify(keycloakOptions));
  const riApiClient = await createRecordImportApiClient(recordImportApiOptions, keycloakOptions);
  const {profileId} = recordImportApiOptions;

  return new Router()
    .post('/remove', createRemoveBlob);

  async function createRemoveBlob(req, res, next) {
    logger.info('api/ - remove');
    const {value: email} = req.user.emails.find(email => email.type === 'work');
    const {id: cataloger} = req.user;

    const {settings, data} = req.body;
    const {libraryTag, replicateToLocalDB, removeEmptyRecord, handleSubRecords} = settings;

    const dataToSend = replicateToLocalDB && removeEmptyRecord
      ? JSON.stringify({settings: {libraryTag, replicateToLocalDB, removeEmptyRecord: false, handleSubRecords}, data, email, cataloger})
      : JSON.stringify({settings: {libraryTag, replicateToLocalDB, removeEmptyRecord, handleSubRecords}, data, email, cataloger});

    try {
      const id = await riApiClient.createBlob({
        blob: dataToSend,
        type: 'application/json',
        profile: profileId,
      });

      logger.info(`Created new blob ${id}`);
      res.status(HttpStatus.OK).json({id}).end();
    } catch (error) {
      logger.info('api/ - remove - error');
      logger.error(error);
      next();
    }
  }
}