/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_setExpectedShipDate.js
 * Author           Date       Version               Remarks
 * nagendrababu  01.16.2025     1.01      Set Expected Ship Date on Line Level
 * Updated to respect custbody_scm_update_line_date checkbox
 */

/* global define, log */

define([], () => {
  const exports = {};

  const setExpectedShipDate = (scriptContext) => {
    const loggerTitle = 'Set Expected Ship Date';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Entry -------------------<|'
    );

    try {
      const salesOrderRecord = scriptContext.newRecord;

      log.debug(loggerTitle, `Script Context Type: ${scriptContext.type}`);

      if (scriptContext.type === 'edit') {
        // Retrieve the value of the checkbox field
        const shouldUpdateLineDates = salesOrderRecord.getValue({
          fieldId: 'custbody_scm_update_line_date',
        });
        if (!shouldUpdateLineDates) {
          log.debug(
            loggerTitle,
            'Update line schedule date checkbox is not checked. Exiting.'
          );
          return;
        }
      }

      const expectedShipDate = salesOrderRecord.getValue({
        fieldId: 'shipdate',
      });
      const lineItemCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });

      log.debug(loggerTitle, {
        expectedShipDate,
        lineItemCount,
      });

      for (let index = 0; index < lineItemCount; index++) {
        const lineExpectedShipDate = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'expectedshipdate',
          line: index,
        });

        if (lineExpectedShipDate !== expectedShipDate) {
          salesOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'expectedshipdate',
            line: index,
            value: expectedShipDate,
          });
          log.debug(
            loggerTitle,
            `Line Expected Ship Date updated at Index: ${index}`
          );
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Exit -------------------<|'
    );
  };

  exports.beforeSubmit = setExpectedShipDate;
  return exports;
});
