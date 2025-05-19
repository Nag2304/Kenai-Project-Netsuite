/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: div_Module_checkForUnits.js
 * Author           Date       Version               Remarks
 * nagendrababu 05.18.2025     1.00      Initial version of the script
 *
 */

/* global define,log */

define(['N/runtime', 'N/ui/dialog'], function (runtime, dialog) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const unitsLBValue = '3'; // UOM for lb
  const sendToInTouchField = 'custbody_kes_sendtointouch';
  const errorMessage =
    'There must be at least one line item with a UOM of lb. Please update the work order before sending to InTouch';
  /* ------------------------- Global Variables - End ------------------------- */

  /* ----------------------- Helper Functions - Begin ----------------------- */
  /**
   * Validates if at least one line item has UOM of lb.
   * @param {Object} recordObj - The NetSuite record object
   * @returns {boolean} - True if at least one line item has UOM lb, false otherwise
   */
  function validateUnits(recordObj) {
    const woLineItemCount = recordObj.getLineCount({
      sublistId: 'item',
    });

    for (var index = 0; index < woLineItemCount; index++) {
      const units = recordObj.getSublistValue({
        sublistId: 'item',
        fieldId: 'units',
        line: index,
      });
      if (units === unitsLBValue) {
        return true;
      }
    }
    return false;
  }
  /* ----------------------- Helper Functions - End ----------------------- */

  /* ----------------------- Check For Units UE - Begin ----------------------- */
  /**
   * User Event script to validate UOM before submit when Send to InTouch is TRUE, only for non-UI contexts.
   * @param {Object} context - User Event context
   */
  function checkForUnitsUE(context) {
    const loggerTitle = 'Check For Units UE';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );

    // Skip execution in UI context
    const execContext = runtime.executionContext;
    if (execContext === runtime.ContextType.USER_INTERFACE) {
      log.debug(loggerTitle, 'Skipping UE execution in UI context');
      return;
    }

    const workOrderRecord = context.newRecord;
    const sendToInTouch = workOrderRecord.getValue({
      fieldId: sendToInTouchField,
    });

    // Only validate if Send to InTouch is TRUE
    if (sendToInTouch) {
      const hasLBUnit = validateUnits(workOrderRecord);
      log.debug(
        loggerTitle,
        'Send to InTouch: ' +
          sendToInTouch +
          ', Has LB Unit: ' +
          hasLBUnit +
          ', Context: ' +
          execContext
      );

      if (!hasLBUnit) {
        throw errorMessage;
      }
    }

    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  }
  /* ----------------------- Check For Units UE - End ----------------------- */

  /* ----------------------- Check For Units Client - Begin ----------------------- */
  /**
   * Client script to validate UOM on save when Send to InTouch is TRUE.
   * @param {Object} context - Client Script context
   * @returns {boolean} - True to allow save, false to prevent save
   */
  function checkForUnitsClient(context) {
    const loggerTitle = 'Check For Units Client';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );

    try {
      const workOrderRecord = context.currentRecord;
      const sendToInTouch = workOrderRecord.getValue({
        fieldId: sendToInTouchField,
      });

      // Only validate if Send to InTouch is TRUE
      if (sendToInTouch) {
        const hasLBUnit = validateUnits(workOrderRecord);
        log.debug(
          loggerTitle,
          'Send to InTouch: ' + sendToInTouch + ', Has LB Unit: ' + hasLBUnit
        );

        if (!hasLBUnit) {
          // Display alert using N/ui/dialog
          dialog.alert({
            title: 'Validation Error',
            message: errorMessage,
          });
          return false; // Prevent saving
        }
      }
      return true; // Allow saving
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
      // Display error alert using N/ui/dialog
      dialog.alert({
        title: 'Error',
        message: 'An error occurred: ' + error.message,
      });
      return false; // Prevent saving on error
    }

    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  }
  /* ----------------------- Check For Units Client - End ----------------------- */

  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = checkForUnitsUE;
  exports.saveRecord = checkForUnitsClient;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
