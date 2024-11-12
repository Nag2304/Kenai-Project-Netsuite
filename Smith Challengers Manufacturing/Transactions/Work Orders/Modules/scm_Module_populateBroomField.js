/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_populateBroomField.js
 * Author           Date       Version               Remarks
 * nagendrababu 12th Nov 2024   1.00    Initial creation of the script
 *
 */

/* global define,log */

define(['N/record'], (record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Populate Broom Field - Begin ---------------------- */
  /**
   *
   * @param {Object} scriptContext
   */
  const populateBroomField = (scriptContext, workOrderRecord) => {
    const loggerTitle = ' Populate Broom Field ';
    log.debug(
      loggerTitle,
      `|>-------------------${loggerTitle} - Entry-------------------<|`
    );
    //
    let broomFieldPopulated = false;
    try {
      const isCreate =
        scriptContext.type === scriptContext.UserEventType.CREATE;

      if (isCreate) {
        //
        const createdFromField = workOrderRecord.getValue({
          fieldId: 'createdfrom',
        });
        log.debug(`${loggerTitle}`, ` Created From Field: ${createdFromField}`);

        if (createdFromField) {
          const soDetails = getSODetails(createdFromField, workOrderRecord);
          log.debug(`${loggerTitle} SO DETAILS`, soDetails);
          if (soDetails.broom) {
            workOrderRecord.setValue({
              fieldId: 'custbody_scm_broom_for_sweeper',
              value: soDetails.broom,
            });
            broomFieldPopulated = true;
          }
          //
          log.debug(`${loggerTitle}`, `Broom Field:${broomFieldPopulated}`);
        }
      }
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      `|>-------------------${loggerTitle} - Exit-------------------<|`
    );
    return broomFieldPopulated;
  };
  /* ---------------------- Populate Broom Field - End ---------------------- */
  //
  /* ---------------------- Helper Functions - Begin ---------------------- */
  //
  /* *********************** getSODetails - Begin *********************** */
  /**
   *
   * @param {*} soId
   * @param {*} woRec
   */
  const getSODetails = (soId, woRec) => {
    const loggerTitle = ' Get SO Details';
    log.debug(
      loggerTitle,
      `|>-------------------${loggerTitle} - Entry-------------------<|`
    );
    //
    const soDetails = {
      broom: '',
    };
    try {
      log.debug(`${loggerTitle}`, `SO ID: ${soId}`);
      if (soId) {
        const salesOrderRecord = record.load({
          type: record.Type.SALES_ORDER,
          id: soId,
        });
        //
        const salesOrderLineCount = salesOrderRecord.getLineCount({
          sublistId: 'item',
        });
        //
        for (let index = 0; index < salesOrderLineCount; index++) {
          const workOrderId = salesOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'woid',
            line: index,
          });
          log.debug(
            `${loggerTitle}`,
            ` WORK ORDER ID: ${workOrderId} WO ID: ${woRec.id}`
          );
          if (workOrderId == woRec.id) {
            soDetails.broom = salesOrderRecord.getSublistText({
              sublistId: 'item',
              fieldId: 'custcol_scm_broom',
              line: index,
            });
            log.debug(`${loggerTitle}`, `Broom: ${soDetails.broom}`);
            break;
          }
        }
      }
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      `|>-------------------${loggerTitle} - Exit-------------------<|`
    );
    return soDetails;
  };
  /* *********************** getSODetails - End *********************** */
  //
  /* ---------------------- Helper Functions - End ---------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = populateBroomField;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
