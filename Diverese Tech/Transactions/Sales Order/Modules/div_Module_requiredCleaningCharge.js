/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: div_Module_requiredCleaningCharge.js
 * Author           Date       Version               Remarks
 * nagendrababu 12.10.2024      1.00       Initial creation of the script
 *
 */

/* global define,log */

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const CLEANING_CHARGE_ITEM_ID = 8677; // Internal ID for the Cleaning Charge item
  const CLEANING_CHARGE_FIELD_ID = 'custitem_dct_cleaning_charge';
  const VALID_ITEM_TYPES = ['InvtPart', 'Assembly', 'Service'];
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------- Cleaning Charge Calculation - Begin ------------------ */
  const cleaningChargeCalculation = (context, salesOrder) => {
    const loggerTitle = ' Cleaning Charge Calculation ';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    try {
      log.debug(loggerTitle, ' Type: ' + context.type);
      if (
        context.type == context.UserEventType.CREATE &&
        context.type == context.UserEventType.EDIT
      ) {
        return;
      }

      const lineCount = salesOrder.getLineCount({ sublistId: 'item' });
      log.debug(loggerTitle, ' Line Count: ' + lineCount);
      let cleaningChargeCount = 0;

      // Loop through each item line to determine how many Cleaning Charge lines are needed
      for (let i = 0; i < lineCount; i++) {
        const itemId = salesOrder.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });

        // Use search.lookupFields for performance
        const itemData = search.lookupFields({
          type: 'item',
          id: itemId,
          columns: ['type', CLEANING_CHARGE_FIELD_ID],
        });

        const isCleaningChargeRequired =
          itemData[CLEANING_CHARGE_FIELD_ID] === true;
        // `itemData.type` is an array; access `value` directly
        const itemType =
          itemData.type && itemData.type[0] ? itemData.type[0].value : null;

        log.debug(loggerTitle, { isCleaningChargeRequired, itemType });

        // Process only if the item type is valid and cleaning charge is required
        if (isCleaningChargeRequired && VALID_ITEM_TYPES.includes(itemType)) {
          cleaningChargeCount++;
        }
      }
      //
      log.debug(loggerTitle, ' Cleaning Charge Count: ' + cleaningChargeCount);

      // If cleaning charges are needed, add them
      if (cleaningChargeCount > 0) {
        // Remove existing Cleaning Charge lines (to avoid duplicates on edit)
        for (let i = lineCount - 1; i >= 0; i--) {
          const currentItem = salesOrder.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i,
          });

          if (currentItem == CLEANING_CHARGE_ITEM_ID) {
            salesOrder.removeLine({
              sublistId: 'item',
              line: i,
            });
            log.debug(loggerTitle, ' Removed Line Successfully.');
          }
        }

        log.debug(loggerTitle, ' Inserting new line');
        // Select a new line
        salesOrder.selectNewLine({ sublistId: 'item' });

        // Set the Cleaning Charge item
        salesOrder.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: CLEANING_CHARGE_ITEM_ID,
        });

        // Set the quantity to the calculated cleaning charge count
        salesOrder.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: cleaningChargeCount,
        });

        // Commit the line
        salesOrder.commitLine({ sublistId: 'item' });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
  };
  /* -------------------- Cleaning Charge Calculation - End ------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = cleaningChargeCalculation;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
