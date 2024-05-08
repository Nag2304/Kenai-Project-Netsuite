/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * File name: teflar_UE_invoiceMaster.js
 * Script: Telfar | UE Customer Invoice Master
 * Author           Date       Version               Remarks
 * nagendrababu   09.16.2023   1.00          Initial Creation of the Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses .
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/file', 'N/record'], (file, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const beforeLoad = (scriptContext) => {
    const loggerTitle = 'Before Load';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------------- Before Load - End ---------------------------- */
  //
  /* --------------------------- Before Submit - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const beforeSubmit = (scriptContext) => {
    const loggerTitle = 'Before Submit';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
      const invoiceRecord = scriptContext.newRecord;

      const invoiceLocation = invoiceRecord.getValue({ fieldId: 'location' });
      log.debug(loggerTitle, 'Invoice Location: ' + invoiceLocation);

      if (invoiceLocation) {
        const locationRecordLoad = record.load({
          type: record.Type.LOCATION,
          id: invoiceLocation,
        });

        if (Object.keys(locationRecordLoad).length > 0) {
          const locationLogoId = locationRecordLoad.getValue({
            fieldId: 'logo',
          });
          log.debug(loggerTitle, 'Location Logo ID: ' + locationLogoId);
          //
          if (locationLogoId) {
            const fileObj = file.load({
              id: locationLogoId,
            });
            log.debug(loggerTitle + 'file obj', fileObj);

            if (Object.keys(fileObj).length > 0) {
              const url = 'https://6922326-sb1.app.netsuite.com' + fileObj.url;
              log.debug(loggerTitle, 'Logo URL: ' + url);
              //
              // Set the URL
              if (url) {
                invoiceRecord.setValue({
                  fieldId: 'custbody_location_logo',
                  value: url,
                });
              }
              //
            }
          }
        }
        //
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------------- Before Submit - End ---------------------------- */
  //
  /* --------------------------- After Submit - Begin --------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const afterSubmit = (scriptContext) => {
    const loggerTitle = 'After Submit';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------------- After Submit - End ---------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
