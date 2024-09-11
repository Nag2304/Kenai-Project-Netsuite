/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name:wdym_Module_setReadyToFulfill.js
 * Author           Date       Version               Remarks
 * nagendrababu  11th Sep 2024  1.00         Initial creation of script
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set Ready To Fulfill - Begin ---------------------- */
  const setReadyToFulfill = (soRecord) => {
    const loggerTitle = ' Set Ready To Fulfill ';
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    let fulfill = false;
    try {
      const readyToFulfill = soRecord.getValue({
        fieldId: 'custbody_ready_to_fulfill_2',
      });

      const status = soRecord.getValue({ fieldId: 'status' });

      log.debug(loggerTitle, { readyToFulfill, status });

      if (
        !readyToFulfill &&
        status !== 'Cancelled' &&
        status !== 'Pending Approval' &&
        status !== 'Closed'
      ) {
        const lineCount = soRecord.getLineCount({
          sublistId: 'item',
        });

        let allLinesReady = false;

        for (let i = 0; i < lineCount; i++) {
          const itemType = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: i,
          });

          const isClosed = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'isclosed',
            line: i,
          });

          log.debug(loggerTitle, { itemType, lineNumber: i + 1, isClosed });

          if (itemType === 'InvtPart') {
            if (isClosed === false) {
              const readyToFulfill = soRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ready_for_fulfillment',
                line: i,
              });
              log.debug(loggerTitle, { readyToFulfill, lineNumber: i + 1 });
              if (readyToFulfill === true) {
                allLinesReady = true;
              } else {
                allLinesReady = false;
                break;
              }
            }
          }
        }

        //
        if (allLinesReady) {
          soRecord.setValue({
            fieldId: 'custbody_ready_to_fulfill_2',
            value: true,
          });
          log.debug(
            loggerTitle,
            ' Done setting the ready to fulfill 2nd box to true'
          );
          fulfill = true;
        }
        //
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
    return fulfill;
  };
  /* ---------------------- Set Ready To Fulfill - End ---------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = setReadyToFulfill;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
