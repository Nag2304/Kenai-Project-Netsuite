/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define, log*/

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (context) => {
    const strLoggerTitle = 'Before Load';
    log.audit(
      strLoggerTitle,
      '|>-------------------' + strLoggerTitle + '- Entry-------------------<| '
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>-------------------' + strLoggerTitle + '- Exit-------------------<| '
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (context) => {
    const strLoggerTitle = 'Before Submit';
    log.audit(
      strLoggerTitle,
      '|>-------------------' + strLoggerTitle + '- Entry-------------------<| '
    );
    //
    try {
      const inboundShipmentRecord = context.newRecord;
      const landedCostCount = inboundShipmentRecord.getLineCount({
        sublistId: 'landedcost',
      });

      const landedCostAdded = inboundShipmentRecord.getValue({
        fieldId: 'custrecord_wdym_landed_cost_added',
      });

      log.debug(
        strLoggerTitle,
        'Landed Cost Count: ' +
          landedCostCount +
          ' Land Cost Added: ' +
          landedCostAdded
      );

      if (landedCostCount > 0 && landedCostAdded === false) {
        inboundShipmentRecord.setValue({
          fieldId: 'custrecord_wdym_landed_cost_added',
          value: true,
        });
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>-------------------' + strLoggerTitle + '- Exit-------------------<| '
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const strLoggerTitle = 'After Submit';
    log.audit(
      strLoggerTitle,
      '|>-------------------' + strLoggerTitle + '- Entry-------------------<| '
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>-------------------' + strLoggerTitle + '- Exit-------------------<| '
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ------------------------------ Exports - Begin ----------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
