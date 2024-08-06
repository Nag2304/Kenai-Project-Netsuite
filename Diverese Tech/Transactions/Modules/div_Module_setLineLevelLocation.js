/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: div_Module_setLineLevelLocation.js
 * Author           Date       Version               Remarks
 * nagendrababu  08th Aug 2024  1.00            Populate Line Level Location
 *
 */

/* global define,log */

define([], () => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Set Line Level Location - Begin -------------------- */
  /**
   * Sets the header level location default across the line item location field for all transactions
   * @param {object} context
   * @returns {boolean}
   */
  const setLineLevelLocation = (context) => {
    const loggerTitle = ' Set Line Level Location ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      const tranRecord = context.newRecord;
      //

      // Header Location
      const headerLevelLocation = tranRecord.getValue({ fieldId: 'location' });

      // Retrieve Line Count
      const itemLineCount = tranRecord.getLineCount({ sublistId: 'item' });

      // Loop Through the Items
      for (let index = 0; index < itemLineCount; index++) {
        // Item
        const item = tranRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });

        // Location
        const lineLevelLocation = tranRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'location',
          line: index,
        });

        if (item && !lineLevelLocation) {
          tranRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            line: index,
            value: headerLevelLocation,
          });
          log.debug(
            loggerTitle,
            ' Location set Line Level with the Header Ones: ' +
              headerLevelLocation
          );
          //
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return true;
  };
  /* --------------------- Set Line Level Location - End -------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setLineLevelLocation;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
