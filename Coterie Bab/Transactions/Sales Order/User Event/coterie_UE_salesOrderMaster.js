/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * File name:coterie_UE_salesOrderMaster.js
 * Script: Coterie | UE Sales Order Master
 * Author           Date       Version               Remarks
 * mikewilliams   09.13.2023   1.00            Initial Creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses .
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define([], () => {
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
      const salesOrderRecord = scriptContext.newRecord;
      const salesOrderLineItemCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });
      const isCreate =
        scriptContext.type === scriptContext.UserEventType.CREATE;

      const headerLocation = salesOrderRecord.getValue({
        fieldId: 'location',
      });
      log.debug(loggerTitle, 'Header Location: ' + headerLocation);

      for (let index = 0; index < salesOrderLineItemCount; index++) {
        if (isCreate) {
          const lineLocation = salesOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            line: index,
          });
          log.debug(loggerTitle, 'Line Location: ' + lineLocation);

          if (headerLocation && headerLocation !== lineLocation) {
            salesOrderRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'location',
              line: index,
              value: headerLocation,
            });
          }
        }
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
