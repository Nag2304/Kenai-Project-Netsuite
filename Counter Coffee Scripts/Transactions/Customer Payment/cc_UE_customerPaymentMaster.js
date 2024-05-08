/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * File name: cc_UE_customerPaymentMaster.js
 * Script: CC | UE Customer Payment Master
 * Author           Date       Version               Remarks
 * mikewilliams   09/08/2023    1.00         Initial Creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses .
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record'], (record) => {
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
      const isCreate =
        scriptContext.type === scriptContext.UserEventType.CREATE;
      const isUpdate = scriptContext.type === scriptContext.UserEventType.EDIT;
      const isDelete =
        scriptContext.type === scriptContext.UserEventType.DELETE;

      log.debug(loggerTitle, 'Script Context Type: ' + scriptContext.type);

      if (!isDelete) {
        //
        if (isCreate || isUpdate) {
          const customerPaymentRecord = scriptContext.newRecord;

          const paymentMethod = customerPaymentRecord.getValue({
            fieldId: 'paymentmethod',
          });
          log.debug(loggerTitle, ' Payment Method: ' + paymentMethod);

          if (paymentMethod === 9 || paymentMethod === '9') {
            const lineItemCount = customerPaymentRecord.getLineCount({
              sublistId: 'apply',
            });

            if (lineItemCount > 0) {
              for (let index = 0; index < lineItemCount; index++) {
                const apply = customerPaymentRecord.getSublistValue({
                  sublistId: 'apply',
                  fieldId: 'apply',
                  line: index,
                });

                if (apply) {
                  const invoiceInternalId = parseInt(
                    customerPaymentRecord.getSublistValue({
                      sublistId: 'apply',
                      fieldId: 'internalid',
                      line: index,
                    })
                  );
                  record.submitFields({
                    type: record.Type.INVOICE,
                    id: invoiceInternalId,
                    values: {
                      custbody_ccc_paid_shopify: true,
                    },
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                  log.debug(
                    loggerTitle,
                    ' Invoice Record Saved Successfully ' + invoiceInternalId
                  );
                }
                //
              }
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
